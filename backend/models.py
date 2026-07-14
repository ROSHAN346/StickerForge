from pydantic import BaseModel
from typing import Optional, List


class TokenRequest(BaseModel):
    token: str


class BotInfo(BaseModel):
    id: int
    username: str
    first_name: str
    can_join_groups: bool


class StickerSetRequest(BaseModel):
    token: str
    name: str


class StickerSetInfo(BaseModel):
    name: str
    title: str
    sticker_type: str
    sticker_count: int


class CreatePackResponse(BaseModel):
    success: bool
    pack_name: str
    pack_link: str
    message: str


class AddStickersResponse(BaseModel):
    success: bool
    pack_link: str
    stickers_added: int
    message: str


class ShareStickerResponse(BaseModel):
    success: bool
    stickers_sent: int
    pack_link: str
    message: str


class DeletePackResponse(BaseModel):
    success: bool
    pack_name: str
    message: str


class DeleteStickerResponse(BaseModel):
    success: bool
    message: str


class UpdateEmojiResponse(BaseModel):
    success: bool
    message: str


class ReorderStickerResponse(BaseModel):
    success: bool
    message: str


class StickerActionRequest(BaseModel):
    token: str
    sticker: str
    emoji_list: Optional[List[str]] = None
    position: Optional[int] = None


class StickerItem(BaseModel):
    file_id: str
    emoji: str
    is_video: bool
    is_animated: bool
    width: int
    height: int
    file_path: str


class StickerSetDetail(BaseModel):
    name: str
    title: str
    sticker_type: str
    sticker_count: int
    stickers: List[StickerItem]


class SendCodeRequest(BaseModel):
    phone: str
    api_id: int
    api_hash: str


class SendCodeResponse(BaseModel):
    phone_code_hash: str
    session_string: str


class SignInRequest(BaseModel):
    phone: str
    code: str
    phone_code_hash: str
    session_string: str
    api_id: int
    api_hash: str
    password: Optional[str] = None


class UserSessionInfo(BaseModel):
    session_string: str
    user_id: int
    first_name: str
    username: str
    phone: str
