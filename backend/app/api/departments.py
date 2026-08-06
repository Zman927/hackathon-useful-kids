from fastapi import APIRouter

from app.models.departments import DEPARTMENTS

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("")
async def list_departments():
    colleges: dict[str, list[dict]] = {}
    for info in DEPARTMENTS:
        colleges.setdefault(info.college, []).append({"id": info.id, "name": info.department.value})

    return [
        {"college": college, "departments": departments}
        for college, departments in colleges.items()
    ]
