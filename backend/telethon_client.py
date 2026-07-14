import logging
import io
from typing import Any, Optional
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.functions.stickers import CreateStickerSetRequest, AddStickerToSetRequest
from telethon.tl.types import InputStickerSetShortName, InputDocument
from telethon.tl.types import InputStickerSetItem
from PIL import Image
from file_processor import detect_sticker_format

logger = logging.getLogger(__name__)

_STICKER_SIDE = 512


async def _upload_as_document(client: TelegramClient, file_bytes: bytes, file_name: str) -> tuple[InputDocument, int]:
    buf = io.BytesIO(file_bytes)
    buf.name = file_name
    msg = await client.send_file(
        "me", buf,
        force_document=True,
    )
    if not msg or not msg.document:
        raise RuntimeError("Failed to upload sticker file to Telegram")
    input_doc = InputDocument(
        id=msg.document.id,
        access_hash=msg.document.access_hash,
        file_reference=msg.document.file_reference,
    )
    return input_doc, msg.id


async def _cleanup_uploaded_messages(client: TelegramClient, msg_ids: list[int]):
    if msg_ids:
        try:
            await client.delete_messages("me", msg_ids)
        except Exception:
            pass


async def send_code_request(phone: str, api_id: int, api_hash: str) -> dict:
    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()
    try:
        result = await client.send_code_request(phone)
        session_string = client.session.save()
        return {
            "phone_code_hash": result.phone_code_hash,
            "session_string": session_string,
        }
    finally:
        await client.disconnect()


async def sign_in(
    phone: str,
    code: str,
    phone_code_hash: str,
    session_string: str,
    api_id: int,
    api_hash: str,
    password: Optional[str] = None,
) -> dict:
    client = TelegramClient(StringSession(session_string), api_id, api_hash)
    await client.connect()
    try:
        if password:
            await client.sign_in(password=password)
        else:
            await client.sign_in(
                phone=phone,
                code=code,
                phone_code_hash=phone_code_hash,
            )
        me = await client.get_me()
        final_session = client.session.save()
        return {
            "session_string": final_session,
            "user_id": me.id,
            "first_name": me.first_name or "",
            "username": me.username or "",
            "phone": phone,
        }
    finally:
        await client.disconnect()


async def _get_client(session_string: str, api_id: int, api_hash: str) -> TelegramClient:
    client = TelegramClient(StringSession(session_string), api_id, api_hash)
    await client.connect()
    return client


async def _process_image(file_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode in ("RGB", "P", "L", "LA", "1"):
        img = img.convert("RGBA")
    w, h = img.size
    if w >= h:
        new_w = _STICKER_SIDE
        new_h = int(h * _STICKER_SIDE / w)
    else:
        new_h = _STICKER_SIDE
        new_w = int(w * _STICKER_SIDE / h)
    new_w = max(new_w, 16)
    new_h = max(new_h, 16)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="PNG")
    out.seek(0)
    return out.read()


async def _process_video(file_bytes: bytes, filename: str) -> bytes:
    import tempfile, os, subprocess
    _, ext = os.path.splitext(filename)
    with tempfile.NamedTemporaryFile(suffix=ext or ".mp4", delete=False) as tmp_in:
        tmp_in.write(file_bytes)
        tmp_in_path = tmp_in.name
    tmp_out_path = tmp_in_path + ".webm"
    try:
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height,duration",
             "-of", "csv=p=0", tmp_in_path],
            capture_output=True, text=True, timeout=10,
        )
        w, h = _STICKER_SIDE, _STICKER_SIDE
        duration = 3.0
        if probe.returncode == 0 and probe.stdout.strip():
            parts = probe.stdout.strip().split(",")
            if len(parts) >= 3:
                try:
                    w = int(float(parts[0]))
                    h = int(float(parts[1]))
                    duration = float(parts[2])
                except ValueError:
                    pass
        if w >= h:
            vf_scale = f"scale={_STICKER_SIDE}:-2"
        else:
            vf_scale = f"scale=-2:{_STICKER_SIDE}"
        cmd = [
            "ffmpeg", "-y", "-i", tmp_in_path,
            "-t", str(min(duration, 3.0)),
            "-vf", f"{vf_scale},fps=30",
            "-c:v", "libvpx-vp9", "-b:v", "256k",
            "-pix_fmt", "yuva420p", "-an", "-loop", "0",
            tmp_out_path,
        ]
        subprocess.run(cmd, capture_output=True, timeout=30)
        if not os.path.exists(tmp_out_path):
            raise RuntimeError("ffmpeg failed to produce output")
        with open(tmp_out_path, "rb") as f:
            data = f.read()
        if len(data) > 256 * 1024:
            subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_in_path,
                 "-t", str(min(duration, 3.0)),
                 "-vf", f"{vf_scale},fps=30",
                 "-c:v", "libvpx-vp9", "-b:v", "150k", "-crf", "35",
                 "-pix_fmt", "yuva420p", "-an", "-loop", "0",
                 tmp_out_path],
                capture_output=True, timeout=30,
            )
            with open(tmp_out_path, "rb") as f:
                data = f.read()
        return data
    finally:
        for p in (tmp_in_path, tmp_out_path):
            try:
                os.unlink(p)
            except OSError:
                pass


async def _process_file_for_telethon(file_bytes: bytes, filename: str, mime_type: str = "") -> tuple:
    fmt = detect_sticker_format(filename, mime_type)
    if fmt == "video":
        data = await _process_video(file_bytes, filename)
        return data, "webm"
    else:
        data = await _process_image(file_bytes)
        return data, "png"


async def check_sticker_set_exists_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    short_name: str,
) -> bool:
    from telethon.tl.functions.messages import GetStickerSetRequest
    from telethon.tl.types import InputStickerSetShortName
    from telethon.errors import StickersetInvalidError

    client = await _get_client(session_string, api_id, api_hash)
    try:
        try:
            await client(
                GetStickerSetRequest(
                    stickerset=InputStickerSetShortName(short_name=short_name),
                    hash=0,
                )
            )
            return True
        except StickersetInvalidError:
            return False
        except Exception:
            return False
    finally:
        await client.disconnect()


async def create_sticker_set_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    title: str,
    short_name: str,
    files: list[bytes],
    filenames: list[str],
    mime_types: list[str],
    emojis: list[str],
) -> dict:
    client = await _get_client(session_string, api_id, api_hash)
    try:
        sticker_items = []
        msg_ids = []
        for i, (file_bytes, emoji) in enumerate(zip(files, emojis)):
            fname = filenames[i] if i < len(filenames) else f"sticker_{i}"
            mtype = mime_types[i] if i < len(mime_types) else ""
            processed, ext = await _process_file_for_telethon(file_bytes, fname, mtype)
            uploaded, mid = await _upload_as_document(client, processed, f"sticker_{i}.{ext}")
            msg_ids.append(mid)
            sticker_items.append(
                InputStickerSetItem(emoji=emoji, document=uploaded)
            )

        result = await client(
            CreateStickerSetRequest(
                user_id="me",
                title=title,
                short_name=short_name,
                stickers=sticker_items,
            )
        )

        await _cleanup_uploaded_messages(client, msg_ids)

        return {
            "success": True,
            "pack_name": short_name,
            "pack_link": f"https://t.me/addstickers/{short_name}",
            "message": "Sticker pack created successfully!",
        }
    finally:
        await client.disconnect()


async def send_sticker_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    chat_id: int,
    pack_name: str,
) -> dict:
    from telethon.tl.functions.messages import GetStickerSetRequest
    from telethon.tl.types import InputStickerSetShortName

    client = await _get_client(session_string, api_id, api_hash)
    try:
        sticker_set = await client(
            GetStickerSetRequest(
                stickerset=InputStickerSetShortName(short_name=pack_name),
                hash=0,
            )
        )

        sent = 0
        for sticker in sticker_set.documents:
            await client.send_file(chat_id, sticker)
            sent += 1

        return {
            "success": True,
            "stickers_sent": sent,
            "pack_link": f"https://t.me/addstickers/{pack_name}",
            "message": f"{sent} sticker(s) sent successfully!",
        }
    finally:
        await client.disconnect()


async def add_sticker_to_set_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    pack_name: str,
    files: list[bytes],
    filenames: list[str],
    mime_types: list[str],
    emojis: list[str],
) -> dict:
    from telethon.tl.functions.messages import GetStickerSetRequest
    from telethon.tl.types import InputStickerSetShortName

    client = await _get_client(session_string, api_id, api_hash)
    try:
        sticker_set = await client(
            GetStickerSetRequest(
                stickerset=InputStickerSetShortName(short_name=pack_name),
                hash=0,
            )
        )

        added = 0
        msg_ids = []
        for i, (file_bytes, emoji) in enumerate(zip(files, emojis)):
            fname = filenames[i] if i < len(filenames) else f"sticker_{i}"
            mtype = mime_types[i] if i < len(mime_types) else ""
            processed, ext = await _process_file_for_telethon(file_bytes, fname, mtype)
            uploaded, mid = await _upload_as_document(client, processed, f"sticker_{i}.{ext}")
            msg_ids.append(mid)
            await client(
                AddStickerToSetRequest(
                    stickerset=InputStickerSetShortName(short_name=pack_name),
                    sticker=InputStickerSetItem(emoji=emoji, document=uploaded),
                )
            )
            added += 1

        await _cleanup_uploaded_messages(client, msg_ids)

        return {
            "success": True,
            "pack_link": f"https://t.me/addstickers/{pack_name}",
            "stickers_added": added,
            "message": f"{added} sticker(s) added successfully!",
        }
    finally:
        await client.disconnect()


async def get_sticker_set_detail_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    pack_name: str,
) -> dict:
    from telethon.tl.functions.messages import GetStickerSetRequest
    from telethon.tl.types import InputStickerSetShortName

    client = await _get_client(session_string, api_id, api_hash)
    try:
        sticker_set = await client(
            GetStickerSetRequest(
                stickerset=InputStickerSetShortName(short_name=pack_name),
                hash=0,
            )
        )

        stickers = []
        for idx, doc in enumerate(sticker_set.documents):
            emoji = ""
            for attr in doc.attributes:
                if hasattr(attr, "alt"):
                    emoji = attr.alt or ""
                    break

            stickers.append({
                "file_id": str(doc.id),
                "emoji": emoji,
                "is_video": doc.mime_type == "video/webm",
                "is_animated": doc.mime_type == "application/x-tgsticker",
                "width": getattr(doc, "w", 512) or 512,
                "height": getattr(doc, "h", 512) or 512,
                "file_path": f"user_sticker:{idx}",
            })

        return {
            "name": pack_name,
            "title": sticker_set.set.title,
            "sticker_type": "regular",
            "sticker_count": len(sticker_set.documents),
            "stickers": stickers,
        }
    finally:
        await client.disconnect()


async def delete_sticker_from_set_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    sticker_id: int,
) -> dict:
    from telethon.tl.functions.messages import DeleteStickerFromSetRequest

    client = await _get_client(session_string, api_id, api_hash)
    try:
        await client(DeleteStickerFromSetRequest(sticker=sticker_id))
        return {"success": True, "message": "Sticker deleted successfully!"}
    finally:
        await client.disconnect()


async def set_sticker_emoji_list_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    sticker_id: int,
    emoji: str,
) -> dict:
    from telethon.tl.functions.messages import SetStickerEmojiListRequest

    client = await _get_client(session_string, api_id, api_hash)
    try:
        await client(SetStickerEmojiListRequest(sticker=sticker_id, emoji=emoji))
        return {"success": True, "message": "Sticker emoji updated successfully!"}
    finally:
        await client.disconnect()


async def set_sticker_position_in_set_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    sticker_id: int,
    position: int,
) -> dict:
    from telethon.tl.functions.messages import SetStickerPositionInSetRequest

    client = await _get_client(session_string, api_id, api_hash)
    try:
        await client(SetStickerPositionInSetRequest(sticker=sticker_id, position=position))
        return {"success": True, "message": "Sticker reordered successfully!"}
    finally:
        await client.disconnect()


async def delete_sticker_set_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    pack_name: str,
) -> dict:
    from telethon.tl.functions.messages import DeleteStickerSetRequest

    client = await _get_client(session_string, api_id, api_hash)
    try:
        await client(
            DeleteStickerSetRequest(
                stickerset=InputStickerSetShortName(short_name=pack_name),
            )
        )
        return {"success": True, "message": "Sticker pack deleted successfully!"}
    finally:
        await client.disconnect()


async def remix_sticker_set_user(
    session_string: str,
    api_id: int,
    api_hash: str,
    source_pack_name: str,
    new_title: str,
    new_short_name: str,
    selected_stickers: list[dict],
    files: list[bytes],
    filenames: list[str],
    mime_types: list[str],
    new_emojis: list[str],
) -> dict:
    from telethon.tl.functions.messages import GetStickerSetRequest

    client = await _get_client(session_string, api_id, api_hash)
    try:
        source_set = await client(
            GetStickerSetRequest(
                stickerset=InputStickerSetShortName(short_name=source_pack_name),
                hash=0,
            )
        )

        source_docs = source_set.documents
        sticker_items = []
        msg_ids = []

        for sel in selected_stickers:
            idx = sel.get("index", -1)
            emoji = sel.get("emoji", "😀")
            if idx < 0 or idx >= len(source_docs):
                continue
            doc = source_docs[idx]
            sticker_items.append(
                InputStickerSetItem(emoji=emoji, document=doc)
            )

        for i, (file_bytes, emoji) in enumerate(zip(files, new_emojis)):
            fname = filenames[i] if i < len(filenames) else f"sticker_{i}"
            mtype = mime_types[i] if i < len(mime_types) else ""
            processed, ext = await _process_file_for_telethon(file_bytes, fname, mtype)
            uploaded, mid = await _upload_as_document(client, processed, f"sticker_{i}.{ext}")
            msg_ids.append(mid)
            sticker_items.append(
                InputStickerSetItem(emoji=emoji, document=uploaded)
            )

        if not sticker_items:
            return {"success": False, "message": "No stickers to add"}

        await client(
            CreateStickerSetRequest(
                user_id="me",
                title=new_title,
                short_name=new_short_name,
                stickers=sticker_items,
            )
        )

        await _cleanup_uploaded_messages(client, msg_ids)

        return {
            "success": True,
            "pack_name": new_short_name,
            "pack_link": f"https://t.me/addstickers/{new_short_name}",
            "message": "Sticker pack remixed successfully!",
        }
    finally:
        await client.disconnect()


async def get_all_sticker_sets_user(
    session_string: str,
    api_id: int,
    api_hash: str,
) -> list:
    from telethon.tl.functions.messages import GetAllStickersRequest

    client = await _get_client(session_string, api_id, api_hash)
    try:
        result = await client(GetAllStickersRequest(hash=0))
        packs = []
        for s in result.sets:
            packs.append({
                "name": s.short_name,
                "title": s.title,
                "sticker_count": getattr(s, "count", 0) or 0,
                "sticker_type": "regular",
            })
        return packs
    finally:
        await client.disconnect()
