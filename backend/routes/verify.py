from fastapi import APIRouter, HTTPException
from models import TokenRequest, BotInfo
from telegram_api import get_me

router = APIRouter()


@router.post("/api/verify-token", response_model=BotInfo)
async def verify_token(req: TokenRequest):
    try:
        me = await get_me(req.token)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BotInfo(
        id=me["id"],
        username=me.get("username", ""),
        first_name=me.get("first_name", ""),
        can_join_groups=me.get("can_join_groups", False),
    )
