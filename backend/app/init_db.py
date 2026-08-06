from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.enums import Department, Role
from app.models.equipment import Equipment
from app.models.user import User

DEFAULT_PASSWORD = "pwd123"

SEED_DATA = [
    {
        "department": Department.COMPUTER_ENGINEERING,
        "assistant": {"student_id": "com", "name": "컴퓨터공학과 조교"},
        "student": {"student_id": "2026001", "name": "컴퓨터공학과 학생"},
        "equipment": {"name": "라즈베리 파이 4", "quantity": 5, "description": "라즈베리 파이 4 Model B"},
    },
    {
        "department": Department.AI_GAME_SOFTWARE,
        "assistant": {"student_id": "aigame", "name": "AI게임소프트웨어학과 조교"},
        "student": {"student_id": "2026101", "name": "AI게임소프트웨어학과 학생"},
        "equipment": {"name": "Meta Quest 3 VR 헤드셋", "quantity": 3, "description": "VR 개발/테스트용 헤드셋"},
    },
    {
        "department": Department.COMPUTER_SECURITY,
        "assistant": {"student_id": "combo", "name": "컴퓨터보안공학과 조교"},
        "student": {"student_id": "2026201", "name": "컴퓨터보안공학과 학생"},
        "equipment": {"name": "무선 패킷 분석 랜카드", "quantity": 4, "description": "모니터 모드 지원 무선 랜카드"},
    },
    {
        "department": Department.ELECTRONIC_ENGINEERING,
        "assistant": {"student_id": "elec", "name": "전자공학과 조교"},
        "student": {"student_id": "2026301", "name": "전자공학과 학생"},
        "equipment": {"name": "디지털 오실로스코프", "quantity": 2, "description": "회로 실험용 오실로스코프"},
    },
    {
        "department": Department.INFO_COMMUNICATION,
        "assistant": {"student_id": "tong", "name": "정보통신공학과 조교"},
        "student": {"student_id": "2026401", "name": "정보통신공학과 학생"},
        "equipment": {"name": "광파워미터 측정기", "quantity": 3, "description": "광통신 신호 세기 측정 장비"},
    },
]


async def _get_or_create_user(
    db: AsyncSession, student_id: str, name: str, department: Department, role: Role
) -> None:
    result = await db.execute(select(User).where(User.student_id == student_id))
    if result.scalar_one_or_none() is not None:
        return

    user = User(
        student_id=student_id,
        password_hash=get_password_hash(DEFAULT_PASSWORD),
        name=name,
        department=department,
        role=role,
    )
    db.add(user)


async def _get_or_create_equipment(
    db: AsyncSession, name: str, department: Department, quantity: int, description: str
) -> None:
    result = await db.execute(
        select(Equipment).where(Equipment.name == name, Equipment.department == department)
    )
    if result.scalar_one_or_none() is not None:
        return

    equipment = Equipment(
        name=name,
        department=department,
        total_quantity=quantity,
        available_quantity=quantity,
        description=description,
    )
    db.add(equipment)


async def seed_initial_data(db: AsyncSession) -> None:
    for entry in SEED_DATA:
        department = entry["department"]

        await _get_or_create_user(
            db,
            student_id=entry["assistant"]["student_id"],
            name=entry["assistant"]["name"],
            department=department,
            role=Role.ASSISTANT,
        )
        await _get_or_create_user(
            db,
            student_id=entry["student"]["student_id"],
            name=entry["student"]["name"],
            department=department,
            role=Role.STUDENT,
        )
        await _get_or_create_equipment(
            db,
            name=entry["equipment"]["name"],
            department=department,
            quantity=entry["equipment"]["quantity"],
            description=entry["equipment"]["description"],
        )

    await db.commit()
