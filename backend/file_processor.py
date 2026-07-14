import io
import os
import tempfile
import subprocess
from PIL import Image
from typing import Tuple

MAX_STATIC_SIZE = 512 * 1024          # 512 KB
MAX_VIDEO_SIZE = 256 * 1024           # 256 KB
MAX_DURATION = 3.0                    # seconds
MAX_FPS = 30
STICKER_SIDE = 512


def detect_sticker_format(filename: str, mime_type: str) -> str:
    name_lower = filename.lower()
    if mime_type:
        mime_lower = mime_type.lower()
        if mime_lower.startswith("video/") or mime_lower == "image/gif":
            return "video"
        if mime_lower in ("image/png", "image/webp", "image/jpeg", "image/jpg"):
            return "static"
    if name_lower.endswith((".webm", ".mp4", ".mov", ".avi", ".mkv", ".gif")):
        return "video"
    return "static"


async def process_image(file_bytes: bytes, filename: str) -> Tuple[bytes, str]:
    img = Image.open(io.BytesIO(file_bytes))

    if img.mode in ("RGB", "P", "L", "LA", "1"):
        img = img.convert("RGBA")

    w, h = img.size
    if w >= h:
        new_w = STICKER_SIDE
        new_h = int(h * STICKER_SIDE / w)
    else:
        new_h = STICKER_SIDE
        new_w = int(w * STICKER_SIDE / h)

    new_w = max(new_w, 16)
    new_h = max(new_h, 16)
    img = img.resize((new_w, new_h), Image.LANCZOS)

    out = io.BytesIO()
    fmt = "PNG"
    img.save(out, format=fmt)
    data = out.getvalue()

    if len(data) > MAX_STATIC_SIZE:
        out = io.BytesIO()
        img.save(out, format="WEBP", quality=90, method=6)
        data = out.getvalue()
        fmt = "WEBP"

    ext = "png" if fmt == "PNG" else "webp"
    return data, ext


async def process_video(file_bytes: bytes, filename: str) -> Tuple[bytes, str]:
    with tempfile.NamedTemporaryFile(suffix=_input_ext(filename), delete=False) as tmp_in:
        tmp_in.write(file_bytes)
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path + ".webm"
    try:
        probe = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height,duration,r_frame_rate",
                "-of", "csv=p=0",
                tmp_in_path,
            ],
            capture_output=True, text=True, timeout=10,
        )
        w, h = STICKER_SIDE, STICKER_SIDE
        duration = MAX_DURATION
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
            vf_scale = f"scale={STICKER_SIDE}:-2"
        else:
            vf_scale = f"scale=-2:{STICKER_SIDE}"

        cmd = [
            "ffmpeg", "-y", "-i", tmp_in_path,
            "-t", str(min(duration, MAX_DURATION)),
            "-vf", f"{vf_scale},fps={MAX_FPS}",
            "-c:v", "libvpx-vp9",
            "-b:v", "256k",
            "-pix_fmt", "yuva420p",
            "-an",
            "-loop", "0",
            tmp_out_path,
        ]
        subprocess.run(cmd, capture_output=True, timeout=30)

        if not os.path.exists(tmp_out_path):
            raise RuntimeError("ffmpeg failed to produce output")

        with open(tmp_out_path, "rb") as f:
            data = f.read()

        if len(data) > MAX_VIDEO_SIZE:
            subprocess.run(
                [
                    "ffmpeg", "-y", "-i", tmp_in_path,
                    "-t", str(min(duration, MAX_DURATION)),
                    "-vf", f"{vf_scale},fps={MAX_FPS}",
                    "-c:v", "libvpx-vp9",
                    "-b:v", "150k",
                    "-crf", "35",
                    "-pix_fmt", "yuva420p",
                    "-an",
                    "-loop", "0",
                    tmp_out_path,
                ],
                capture_output=True, timeout=30,
            )
            with open(tmp_out_path, "rb") as f:
                data = f.read()

        return data, "webm"
    finally:
        for p in (tmp_in_path, tmp_out_path):
            try:
                os.unlink(p)
            except OSError:
                pass


def _input_ext(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext if ext else ".mp4"


async def process_file(file_bytes: bytes, filename: str, mime_type: str) -> Tuple[bytes, str, str]:
    fmt = detect_sticker_format(filename, mime_type)
    if fmt == "video":
        data, ext = await process_video(file_bytes, filename)
    else:
        data, ext = await process_image(file_bytes, filename)
    return data, ext, fmt
