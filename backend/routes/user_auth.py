import logging
from fastapi import APIRouter, HTTPException
from models import SendCodeRequest, SendCodeResponse, SignInRequest, UserSessionInfo
from telethon_client import send_code_request, sign_in

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/user/send-code", response_model=SendCodeResponse)
async def send_code(req: SendCodeRequest):
    logger.info("send_code: phone=%s", req.phone)
    try:
        result = await send_code_request(req.phone, req.api_id, req.api_hash)
        return SendCodeResponse(
            phone_code_hash=result["phone_code_hash"],
            session_string=result["session_string"],
        )
    except Exception as e:
        msg = str(e)
        logger.error("send_code failed: %s", msg)
        if "API_ID_INVALID" in msg:
            raise HTTPException(status_code=400, detail="Invalid API ID or API Hash. Get them from https://my.telegram.org")
        if "PHONE_NUMBER_INVALID" in msg:
            raise HTTPException(status_code=400, detail="Invalid phone number. Use international format (e.g. +1234567890)")
        raise HTTPException(status_code=400, detail=msg)


@router.post("/api/user/sign-in", response_model=UserSessionInfo)
async def user_sign_in(req: SignInRequest):
    logger.info("sign_in: phone=%s", req.phone)
    try:
        result = await sign_in(
            phone=req.phone,
            code=req.code,
            phone_code_hash=req.phone_code_hash,
            session_string=req.session_string,
            api_id=req.api_id,
            api_hash=req.api_hash,
            password=req.password,
        )
        return UserSessionInfo(**result)
    except Exception as e:
        msg = str(e)
        logger.error("sign_in failed: %s", msg)
        if "PHONE_CODE_INVALID" in msg:
            raise HTTPException(status_code=400, detail="Invalid login code. Check the code Telegram sent you.")
        if "PHONE_CODE_EXPIRED" in msg:
            raise HTTPException(status_code=400, detail="Code expired. Request a new one.")
        if "SESSION_PASSWORD_NEEDED" in msg:
            raise HTTPException(status_code=401, detail="Two-factor authentication required. Enter your password.")
        raise HTTPException(status_code=400, detail=msg)
