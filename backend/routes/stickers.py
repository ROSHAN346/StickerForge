import re
import json
import asyncio
import logging
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import Optional
from telegram_api import (
    upload_sticker_file,
    create_new_sticker_set,
    add_sticker_to_set,
    get_sticker_set,
    delete_sticker_set,
    delete_sticker_from_set,
    set_sticker_emoji_list,
    set_sticker_position_in_set,
    download_file,
    send_sticker,
    send_message,
    get_file,
)
from file_processor import process_file
from models import (
    CreatePackResponse, AddStickersResponse, StickerSetRequest, StickerSetInfo,
    ShareStickerResponse, StickerSetDetail, StickerItem, DeletePackResponse,
    DeleteStickerResponse, UpdateEmojiResponse, ReorderStickerResponse, StickerActionRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _slugify_title(title: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]", "", title)
    if not slug:
        slug = "sticker"
    return slug[:50]


def _make_pack_name(title: str, bot_username: str, suffix: int = 0) -> str:
    slug = _slugify_title(title)
    if suffix > 0:
        slug = f"{slug}{suffix}"
    return f"{slug}_by_{bot_username.lower()}"


def _normalize_pack_name(raw: str) -> str:
    name = raw.strip()
    if "t.me/addstickers/" in name:
        name = name.split("t.me/addstickers/")[-1]
    if "telegram.org/addstickers/" in name:
        name = name.split("telegram.org/addstickers/")[-1]
    if name.startswith("https://"):
        name = name.split("/")[-1]
    return name.strip().lstrip("/")


@router.post("/api/stickers/create", response_model=CreatePackResponse)
async def create_pack(
    token: str = Form(...),
    user_id: int = Form(...),
    title: str = Form(...),
    bot_username: str = Form(...),
    files: list[UploadFile] = File(...),
    emoji_lists: str = Form(...),
):
    logger.info("create_pack: user_id=%s, title=%s, bot=%s, files=%d",
                user_id, title, bot_username, len(files))

    emojis: list[list[str]] = json.loads(emoji_lists)
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) != len(emojis):
        raise HTTPException(
            status_code=400,
            detail=f"Files count ({len(files)}) != emoji lists count ({len(emojis)})",
        )

    pack_name = _make_pack_name(title, bot_username)
    logger.info("Initial pack_name: %s", pack_name)

    try:
        existing = await get_sticker_set(token, pack_name)
        suffix = 2
        while existing:
            pack_name = _make_pack_name(title, bot_username, suffix)
            logger.info("Pack exists, trying: %s", pack_name)
            try:
                existing = await get_sticker_set(token, pack_name)
                suffix += 1
            except RuntimeError:
                break
    except RuntimeError:
        pass

    logger.info("Final pack_name: %s", pack_name)

    stickers_meta: list[dict] = []

    try:
        for i, (upload, emoji_list) in enumerate(zip(files, emojis)):
            raw = await upload.read()
            data, ext, fmt = await process_file(raw, upload.filename or f"sticker_{i}", upload.content_type)
            logger.info("File %d: %s -> %s format, %d bytes after processing",
                        i, upload.filename, fmt, len(data))
            file_id = await upload_sticker_file(
                token, user_id, data, f"sticker_{i}.{ext}", fmt
            )
            stickers_meta.append({
                "sticker": file_id,
                "format": fmt,
                "emoji_list": emoji_list,
            })

        await create_new_sticker_set(token, user_id, pack_name, title, stickers_meta)

        try:
            verify = await get_sticker_set(token, pack_name)
            actual_name = verify.get("name", pack_name)
        except RuntimeError:
            actual_name = pack_name
    except RuntimeError as e:
        msg = str(e)
        logger.error("create_pack failed: %s", msg)
        if "user not found" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail="User not found. You must send /start to your bot in Telegram first, then try again.",
            )
        if "sticker set name is already occupied" in msg.lower():
            raise HTTPException(
                status_code=409,
                detail="A pack with this name already exists. Try a different title.",
            )
        raise HTTPException(status_code=400, detail=msg)

    link = f"https://t.me/addstickers/{actual_name}"
    logger.info("create_pack success: %s", link)
    return CreatePackResponse(
        success=True,
        pack_name=actual_name,
        pack_link=link,
        message="Sticker pack created successfully!",
    )


@router.post("/api/stickers/add", response_model=AddStickersResponse)
async def add_stickers(
    token: str = Form(...),
    user_id: int = Form(...),
    pack_name: str = Form(...),
    files: list[UploadFile] = File(...),
    emoji_lists: str = Form(...),
):
    logger.info("add_stickers: user_id=%s, pack=%s, files=%d",
                user_id, pack_name, len(files))

    emojis: list[list[str]] = json.loads(emoji_lists)
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) != len(emojis):
        raise HTTPException(
            status_code=400,
            detail=f"Files count ({len(files)}) != emoji lists count ({len(emojis)})",
        )

    pack_name = _normalize_pack_name(pack_name)

    try:
        info = await get_sticker_set(token, pack_name)
        pack_name = info["name"]
        current_count = len(info.get("stickers", []))
        logger.info("Pack %s has %d stickers", pack_name, current_count)
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=f"Pack not found: {e}")

    max_stickers = 200 if info.get("sticker_type") == "custom_emoji" else 120
    if current_count + len(files) > max_stickers:
        raise HTTPException(
            status_code=400,
            detail=f"Pack is full. Max {max_stickers} stickers, currently has {current_count}, trying to add {len(files)}.",
        )

    added = 0
    try:
        for i, (upload, emoji_list) in enumerate(zip(files, emojis)):
            raw = await upload.read()
            data, ext, fmt = await process_file(
                raw, upload.filename or f"sticker_{i}", upload.content_type
            )
            logger.info("File %d: %s -> %s format, %d bytes", i, upload.filename, fmt, len(data))
            file_id = await upload_sticker_file(
                token, user_id, data, f"sticker_{i}.{ext}", fmt
            )
            sticker = {
                "sticker": file_id,
                "format": fmt,
                "emoji_list": emoji_list,
            }
            await add_sticker_to_set(token, user_id, pack_name, sticker)
            added += 1
    except RuntimeError as e:
        msg = str(e)
        logger.error("add_stickers failed at sticker %d: %s", added, msg)
        if "user not found" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail="User not found. You must send /start to your bot in Telegram first, then try again.",
            )
        if "STICKERSET_INVALID" in msg:
            raise HTTPException(
                status_code=400,
                detail="This pack was created by a different bot. Only the bot that created the pack can add stickers to it. Try Remix instead to create a new pack with these stickers.",
            )
        raise HTTPException(status_code=400, detail=msg)

    link = f"https://t.me/addstickers/{pack_name}"
    logger.info("add_stickers success: %d added to %s", added, pack_name)
    return AddStickersResponse(
        success=True,
        pack_link=link,
        stickers_added=added,
        message=f"{added} sticker(s) added to pack!",
    )


@router.post("/api/sticker-set", response_model=StickerSetInfo)
async def sticker_set_info(req: StickerSetRequest):
    pack_name = _normalize_pack_name(req.name)
    try:
        info = await get_sticker_set(req.token, pack_name)
    except RuntimeError as e:
        msg = str(e)
        if "STICKERSET_INVALID" in msg:
            raise HTTPException(
                status_code=404,
                detail=f"Pack '{pack_name}' not found. Make sure you entered the pack name (e.g. mypack_by_bot), not the title or full URL.",
            )
        raise HTTPException(status_code=404, detail=str(e))
    return StickerSetInfo(
        name=info["name"],
        title=info["title"],
        sticker_type=info.get("sticker_type", "regular"),
        sticker_count=len(info.get("stickers", [])),
    )


@router.post("/api/stickers/share", response_model=ShareStickerResponse)
async def share_sticker_pack(
    token: str = Form(...),
    chat_id: int = Form(...),
    pack_name: str = Form(...),
    send_link: bool = Form(False),
):
    logger.info("share_sticker_pack: chat_id=%s, pack=%s, send_link=%s",
                chat_id, pack_name, send_link)

    pack_name = _normalize_pack_name(pack_name)

    try:
        info = await get_sticker_set(token, pack_name)
        pack_name = info["name"]
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=f"Pack not found: {e}")

    stickers = info.get("stickers", [])
    if not stickers:
        raise HTTPException(status_code=400, detail="Pack has no stickers to share")

    sent = 0
    try:
        for sticker in stickers:
            file_id = sticker.get("file_id")
            if not file_id:
                continue
            await send_sticker(token, chat_id, file_id)
            sent += 1

        if send_link:
            link = f"https://t.me/addstickers/{pack_name}"
            await send_message(token, chat_id, f"Sticker pack: {link}")
    except RuntimeError as e:
        msg = str(e)
        logger.error("share_sticker_pack failed at sticker %d: %s", sent, msg)
        if "forbidden" in msg.lower() and "initiate" in msg.lower():
            raise HTTPException(
                status_code=403,
                detail="The recipient hasn't started the bot yet. Ask them to send /start to your bot first, then try again.",
            )
        if "chat not found" in msg.lower():
            raise HTTPException(
                status_code=404,
                detail="Chat not found. Make sure the chat ID is correct and the recipient has started the bot.",
            )
        raise HTTPException(status_code=400, detail=msg)

    link = f"https://t.me/addstickers/{pack_name}"
    logger.info("share_sticker_pack success: %d stickers sent to %s", sent, chat_id)
    return ShareStickerResponse(
        success=True,
        stickers_sent=sent,
        pack_link=link,
        message=f"{sent} sticker(s) sent successfully!",
    )


@router.post("/api/stickers/detail", response_model=StickerSetDetail)
async def sticker_set_detail(req: StickerSetRequest):
    pack_name = _normalize_pack_name(req.name)
    logger.info("sticker_set_detail: pack=%s", pack_name)

    try:
        info = await get_sticker_set(req.token, pack_name)
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=f"Pack not found: {e}")

    raw_stickers = info.get("stickers", [])

    async def _fetch_file_path(file_id: str) -> str:
        if not file_id:
            return ""
        try:
            file_info = await get_file(req.token, file_id)
            return file_info.get("file_path", "")
        except RuntimeError:
            return ""

    file_ids = []
    for s in raw_stickers:
        if s.get("is_video", False):
            file_ids.append(s.get("file_id", ""))
        else:
            file_ids.append(s.get("thumbnail", {}).get("file_id") or s.get("file_id", ""))
    file_paths = await asyncio.gather(*[_fetch_file_path(fid) for fid in file_ids])

    sticker_items: list[StickerItem] = []
    for i, s in enumerate(raw_stickers):
        sticker_items.append(StickerItem(
            file_id=s.get("file_id", ""),
            emoji=s.get("emoji", ""),
            is_video=s.get("is_video", False),
            is_animated=s.get("is_animated", False),
            width=s.get("width", 512),
            height=s.get("height", 512),
            file_path=file_paths[i],
        ))

    logger.info("sticker_set_detail success: %d stickers, %d with file_path",
                len(sticker_items), sum(1 for s in sticker_items if s.file_path))

    return StickerSetDetail(
        name=info["name"],
        title=info["title"],
        sticker_type=info.get("sticker_type", "regular"),
        sticker_count=len(raw_stickers),
        stickers=sticker_items,
    )


@router.post("/api/stickers/delete", response_model=DeletePackResponse)
async def delete_pack(req: StickerSetRequest):
    pack_name = _normalize_pack_name(req.name)
    logger.info("delete_pack: pack=%s", pack_name)

    try:
        info = await get_sticker_set(req.token, pack_name)
        pack_name = info["name"]
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=f"Pack not found: {e}")

    try:
        await delete_sticker_set(req.token, pack_name)
    except RuntimeError as e:
        msg = str(e)
        logger.error("delete_pack failed: %s (name=%s)", msg, pack_name)
        raise HTTPException(status_code=400, detail=msg)

    logger.info("delete_pack success: %s", pack_name)
    return DeletePackResponse(
        success=True,
        pack_name=pack_name,
        message="Sticker pack deleted from Telegram successfully!",
    )


@router.post("/api/stickers/delete-sticker", response_model=DeleteStickerResponse)
async def delete_single_sticker(req: StickerActionRequest):
    logger.info("delete_single_sticker: sticker=%s", req.sticker[:20] + "...")
    try:
        await delete_sticker_from_set(req.token, req.sticker)
    except RuntimeError as e:
        msg = str(e)
        logger.error("delete_single_sticker failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)
    return DeleteStickerResponse(success=True, message="Sticker deleted successfully!")


@router.post("/api/stickers/update-emoji", response_model=UpdateEmojiResponse)
async def update_sticker_emoji(req: StickerActionRequest):
    if not req.emoji_list:
        raise HTTPException(status_code=400, detail="emoji_list is required")
    logger.info("update_sticker_emoji: sticker=%s, emojis=%s", req.sticker[:20] + "...", req.emoji_list)
    try:
        await set_sticker_emoji_list(req.token, req.sticker, req.emoji_list)
    except RuntimeError as e:
        msg = str(e)
        logger.error("update_sticker_emoji failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)
    return UpdateEmojiResponse(success=True, message="Sticker emoji updated successfully!")


@router.post("/api/stickers/reorder", response_model=ReorderStickerResponse)
async def reorder_sticker(req: StickerActionRequest):
    if req.position is None:
        raise HTTPException(status_code=400, detail="position is required")
    logger.info("reorder_sticker: sticker=%s, position=%d", req.sticker[:20] + "...", req.position)
    try:
        await set_sticker_position_in_set(req.token, req.sticker, req.position)
    except RuntimeError as e:
        msg = str(e)
        logger.error("reorder_sticker failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)
    return ReorderStickerResponse(success=True, message="Sticker reordered successfully!")


@router.post("/api/stickers/remix", response_model=CreatePackResponse)
async def remix_pack(
    token: str = Form(...),
    user_id: int = Form(...),
    source_pack_name: str = Form(...),
    new_title: str = Form(...),
    bot_username: str = Form(...),
    selected_stickers: str = Form(...),
    files: list[UploadFile] = File(...),
    emoji_lists: str = Form(...),
):
    logger.info("remix_pack: source=%s, title=%s, bot=%s",
                source_pack_name, new_title, bot_username)

    selected: list[dict] = json.loads(selected_stickers)
    new_emojis: list[list[str]] = json.loads(emoji_lists)

    if not selected and not files:
        raise HTTPException(status_code=400, detail="Select at least one sticker or upload a file")

    source_name = _normalize_pack_name(source_pack_name)
    try:
        source_info = await get_sticker_set(token, source_name)
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=f"Source pack not found: {e}")

    source_name = source_info["name"]
    source_stickers = source_info.get("stickers", [])

    pack_name = _make_pack_name(new_title, bot_username)
    try:
        existing = await get_sticker_set(token, pack_name)
        suffix = 2
        while existing:
            pack_name = _make_pack_name(new_title, bot_username, suffix)
            try:
                existing = await get_sticker_set(token, pack_name)
                suffix += 1
            except RuntimeError:
                break
    except RuntimeError:
        pass

    logger.info("remix: new pack_name=%s", pack_name)

    stickers_meta: list[dict] = []

    try:
        for sel in selected:
            idx = sel.get("index", -1)
            emoji = sel.get("emoji", "😀")
            if idx < 0 or idx >= len(source_stickers):
                continue
            s = source_stickers[idx]
            file_id = s.get("file_id", "")
            is_video = s.get("is_video", False)
            is_animated = s.get("is_animated", False)
            fmt = "video" if is_video else ("static" if not is_animated else "static")
            stickers_meta.append({
                "sticker": file_id,
                "format": fmt,
                "emoji_list": [emoji],
            })

        for i, (upload, emoji_list) in enumerate(zip(files, new_emojis)):
            raw = await upload.read()
            data, ext, fmt = await process_file(
                raw, upload.filename or f"sticker_{i}", upload.content_type
            )
            file_id = await upload_sticker_file(
                token, user_id, data, f"sticker_{i}.{ext}", fmt
            )
            stickers_meta.append({
                "sticker": file_id,
                "format": fmt,
                "emoji_list": emoji_list,
            })

        try:
            await create_new_sticker_set(token, user_id, pack_name, new_title, stickers_meta)
        except RuntimeError as e:
            msg = str(e)
            if "file_id" in msg.lower() or "sticker" in msg.lower() and "invalid" in msg.lower():
                logger.info("remix: file_id reuse failed, falling back to download+re-upload")

                stickers_meta_fallback: list[dict] = []
                for sel in selected:
                    idx = sel.get("index", -1)
                    emoji = sel.get("emoji", "😀")
                    if idx < 0 or idx >= len(source_stickers):
                        continue
                    s = source_stickers[idx]
                    file_id = s.get("file_id", "")
                    is_video = s.get("is_video", False)
                    fmt = "video" if is_video else "static"

                    file_info = await get_file(token, file_id)
                    file_path = file_info.get("file_path", "")
                    if not file_path:
                        continue
                    file_bytes = await download_file(token, file_path)
                    new_file_id = await upload_sticker_file(
                        token, user_id, file_bytes, f"remix_{idx}.{'webm' if is_video else 'png'}", fmt
                    )
                    stickers_meta_fallback.append({
                        "sticker": new_file_id,
                        "format": fmt,
                        "emoji_list": [emoji],
                    })

                stickers_meta_fallback.extend(
                    m for m in stickers_meta if m not in stickers_meta[:len(selected)]
                )

                await create_new_sticker_set(token, user_id, pack_name, new_title, stickers_meta_fallback)
            else:
                raise

        try:
            verify = await get_sticker_set(token, pack_name)
            actual_name = verify.get("name", pack_name)
        except RuntimeError:
            actual_name = pack_name

    except RuntimeError as e:
        msg = str(e)
        logger.error("remix_pack failed: %s", msg)
        if "user not found" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail="User not found. You must send /start to your bot in Telegram first, then try again.",
            )
        if "sticker set name is already occupied" in msg.lower():
            raise HTTPException(
                status_code=409,
                detail="A pack with this name already exists. Try a different title.",
            )
        raise HTTPException(status_code=400, detail=msg)

    link = f"https://t.me/addstickers/{actual_name}"
    logger.info("remix_pack success: %s", link)
    return CreatePackResponse(
        success=True,
        pack_name=actual_name,
        pack_link=link,
        message="Sticker pack remixed successfully!",
    )
