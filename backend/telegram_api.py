import httpx
import json
import logging
from typing import Any, Optional

API_BASE = "https://api.telegram.org"
logger = logging.getLogger(__name__)

_shared_client: Optional[httpx.AsyncClient] = None


def _get_client() -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None or _shared_client.is_closed:
        _shared_client = httpx.AsyncClient(
            timeout=120,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
        )
    return _shared_client


async def _call(token: str, method: str, **kwargs) -> dict[str, Any]:
    url = f"{API_BASE}/bot{token}/{method}"
    client = _get_client()
    if "data" in kwargs or "files" in kwargs:
        resp = await client.post(url, **kwargs)
    else:
        resp = await client.post(url, json=kwargs)
    body = resp.json()
    if not body.get("ok"):
        desc = body.get("description", "Unknown error")
        logger.error("Telegram API %s failed: %s", method, desc)
        raise RuntimeError(f"Telegram API error: {desc}")
    return body["result"]


async def get_me(token: str) -> dict:
    return await _call(token, "getMe")


async def upload_sticker_file(
    token: str, user_id: int, file_bytes: bytes, filename: str, sticker_format: str
) -> str:
    mime_map = {
        "png": "image/png",
        "webp": "image/webp",
        "webm": "video/webm",
        "tgs": "application/x-tgsticker",
    }
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    mime_type = mime_map.get(ext, "application/octet-stream")

    files = {"sticker": (filename, file_bytes, mime_type)}
    data = {"user_id": str(user_id), "sticker_format": sticker_format}
    url = f"{API_BASE}/bot{token}/uploadStickerFile"

    logger.info("uploadStickerFile: user=%s, file=%s, format=%s, size=%d bytes",
                user_id, filename, sticker_format, len(file_bytes))

    client = _get_client()
    resp = await client.post(url, data=data, files=files)
    body = resp.json()
    if not body.get("ok"):
        desc = body.get("description", "Unknown error")
        logger.error("uploadStickerFile failed: %s (file=%s, format=%s, size=%d)",
                     desc, filename, sticker_format, len(file_bytes))
        raise RuntimeError(f"uploadStickerFile error: {desc}")
    file_id = body["result"]["file_id"]
    logger.info("uploadStickerFile success: file_id=%s", file_id[:20] + "...")
    return file_id


async def create_new_sticker_set(
    token: str,
    user_id: int,
    name: str,
    title: str,
    stickers: list[dict],
    sticker_type: str = "regular",
) -> bool:
    import json
    url = f"{API_BASE}/bot{token}/createNewStickerSet"
    data = {
        "user_id": str(user_id),
        "name": name,
        "title": title,
        "stickers": json.dumps(stickers),
        "sticker_type": sticker_type,
    }

    logger.info("createNewStickerSet: user=%s, name=%s, title=%s, stickers=%d",
                user_id, name, title, len(stickers))

    client = _get_client()
    resp = await client.post(url, data=data)
    body = resp.json()
    if not body.get("ok"):
        desc = body.get("description", "Unknown error")
        logger.error("createNewStickerSet failed: %s (name=%s)", desc, name)
        raise RuntimeError(f"createNewStickerSet error: {desc}")
    logger.info("createNewStickerSet success: name=%s", name)
    return True


async def add_sticker_to_set(
    token: str, user_id: int, name: str, sticker: dict
) -> bool:
    import json
    url = f"{API_BASE}/bot{token}/addStickerToSet"
    data = {
        "user_id": str(user_id),
        "name": name,
        "sticker": json.dumps(sticker),
    }

    logger.info("addStickerToSet: user=%s, name=%s", user_id, name)

    client = _get_client()
    resp = await client.post(url, data=data)
    body = resp.json()
    if not body.get("ok"):
        desc = body.get("description", "Unknown error")
        logger.error("addStickerToSet failed: %s (name=%s)", desc, name)
        raise RuntimeError(f"addStickerToSet error: {desc}")
    logger.info("addStickerToSet success: name=%s", name)
    return True


async def get_sticker_set(token: str, name: str) -> dict:
    return await _call(token, "getStickerSet", name=name)


async def delete_sticker_set(token: str, name: str) -> bool:
    return await _call(token, "deleteStickerSet", name=name)


async def send_sticker(token: str, chat_id: int, sticker_file_id: str) -> dict:
    logger.info("sendSticker: chat_id=%s, file_id=%s", chat_id, sticker_file_id[:20] + "...")
    return await _call(token, "sendSticker", chat_id=chat_id, sticker=sticker_file_id)


async def send_message(token: str, chat_id: int, text: str) -> dict:
    logger.info("sendMessage: chat_id=%s, text_len=%d", chat_id, len(text))
    return await _call(token, "sendMessage", chat_id=chat_id, text=text)


async def get_file(token: str, file_id: str) -> dict:
    result = await _call(token, "getFile", file_id=file_id)
    file_path = result.get("file_path", "")
    logger.info("getFile: file_id=%s -> file_path=%s", file_id[:20] + "...", file_path)
    return result


async def delete_sticker_from_set(token: str, sticker_file_id: str) -> bool:
    logger.info("deleteStickerFromSet: file_id=%s", sticker_file_id[:20] + "...")
    return await _call(token, "deleteStickerFromSet", sticker=sticker_file_id)


async def set_sticker_emoji_list(token: str, sticker_file_id: str, emoji_list: list[str]) -> bool:
    logger.info("setStickerEmojiList: file_id=%s, emojis=%s", sticker_file_id[:20] + "...", emoji_list)
    return await _call(token, "setStickerEmojiList", sticker=sticker_file_id, emoji_list=json.dumps(emoji_list))


async def set_sticker_position_in_set(token: str, sticker_file_id: str, position: int) -> bool:
    logger.info("setStickerPositionInSet: file_id=%s, position=%d", sticker_file_id[:20] + "...", position)
    return await _call(token, "setStickerPositionInSet", sticker=sticker_file_id, position=position)


async def download_file(token: str, file_path: str) -> bytes:
    url = f"https://api.telegram.org/file/bot{token}/{file_path}"
    logger.info("download_file: %s", file_path)
    client = _get_client()
    resp = await client.get(url)
    resp.raise_for_status()
    return resp.content
