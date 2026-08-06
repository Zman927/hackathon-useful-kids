import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

STATIC_ROOT = Path("static")
EQUIPMENT_IMAGE_DIR = STATIC_ROOT / "uploads" / "equipments"
EQUIPMENT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


async def save_equipment_image(upload: UploadFile) -> str:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일(jpg, png, webp, gif)만 업로드할 수 있습니다.",
        )

    contents = await upload.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일은 5MB 이하만 업로드할 수 있습니다.",
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
