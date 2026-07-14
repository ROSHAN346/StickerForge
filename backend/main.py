import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.verify import router as verify_router
from routes.stickers import router as stickers_router
from routes.user_auth import router as user_auth_router
from routes.user_stickers import router as user_stickers_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

app = FastAPI(title="Telegram Sticker Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(verify_router)
app.include_router(stickers_router)
app.include_router(user_auth_router)
app.include_router(user_stickers_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Telegram Sticker Generator API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
