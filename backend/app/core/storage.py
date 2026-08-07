import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

STATIC_ROOT = Path("static")
EQUIPMENT_IMAGE_DIR = STATIC_ROOT / "uploads" / "equipments"
EQUIPMENT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024

# 클라이언트가 보낸 Content-Type 헤더는 위조 가능하므로, 실제 파일 시그니처(매직 바이트)로 다시 검증한다.
IMAGE_SIGNATURES: tuple[bytes, ...] = (
    b"\xff\xd8\xff",  # JPEG
    b"\x89PNG\r\n\x1a\n",  # PNG
    b"GIF87a",
    b"GIF89a",
)


def _looks_like_image(header: bytes) -> bool:
    if any(header.startswith(sig) for sig in IMAGE_SIGNATURES):
        return True
    # WEBP: "RIFF????WEBP"
    return header[:4] == b"RIFF" and header[8:12] == b"WEBP"


async def save_equipment_image(upload: UploadFile) -> str:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일(jpg, png, webp, gif)만 업로드할 수 있습니다.",
        )

    chunks = []
    total_size = 0
    while chunk := await upload.read(CHUNK_SIZE):
        total_size += len(chunk)
        if total_size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미지 파일은 5MB 이하만 업로드할 수 있습니다.",
            )
        chunks.append(chunk)
    contents = b"".join(chunks)

    if not _looks_like_image(contents[:12]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="올바른 이미지 파일이 아닙니다.",
        )

    extension = Path(upload.filename or "").suffix
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = EQUIPMENT_IMAGE_DIR / filename
    destination.write_bytes(contents)

    return f"/static/uploads/equipments/{filename}"


def delete_equipment_image(image_url: str | None) -> None:
    if not image_url:
        return
    filename = Path(image_url).name
    file_path = EQUIPMENT_IMAGE_DIR / filename
    file_path.unlink(missing_ok=True)
