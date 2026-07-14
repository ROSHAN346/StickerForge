import re
import json
import logging
from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Body, Response
from fastapi.responses import StreamingResponse
from telethon_client import (
    create_sticker_set_user, send_sticker_user, add_sticker_to_set_user,
    get_sticker_set_detail_user, check_sticker_set_exists_user,
    delete_sticker_from_set_user, set_sticker_emoji_list_user,
    set_sticker_position_in_set_user, delete_sticker_set_user,
    remix_sticker_set_user, _get_client, get_all_sticker_sets_user,
)
from models import (
    CreatePackResponse, ShareStickerResponse, AddStickersResponse,
    StickerSetDetail, DeleteStickerResponse, UpdateEmojiResponse,
    ReorderStickerResponse, DeletePackResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _slugify_title(title: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9_]", "", title)
    if not slug:
        slug = "sticker"
    return slug[:50]


def _normalize_pack_name(raw: str) -> str:
    name = raw.strip()
    if "t.me/addstickers/" in name:
        name = name.split("t.me/addstickers/")[-1]
    if "telegram.org/addstickers/" in name:
        name = name.split("telegram.org/addstickers/")[-1]
    if name.startswith("https://"):
        name = name.split("/")[-1]
    return name.strip().lstrip("/")


@router.post("/api/user-stickers/create", response_model=CreatePackResponse)
async def user_create_pack(
    session_string: str = Form(...),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    title: str = Form(...),
    files: list[UploadFile] = File(...),
    emoji_lists: str = Form(...),
):
    import json
    logger.info("user_create_pack: title=%s, files=%d", title, len(files))

    emojis: list[list[str]] = json.loads(emoji_lists)
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) != len(emojis):
        raise HTTPException(
            status_code=400,
            detail=f"Files count ({len(files)}) != emoji lists count ({len(emojis)})",
        )

    base_slug = _slugify_title(title)
    short_name = f"{base_slug}_by_user"

    try:
        exists = await check_sticker_set_exists_user(session_string, api_id, api_hash, short_name)
        if exists:
            suffix = 2
            while True:
                short_name = f"{base_slug}{suffix}_by_user"
                exists = await check_sticker_set_exists_user(session_string, api_id, api_hash, short_name)
                if not exists:
                    break
                suffix += 1
    except Exception:
        pass

    try:
        raw_files = []
        filenames = []
        mime_types = []
        flat_emojis = []
        for i, (upload, emoji_list) in enumerate(zip(files, emojis)):
            raw = await upload.read()
            raw_files.append(raw)
            filenames.append(upload.filename or f"sticker_{i}")
            mime_types.append(upload.content_type or "")
            flat_emojis.append(emoji_list[0] if emoji_list else "😀")

        result = await create_sticker_set_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            title=title,
            short_name=short_name,
            files=raw_files,
            filenames=filenames,
            mime_types=mime_types,
            emojis=flat_emojis,
        )
        return CreatePackResponse(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_create_pack failed: %s", msg)
        if "SHORT_NAME_OCCUPIED" in msg:
            raise HTTPException(status_code=409, detail="A pack with this name already exists. Try a different title.")
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/add", response_model=AddStickersResponse)
async def user_add_stickers(
    session_string: str = Form(...),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    pack_name: str = Form(...),
    files: list[UploadFile] = File(...),
    emoji_lists: str = Form(...),
):
    import json
    logger.info("user_add_stickers: pack=%s, files=%d", pack_name, len(files))

    pack_name = _normalize_pack_name(pack_name)

    emojis: list[list[str]] = json.loads(emoji_lists)
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) != len(emojis):
        raise HTTPException(
            status_code=400,
            detail=f"Files count ({len(files)}) != emoji lists count ({len(emojis)})",
        )

    try:
        raw_files = []
        filenames = []
        mime_types = []
        flat_emojis = []
        for i, (upload, emoji_list) in enumerate(zip(files, emojis)):
            raw = await upload.read()
            raw_files.append(raw)
            filenames.append(upload.filename or f"sticker_{i}")
            mime_types.append(upload.content_type or "")
            flat_emojis.append(emoji_list[0] if emoji_list else "😀")

        result = await add_sticker_to_set_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            pack_name=pack_name,
            files=raw_files,
            filenames=filenames,
            mime_types=mime_types,
            emojis=flat_emojis,
        )
        return AddStickersResponse(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_add_stickers failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/share", response_model=ShareStickerResponse)
async def user_share_pack(
    session_string: str = Form(...),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    chat_id: int = Form(...),
    pack_name: str = Form(...),
):
    logger.info("user_share_pack: chat_id=%s, pack=%s", chat_id, pack_name)

    pack_name = _normalize_pack_name(pack_name)

    try:
        result = await send_sticker_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            chat_id=chat_id,
            pack_name=pack_name,
        )
        return ShareStickerResponse(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_share_pack failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/detail", response_model=StickerSetDetail)
async def user_sticker_detail(
    session_string: str = Body(..., embed=True),
    api_id: int = Body(..., embed=True),
    api_hash: str = Body(..., embed=True),
    pack_name: str = Body(..., embed=True),
):
    logger.info("user_sticker_detail: pack=%s", pack_name)
    pack_name = _normalize_pack_name(pack_name)
    try:
        result = await get_sticker_set_detail_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            pack_name=pack_name,
        )
        return StickerSetDetail(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_sticker_detail failed: %s", msg)
        raise HTTPException(status_code=404, detail=f"Pack not found: {msg}")


@router.post("/api/user-stickers/delete-sticker", response_model=DeleteStickerResponse)
async def user_delete_sticker(
    session_string: str = Body(..., embed=True),
    api_id: int = Body(..., embed=True),
    api_hash: str = Body(..., embed=True),
    sticker_id: int = Body(..., embed=True),
):
    logger.info("user_delete_sticker: sticker_id=%s", sticker_id)
    try:
        result = await delete_sticker_from_set_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            sticker_id=sticker_id,
        )
        return DeleteStickerResponse(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_delete_sticker failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/update-emoji", response_model=UpdateEmojiResponse)
async def user_update_emoji(
    session_string: str = Body(..., embed=True),
    api_id: int = Body(..., embed=True),
    api_hash: str = Body(..., embed=True),
    sticker_id: int = Body(..., embed=True),
    emoji: str = Body(..., embed=True),
):
    logger.info("user_update_emoji: sticker_id=%s, emoji=%s", sticker_id, emoji)
    try:
        result = await set_sticker_emoji_list_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            sticker_id=sticker_id,
            emoji=emoji,
        )
        return UpdateEmojiResponse(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_update_emoji failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/reorder", response_model=ReorderStickerResponse)
async def user_reorder_sticker(
    session_string: str = Body(..., embed=True),
    api_id: int = Body(..., embed=True),
    api_hash: str = Body(..., embed=True),
    sticker_id: int = Body(..., embed=True),
    position: int = Body(..., embed=True),
):
    logger.info("user_reorder_sticker: sticker_id=%s, position=%d", sticker_id, position)
    try:
        result = await set_sticker_position_in_set_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            sticker_id=sticker_id,
            position=position,
        )
        return ReorderStickerResponse(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_reorder_sticker failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/delete", response_model=DeletePackResponse)
async def user_delete_pack(
    session_string: str = Body(..., embed=True),
    api_id: int = Body(..., embed=True),
    api_hash: str = Body(..., embed=True),
    pack_name: str = Body(..., embed=True),
):
    logger.info("user_delete_pack: pack=%s", pack_name)
    pack_name = _normalize_pack_name(pack_name)
    try:
        result = await delete_sticker_set_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            pack_name=pack_name,
        )
        return DeletePackResponse(success=True, pack_name=pack_name, message=result["message"])
    except Exception as e:
        msg = str(e)
        logger.error("user_delete_pack failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/remix", response_model=CreatePackResponse)
async def user_remix_pack(
    session_string: str = Form(...),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    source_pack_name: str = Form(...),
    new_title: str = Form(...),
    selected_stickers: str = Form(...),
    files: list[UploadFile] = File(...),
    emoji_lists: str = Form(...),
):
    logger.info("user_remix_pack: source=%s, title=%s", source_pack_name, new_title)

    source_pack_name = _normalize_pack_name(source_pack_name)

    selected: list[dict] = json.loads(selected_stickers)
    new_emojis_flat: list[str] = json.loads(emoji_lists)
    new_emojis_flat = [e[0] if isinstance(e, list) and e else e if isinstance(e, str) else "😀" for e in new_emojis_flat]

    if not selected and not files:
        raise HTTPException(status_code=400, detail="Select at least one sticker or upload a file")

    base_slug = _slugify_title(new_title)
    short_name = f"{base_slug}_by_user"

    try:
        exists = await check_sticker_set_exists_user(session_string, api_id, api_hash, short_name)
        if exists:
            suffix = 2
            while True:
                short_name = f"{base_slug}{suffix}_by_user"
                exists = await check_sticker_set_exists_user(session_string, api_id, api_hash, short_name)
                if not exists:
                    break
                suffix += 1
    except Exception:
        pass

    try:
        raw_files = []
        filenames = []
        mime_types = []
        for i, upload in enumerate(files):
            raw = await upload.read()
            raw_files.append(raw)
            filenames.append(upload.filename or f"sticker_{i}")
            mime_types.append(upload.content_type or "")

        result = await remix_sticker_set_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
            source_pack_name=source_pack_name,
            new_title=new_title,
            new_short_name=short_name,
            selected_stickers=selected,
            files=raw_files,
            filenames=filenames,
            mime_types=mime_types,
            new_emojis=new_emojis_flat,
        )
        return CreatePackResponse(**result)
    except Exception as e:
        msg = str(e)
        logger.error("user_remix_pack failed: %s", msg)
        if "SHORT_NAME_OCCUPIED" in msg:
            raise HTTPException(status_code=409, detail="A pack with this name already exists. Try a different title.")
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user-stickers/sticker-images")
async def user_sticker_images(
    session_string: str = Body(..., embed=True),
    api_id: int = Body(..., embed=True),
    api_hash: str = Body(..., embed=True),
    pack_name: str = Body(..., embed=True),
):
    from telethon.tl.functions.messages import GetStickerSetRequest
    from telethon.tl.types import InputStickerSetShortName
    from telethon.errors import FloodWaitError
    import base64
    import asyncio

    pack_name = _normalize_pack_name(pack_name)
    client = await _get_client(session_string, api_id, api_hash)
    try:
        sticker_set = await client(
            GetStickerSetRequest(
                stickerset=InputStickerSetShortName(short_name=pack_name),
                hash=0,
            )
        )
        docs = sticker_set.documents
        results = []

        for doc in docs:
            data = None
            mime = "image/png"
            doc_mime = getattr(doc, 'mime_type', None) or "image/png"
            is_video = doc_mime == "video/webm"

            if is_video:
                try:
                    data = await client.download_media(doc, file=bytes)
                    if data:
                        mime = "video/webm"
                except FloodWaitError:
                    data = None
                except Exception:
                    data = None

                if not data:
                    try:
                        data = await client.download_media(doc, thumb=-1, file=bytes)
                        if data:
                            mime = "image/webp"
                    except Exception:
                        data = None
            else:
                try:
                    data = await client.download_media(doc, thumb=-1, file=bytes)
                    if data:
                        mime = doc_mime if doc_mime.startswith("image/") else "image/webp"
                except FloodWaitError:
                    data = None
                except Exception:
                    data = None

                if not data:
                    try:
                        thumbs = getattr(doc, 'thumbs', None) or getattr(doc, 'thumb', None)
                        if thumbs:
                            target = thumbs[0] if isinstance(thumbs, list) else thumbs
                            data = await client.download_media(target, file=bytes)
                            if data:
                                mime = doc_mime if doc_mime.startswith("image/") else "image/webp"
                    except Exception:
                        data = None

                if not data:
                    try:
                        data = await client.download_media(doc, file=bytes)
                        if data:
                            mime = doc_mime if doc_mime.startswith("image/") else "image/png"
                    except Exception:
                        data = None

            if data:
                results.append({
                    "data": base64.b64encode(data).decode('utf-8'),
                    "mime": mime,
                })
            else:
                results.append(None)

            await asyncio.sleep(0.3)

        return {"stickers": results}
    finally:
        await client.disconnect()


@router.post("/api/user-stickers/all")
async def user_all_stickers(
    session_string: str = Body(..., embed=True),
    api_id: int = Body(..., embed=True),
    api_hash: str = Body(..., embed=True),
):
    logger.info("user_all_stickers: fetching all installed packs")
    try:
        packs = await get_all_sticker_sets_user(
            session_string=session_string,
            api_id=api_id,
            api_hash=api_hash,
        )
        return {"packs": packs}
    except Exception as e:
        msg = str(e)
        logger.error("user_all_stickers failed: %s", msg)
        raise HTTPException(status_code=400, detail=msg)
