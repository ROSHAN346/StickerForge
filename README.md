# Sticker Forge — Telegram Sticker Generator

Create custom Telegram sticker packs from images, GIFs, and videos. Users paste their own bot token, upload files, and get a shareable `https://t.me/addstickers/<name>` link. No token storage — everything is processed in-memory per request.

## Features

- **Image stickers** (PNG, WebP, JPG) — auto-resized to 512px
- **Video stickers** (GIF, MP4, WebM, MOV) — converted to WebM VP9 format
- **Create new packs** — name your pack, upload files, assign emoji
- **Add to existing packs** — select a previous pack or enter pack name
- **Shareable link** — get `https://t.me/addstickers/<name>` instantly
- **Material Design 3 dark theme** — smooth, modern UI with Framer Motion animations
- **Dual mode** — works inside Telegram as a Mini App AND as a standalone web app
- **Zero token storage** — bot token is used in-memory and never persisted on the server

## Prerequisites

### 1. Create a Telegram Bot

1. Open [@BotFather](https://t.me/botfather) in Telegram
2. Send `/newbot`
3. Choose a name (e.g., "Sticker Forge") and username (e.g., `StickerForgeBot`)
4. Save the bot token you receive (looks like `123456789:ABCdef...`)

### 2. Set Up the Mini App (optional — for Telegram integration)

1. In @BotFather, send `/newapp` or go to Bot Settings → Configure Mini App
2. Set the Mini App URL to your deployed frontend URL (e.g., `https://your-app.vercel.app`)
3. Users can now open the app directly from the bot's profile in Telegram

### 3. Install ffmpeg (for backend)

- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

## Project Structure

```
Telegram/
├── frontend/          # Next.js 16 + MUI v9 + Framer Motion
│   ├── app/           # App router pages (welcome, dashboard, create, add, result)
│   ├── components/    # Reusable UI components
│   ├── lib/           # API client, Telegram SDK, localStorage helpers
│   └── theme/         # Material Design 3 dark theme
│
├── backend/           # Python FastAPI (stateless)
│   ├── main.py        # FastAPI app + CORS
│   ├── telegram_api.py # Bot API client (httpx async)
│   ├── file_processor.py # Pillow + ffmpeg conversion
│   ├── routes/        # API endpoints
│   ├── models.py      # Pydantic models
│   └── Dockerfile     # Deploy with ffmpeg included
│
└── README.md
```

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local    # Set NEXT_PUBLIC_API_BASE if backend is not on localhost
npm run dev
```

The app will be available at `http://localhost:3000`.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/verify-token` | POST | Verify bot token via `getMe` |
| `POST /api/stickers/create` | POST | Process files + create new sticker pack |
| `POST /api/stickers/add` | POST | Process files + add stickers to existing pack |
| `POST /api/sticker-set` | POST | Get info about an existing sticker set |
| `GET /health` | GET | Health check |

## Sticker Format Requirements

### Static Stickers (images)
- Format: PNG or WebP
- One side must be exactly 512px (other side ≤ 512px)
- Max size: 512 KB
- Transparent background recommended

### Video Stickers (GIF/video)
- Format: WebM with VP9 codec
- One side must be exactly 512px
- Max duration: 3 seconds
- Max frame rate: 30 FPS
- Max size: 256 KB
- No audio stream

## Deployment

### Frontend → Vercel

1. Push the `frontend/` folder to a GitHub repo
2. Import the repo on [Vercel](https://vercel.com)
3. Set environment variable: `NEXT_PUBLIC_API_BASE` → your backend URL
4. Deploy — Vercel provides HTTPS automatically

### Backend → Railway / Render / Docker

**Railway:**
1. Create a new project from your GitHub repo
2. Set the root directory to `backend/`
3. Railway will detect the Dockerfile and build with ffmpeg
4. Deploy

**Render:**
1. Create a new Web Service
2. Set the Dockerfile path to `backend/Dockerfile`
3. Deploy

**Docker (local/VPS):**
```bash
cd backend
docker build -t sticker-forge-api .
docker run -p 8000:8000 sticker-forge-api
```

### Post-Deployment

1. Update `NEXT_PUBLIC_API_BASE` in the frontend to point to your backend URL
2. Set the Mini App URL in @BotFather to your Vercel frontend URL
3. Test by opening the bot in Telegram and tapping the Launch App button

## How It Works

1. User pastes their bot token in the app (stored in `sessionStorage` only)
2. Backend calls `getMe` to verify the token and get the bot username
3. User uploads files and assigns emoji to each
4. Backend processes each file:
   - Images → Pillow resizes to 512px → PNG/WebP
   - GIF/Video → ffmpeg converts to WebM VP9 (no audio, ≤3s, ≤30fps)
5. Backend calls `uploadStickerFile` for each processed file → gets `file_id`
6. Backend calls `createNewStickerSet` with all `file_id`s → creates the pack
7. App displays the shareable link: `https://t.me/addstickers/<pack_name>`
8. Pack name format: `<title_slug>_by_<bot_username>`

## Tech Stack

- **Frontend**: Next.js 16, React 19, MUI v9 (Material Design 3 dark theme), Framer Motion
- **Backend**: Python FastAPI, httpx (async), Pillow, ffmpeg-python
- **Deployment**: Vercel (frontend), Railway/Render (backend)
