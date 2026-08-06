# 기자재 대여 플랫폼 — 백엔드 API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공학관 기자재 대여를 위한 REST API를 만든다. 학생은 학과별 재고를 조회하고 대여를 신청하고, 조교는 신청을 승인·반려하고 반납을 처리한다.

**Architecture:** FastAPI 단일 서비스 + PostgreSQL(배포)/SQLite(테스트). SQLAlchemy ORM으로 `Equipment`, `Rental` 두 테이블을 관리한다. 인증 없음 — 조교 화면은 프론트엔드에서 비공개 URL로만 보호한다(MVP 범위).

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.x, Pydantic v2, pytest + httpx(TestClient), Railway(배포 — 백엔드+Postgres)

## Global Constraints

- DB 마이그레이션 도구 없음 — 앱 시작 시 `Base.metadata.create_all()`로 스키마 생성 (해커톤 속도 우선, Alembic 미사용)
- 인증 없음 — 모든 엔드포인트는 공개. 조교 보호는 프론트엔드 URL 비공개로만 처리
- CORS: 모든 origin 허용 (해커톤 기간 한정 완화 설정)
- 테스트 DB: SQLite in-memory (`StaticPool`) — Postgres와 별도 설치 없이 빠르게 실행
- 상태값(`RentalStatus`)은 한글 문자열로 저장한다: `신청됨` / `대여중` / `반려됨` / `반납완료`
- 커밋 메시지는 레포 루트 `README.md`의 `[타입] 내용` 규칙을 따른다 (예: `[추가] 기자재 조회 API`)
- 이 레포의 `backend/` 폴더만 다룬다. `frontend/`는 건드리지 않는다 (별도 계획: `2026-08-06-frontend-ui-plan.md`)

---

### Task 1: 프로젝트 셋업 + DB 연결 + 헬스체크

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Test: `backend/tests/test_health.py`

**Interfaces:**
- Consumes: 없음 (최초 태스크)
- Produces:
  - `get_db()` — FastAPI dependency, `database.py`
  - `Base` — SQLAlchemy declarative base, `database.py`
  - `app` — FastAPI 인스턴스, `main.py`
  - `db_session` fixture — 테스트용 raw SQLAlchemy 세션, `tests/conftest.py`
  - `client` fixture — 테스트용 `TestClient` (FastAPI 앱에 `db_session`을 주입), `tests/conftest.py`

- [ ] **Step 1: 프로젝트 구조와 requirements.txt 작성**

`backend/requirements.txt`:
```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
pydantic
pytest
httpx
```

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`backend/app/__init__.py`: 빈 파일로 생성.

- [ ] **Step 2: database.py 작성**

```python
# backend/app/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 3: conftest.py 작성 (테스트 DB 픽스처)**

```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

`backend/tests/__init__.py`: 빈 파일로 생성.

- [ ] **Step 4: 실패하는 헬스체크 테스트 작성**

```python
# backend/tests/test_health.py
def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: 테스트 실행 → 실패 확인**

Run: `pytest backend/tests/test_health.py -v` (backend 폴더 기준이면 `pytest tests/test_health.py -v`)
Expected: FAIL — `app.main` 모듈이 없어서 import 에러

- [ ] **Step 6: main.py 작성 (헬스체크 엔드포인트 포함)**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="기자재 대여 플랫폼 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: 테스트 실행 → 통과 확인**

Run: `pytest tests/test_health.py -v`
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add backend/requirements.txt backend/app backend/tests
git commit -m "[설정] FastAPI 프로젝트 셋업 + 헬스체크"
git push
```

---

### Task 2: Equipment 모델 + 조회 API

**Files:**
- Create: `backend/app/models.py`
- Create: `backend/app/schemas.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/equipment.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_equipment.py`

**Interfaces:**
- Consumes: `Base`, `get_db()`, `db_session`/`client` fixtures (Task 1)
- Produces:
  - `models.Equipment` (필드: `id`, `department`, `name`, `total_quantity`, `available_quantity`, `description`)
  - `models.Rental` (필드: `id`, `equipment_id`, `student_name`, `student_number`, `contact`, `reason`, `status`, `requested_at`, `processed_at`) — API는 Task 3에서 만들지만, `Base.metadata.create_all()`이 두 테이블을 한 번에 만들어야 해서 모델 정의는 여기서 함께 한다
  - `models.RentalStatus` (str Enum: `PENDING="신청됨"`, `APPROVED="대여중"`, `REJECTED="반려됨"`, `RETURNED="반납완료"`)
  - `schemas.EquipmentOut`, `schemas.RentalCreate`, `schemas.RentalOut` — 전부 여기서 정의, Rental 관련 스키마는 Task 3부터 쓰임
  - `GET /departments` → `list[str]`
  - `GET /equipment?department=` → `list[EquipmentOut]`

- [ ] **Step 1: models.py 작성 (Equipment + RentalStatus)**

```python
# backend/app/models.py
import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class RentalStatus(str, enum.Enum):
    PENDING = "신청됨"
    APPROVED = "대여중"
    REJECTED = "반려됨"
    RETURNED = "반납완료"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    total_quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    description = Column(String, nullable=True)


class Rental(Base):
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    student_name = Column(String, nullable=False)
    student_number = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, nullable=False, default=RentalStatus.PENDING.value)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    equipment = relationship("Equipment")
```

`Rental`은 Task 3에서 실제로 쓰이지만, 테이블을 한 파일에서 같이 정의해야 `Base.metadata.create_all()`이 두 테이블을 한 번에 만든다. Task 3에서 이 파일을 다시 열지 않는다.

- [ ] **Step 2: schemas.py 작성**

```python
# backend/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from .models import RentalStatus


class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department: str
    name: str
    total_quantity: int
    available_quantity: int
    description: str | None = None


class RentalCreate(BaseModel):
    equipment_id: int
    student_name: str
    student_number: str
    contact: str
    reason: str


class RentalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: int
    student_name: str
    student_number: str
    contact: str
    reason: str
    status: RentalStatus
    requested_at: datetime
    processed_at: datetime | None = None
```

`RentalCreate`/`RentalOut`은 Task 3에서 쓰이지만, 이 파일도 한 번만 작성해 이후 태스크에서 이어 쓴다.

- [ ] **Step 3: 실패하는 조회 테스트 작성**

```python
# backend/tests/test_equipment.py
from app import models


def _add_equipment(db_session, **overrides):
    defaults = dict(
        department="전자공학과",
        name="오실로스코프",
        total_quantity=3,
        available_quantity=3,
        description=None,
    )
    defaults.update(overrides)
    equipment = models.Equipment(**defaults)
    db_session.add(equipment)
    db_session.commit()
    db_session.refresh(equipment)
    return equipment


def test_list_departments_returns_distinct_departments(client, db_session):
    _add_equipment(db_session, department="전자공학과", name="오실로스코프")
    _add_equipment(db_session, department="전자공학과", name="함수발생기")
    _add_equipment(db_session, department="기계공학과", name="3D 프린터")

    response = client.get("/departments")

    assert response.status_code == 200
    assert sorted(response.json()) == ["기계공학과", "전자공학과"]


def test_list_equipment_filters_by_department(client, db_session):
    _add_equipment(db_session, department="전자공학과", name="오실로스코프")
    _add_equipment(db_session, department="기계공학과", name="3D 프린터")

    response = client.get("/equipment", params={"department": "전자공학과"})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["name"] == "오실로스코프"


def test_list_equipment_without_filter_returns_all(client, db_session):
    _add_equipment(db_session, department="전자공학과", name="오실로스코프")
    _add_equipment(db_session, department="기계공학과", name="3D 프린터")

    response = client.get("/equipment")

    assert response.status_code == 200
    assert len(response.json()) == 2
```

- [ ] **Step 4: 테스트 실행 → 실패 확인**

Run: `pytest tests/test_equipment.py -v`
Expected: FAIL — `/departments`, `/equipment` 라우트가 없어 404

- [ ] **Step 5: routers/equipment.py 작성 + main.py에 등록**

`backend/app/routers/__init__.py`: 빈 파일로 생성.

```python
# backend/app/routers/equipment.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.get("/departments", response_model=list[str])
def list_departments(db: Session = Depends(get_db)):
    rows = db.query(models.Equipment.department).distinct().all()
    return [row[0] for row in rows]


@router.get("/equipment", response_model=list[schemas.EquipmentOut])
def list_equipment(department: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Equipment)
    if department:
        query = query.filter(models.Equipment.department == department)
    return query.all()
```

`backend/app/main.py`에 추가 (기존 `@app.get("/health")` 아래):

```python
from .routers import equipment

app.include_router(equipment.router)
```

- [ ] **Step 6: 테스트 실행 → 통과 확인**

Run: `pytest tests/test_equipment.py tests/test_health.py -v`
Expected: PASS (5개 테스트 전부)

- [ ] **Step 7: 커밋**

```bash
git add backend/app backend/tests
git commit -m "[추가] 기자재 조회 API (학과 목록, 학과별 재고)"
git push
```

---

### Task 3: Rental 신청 생성 API

**Files:**
- Create: `backend/app/routers/rentals.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_rentals_create.py`

**Interfaces:**
- Consumes: `models.Equipment`, `models.Rental`, `models.RentalStatus`, `schemas.RentalCreate`, `schemas.RentalOut`, `get_db()` (Task 1, 2)
- Produces: `POST /rentals` → `RentalOut` (상태 `신청됨`으로 생성)

- [ ] **Step 1: 실패하는 테스트 작성**

```python
# backend/tests/test_rentals_create.py
from app import models


def _add_equipment(db_session, **overrides):
    defaults = dict(
        department="전자공학과",
        name="오실로스코프",
        total_quantity=3,
        available_quantity=3,
        description=None,
    )
    defaults.update(overrides)
    equipment = models.Equipment(**defaults)
    db_session.add(equipment)
    db_session.commit()
    db_session.refresh(equipment)
    return equipment


def test_create_rental_succeeds_for_existing_equipment(client, db_session):
    equipment = _add_equipment(db_session)

    response = client.post(
        "/rentals",
        json={
            "equipment_id": equipment.id,
            "student_name": "홍길동",
            "student_number": "20231234",
            "contact": "010-0000-0000",
            "reason": "캡스톤 프로젝트",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "신청됨"
    assert body["equipment_id"] == equipment.id


def test_create_rental_fails_for_unknown_equipment(client, db_session):
    response = client.post(
        "/rentals",
        json={
            "equipment_id": 999,
            "student_name": "홍길동",
            "student_number": "20231234",
            "contact": "010-0000-0000",
            "reason": "캡스톤 프로젝트",
        },
    )

    assert response.status_code == 404
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pytest tests/test_rentals_create.py -v`
Expected: FAIL — `/rentals` 라우트 없음 (404 대신 405 혹은 존재하지 않음)

- [ ] **Step 3: routers/rentals.py 작성 (POST만) + main.py 등록**

```python
# backend/app/routers/rentals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.post("/rentals", response_model=schemas.RentalOut, status_code=201)
def create_rental(rental: schemas.RentalCreate, db: Session = Depends(get_db)):
    equipment = db.get(models.Equipment, rental.equipment_id)
    if equipment is None:
        raise HTTPException(status_code=404, detail="기자재를 찾을 수 없습니다")

    db_rental = models.Rental(
        equipment_id=rental.equipment_id,
        student_name=rental.student_name,
        student_number=rental.student_number,
        contact=rental.contact,
        reason=rental.reason,
        status=models.RentalStatus.PENDING.value,
    )
    db.add(db_rental)
    db.commit()
    db.refresh(db_rental)
    return db_rental
```

`backend/app/main.py`에 추가:

```python
from .routers import rentals

app.include_router(rentals.router)
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pytest tests/test_rentals_create.py -v`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/app backend/tests
git commit -m "[추가] 대여 신청 생성 API"
git push
```

---

### Task 4: Rental 목록 + 승인/반려/반납 API

**Files:**
- Modify: `backend/app/routers/rentals.py`
- Test: `backend/tests/test_rentals_manage.py`

**Interfaces:**
- Consumes: `models.Rental`, `models.RentalStatus`, `models.Equipment`, `schemas.RentalOut`, `router` (Task 3)
- Produces:
  - `GET /rentals?status=` → `list[RentalOut]`
  - `PATCH /rentals/{id}/approve` → `RentalOut` (재고 -1, 상태 → `대여중`)
  - `PATCH /rentals/{id}/reject` → `RentalOut` (재고 불변, 상태 → `반려됨`)
  - `PATCH /rentals/{id}/return` → `RentalOut` (재고 +1, 상태 → `반납완료`)

- [ ] **Step 1: 실패하는 테스트 작성**

```python
# backend/tests/test_rentals_manage.py
from app import models


def _add_equipment(db_session, **overrides):
    defaults = dict(
        department="전자공학과",
        name="오실로스코프",
        total_quantity=3,
        available_quantity=3,
        description=None,
    )
    defaults.update(overrides)
    equipment = models.Equipment(**defaults)
    db_session.add(equipment)
    db_session.commit()
    db_session.refresh(equipment)
    return equipment


def _add_rental(db_session, equipment, **overrides):
    defaults = dict(
        equipment_id=equipment.id,
        student_name="홍길동",
        student_number="20231234",
        contact="010-0000-0000",
        reason="캡스톤 프로젝트",
        status=models.RentalStatus.PENDING.value,
    )
    defaults.update(overrides)
    rental = models.Rental(**defaults)
    db_session.add(rental)
    db_session.commit()
    db_session.refresh(rental)
    return rental


def test_list_rentals_filters_by_status(client, db_session):
    equipment = _add_equipment(db_session)
    _add_rental(db_session, equipment, status=models.RentalStatus.PENDING.value)
    _add_rental(db_session, equipment, status=models.RentalStatus.RETURNED.value)

    response = client.get("/rentals", params={"status": "신청됨"})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["status"] == "신청됨"


def test_approve_rental_reduces_available_quantity(client, db_session):
    equipment = _add_equipment(db_session, available_quantity=2)
    rental = _add_rental(db_session, equipment)

    response = client.patch(f"/rentals/{rental.id}/approve")

    assert response.status_code == 200
    assert response.json()["status"] == "대여중"
    db_session.refresh(equipment)
    assert equipment.available_quantity == 1


def test_approve_rental_fails_when_out_of_stock(client, db_session):
    equipment = _add_equipment(db_session, available_quantity=0)
    rental = _add_rental(db_session, equipment)

    response = client.patch(f"/rentals/{rental.id}/approve")

    assert response.status_code == 400


def test_approve_rental_fails_when_not_pending(client, db_session):
    equipment = _add_equipment(db_session)
    rental = _add_rental(db_session, equipment, status=models.RentalStatus.APPROVED.value)

    response = client.patch(f"/rentals/{rental.id}/approve")

    assert response.status_code == 400


def test_reject_rental_does_not_change_quantity(client, db_session):
    equipment = _add_equipment(db_session, available_quantity=2)
    rental = _add_rental(db_session, equipment)

    response = client.patch(f"/rentals/{rental.id}/reject")

    assert response.status_code == 200
    assert response.json()["status"] == "반려됨"
    db_session.refresh(equipment)
    assert equipment.available_quantity == 2


def test_return_rental_increases_available_quantity(client, db_session):
    equipment = _add_equipment(db_session, available_quantity=1)
    rental = _add_rental(db_session, equipment, status=models.RentalStatus.APPROVED.value)

    response = client.patch(f"/rentals/{rental.id}/return")

    assert response.status_code == 200
    assert response.json()["status"] == "반납완료"
    db_session.refresh(equipment)
    assert equipment.available_quantity == 2
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pytest tests/test_rentals_manage.py -v`
Expected: FAIL — `GET /rentals`, `PATCH .../approve|reject|return` 없음

- [ ] **Step 3: rentals.py에 나머지 엔드포인트 추가**

`backend/app/routers/rentals.py` 전체 내용 (Task 3의 `create_rental` 아래에 추가):

```python
# backend/app/routers/rentals.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.post("/rentals", response_model=schemas.RentalOut, status_code=201)
def create_rental(rental: schemas.RentalCreate, db: Session = Depends(get_db)):
    equipment = db.get(models.Equipment, rental.equipment_id)
    if equipment is None:
        raise HTTPException(status_code=404, detail="기자재를 찾을 수 없습니다")

    db_rental = models.Rental(
        equipment_id=rental.equipment_id,
        student_name=rental.student_name,
        student_number=rental.student_number,
        contact=rental.contact,
        reason=rental.reason,
        status=models.RentalStatus.PENDING.value,
    )
    db.add(db_rental)
    db.commit()
    db.refresh(db_rental)
    return db_rental


@router.get("/rentals", response_model=list[schemas.RentalOut])
def list_rentals(status: models.RentalStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Rental)
    if status:
        query = query.filter(models.Rental.status == status.value)
    return query.order_by(models.Rental.requested_at.desc()).all()


@router.patch("/rentals/{rental_id}/approve", response_model=schemas.RentalOut)
def approve_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = db.get(models.Rental, rental_id)
    if rental is None:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")
    if rental.status != models.RentalStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="대기 중인 신청만 승인할 수 있습니다")

    equipment = db.get(models.Equipment, rental.equipment_id)
    if equipment.available_quantity <= 0:
        raise HTTPException(status_code=400, detail="대여 가능한 재고가 없습니다")

    equipment.available_quantity -= 1
    rental.status = models.RentalStatus.APPROVED.value
    rental.processed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rental)
    return rental


@router.patch("/rentals/{rental_id}/reject", response_model=schemas.RentalOut)
def reject_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = db.get(models.Rental, rental_id)
    if rental is None:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")
    if rental.status != models.RentalStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="대기 중인 신청만 반려할 수 있습니다")

    rental.status = models.RentalStatus.REJECTED.value
    rental.processed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rental)
    return rental


@router.patch("/rentals/{rental_id}/return", response_model=schemas.RentalOut)
def return_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = db.get(models.Rental, rental_id)
    if rental is None:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다")
    if rental.status != models.RentalStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="대여중인 건만 반납 처리할 수 있습니다")

    equipment = db.get(models.Equipment, rental.equipment_id)
    equipment.available_quantity += 1
    rental.status = models.RentalStatus.RETURNED.value
    rental.processed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rental)
    return rental
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pytest tests/ -v`
Expected: PASS (전체)

- [ ] **Step 5: 커밋**

```bash
git add backend/app/routers/rentals.py backend/tests/test_rentals_manage.py
git commit -m "[추가] 대여 신청 목록/승인/반려/반납 API"
git push
```

---

### Task 5: 시드 데이터 + Railway 배포

**Files:**
- Create: `backend/app/seed.py`
- Create: `backend/Procfile`
- Test: `backend/tests/test_seed.py`

**Interfaces:**
- Consumes: `models.Equipment`, `SessionLocal`, `Base`, `engine` (Task 1, 2)
- Produces: `seed(db: Session) -> int` — 시드 함수 (몇 개 넣었는지 반환, 이미 데이터 있으면 0), Railway에 배포된 공개 URL

- [ ] **Step 1: 실패하는 테스트 작성**

```python
# backend/tests/test_seed.py
from app import models
from app.seed import seed, SEED_EQUIPMENT


def test_seed_inserts_all_equipment(db_session):
    count = seed(db_session)

    assert count == len(SEED_EQUIPMENT)
    assert db_session.query(models.Equipment).count() == len(SEED_EQUIPMENT)


def test_seed_is_idempotent(db_session):
    seed(db_session)

    second_count = seed(db_session)

    assert second_count == 0
    assert db_session.query(models.Equipment).count() == len(SEED_EQUIPMENT)
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pytest tests/test_seed.py -v`
Expected: FAIL — `app.seed` 모듈 없음

- [ ] **Step 3: seed.py 작성**

```python
# backend/app/seed.py
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from . import models

SEED_EQUIPMENT = [
    {"department": "전자공학과", "name": "오실로스코프", "total_quantity": 3, "available_quantity": 3, "description": "2채널, 최대 100MHz"},
    {"department": "전자공학과", "name": "함수발생기", "total_quantity": 2, "available_quantity": 2, "description": None},
    {"department": "기계공학과", "name": "3D 프린터", "total_quantity": 2, "available_quantity": 1, "description": "FDM 방식"},
    {"department": "기계공학과", "name": "토크렌치", "total_quantity": 5, "available_quantity": 5, "description": None},
    {"department": "컴퓨터공학과", "name": "라즈베리파이 키트", "total_quantity": 10, "available_quantity": 8, "description": "라즈베리파이 4 + 센서 세트"},
    {"department": "컴퓨터공학과", "name": "아두이노 키트", "total_quantity": 15, "available_quantity": 15, "description": None},
]


def seed(db: Session) -> int:
    if db.query(models.Equipment).count() > 0:
        return 0
    for item in SEED_EQUIPMENT:
        db.add(models.Equipment(**item))
    db.commit()
    return len(SEED_EQUIPMENT)


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = seed(db)
        print(f"{count}개 기자재를 추가했습니다." if count else "이미 데이터가 있어 시드를 건너뜁니다.")
    finally:
        db.close()
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pytest tests/ -v`
Expected: PASS (전체)

- [ ] **Step 5: Procfile 작성 (Railway 시작 명령)**

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 6: 커밋**

```bash
git add backend/app/seed.py backend/Procfile backend/tests/test_seed.py
git commit -m "[추가] 시드 데이터 스크립트 + Railway 배포 설정"
git push
```

- [ ] **Step 7: Railway 배포**

```bash
railway login
railway init
railway add --database postgres
railway up
```

- [ ] **Step 8: 배포 확인**

```bash
curl https://<railway-app-url>/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 9: 배포 환경에 시드 데이터 주입**

```bash
railway run python -m app.seed
```
Expected: `6개 기자재를 추가했습니다.`

- [ ] **Step 10: 배포 URL을 레포 루트 README.md에 기록**

`README.md`의 "링크" 섹션(또는 새 섹션)에 배포된 백엔드 URL을 적어 프론트엔드 담당자가 `VITE_API_BASE`로 바로 쓸 수 있게 한다.
