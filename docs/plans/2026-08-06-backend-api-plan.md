# 기자재 대여 플랫폼 — 백엔드 API Implementation Plan

> 이 문서는 TDD 방식 구현 계획입니다. Task 순서대로, 각 Step의 체크박스(`- [ ]`)를 따라 진행하세요.

**Goal:** 공학관 기자재 대여를 위한 REST API를 만든다. 학생은 학과별 재고를 조회하고 대여를 신청하고, 조교는 신청을 승인·반려하고 반납을 처리한다.

**Architecture:** FastAPI 단일 서비스 + PostgreSQL(로컬 네이티브 설치, Docker 안 씀)/SQLite(테스트만 — 속도용). SQLAlchemy ORM으로 `Equipment`, `Rental` 두 테이블을 관리한다. 인증 없음 — 조교 화면은 프론트엔드에서 비공개 URL로만 보호한다(MVP 범위). **별도 배포 없음** — 개발 중 쓰던 로컬 서버(uvicorn)를 Tailscale로 그대로 시연에 쓴다.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.x, Pydantic v2, pytest + httpx(TestClient), Tailscale(팀원·시연 간 네트워크 연결). Docker 미사용 — 보일러플레이트는 `backend/app/main.py`, `core/config.py`, `core/database.py`에 이미 있음 (`docs/development/setup.md` 참고)

## Global Constraints

- DB 마이그레이션 도구 없음 — 앱 시작 시 `Base.metadata.create_all()`로 스키마 생성 (해커톤 속도 우선, Alembic 미사용)
- **Docker를 쓰지 않는다.** PostgreSQL은 각자 컴퓨터에 네이티브로 설치한다 (`docs/development/setup.md` 참고)
- **배포하지 않는다.** 심사위원이 원격으로 접속할 필요가 없어(제출물은 github + 현장 시연) 미니서버·퍼블릭 URL이 전부 불필요. 개발 중 쓰던 로컬 백엔드(uvicorn --reload)를 시연 당일에도 그대로 켜두고 Tailscale로 프론트와 연결한다
- 인증 없음 — 모든 엔드포인트는 공개. 조교 보호는 프론트엔드 URL 비공개로만 처리
- CORS: 모든 origin 허용 (해커톤 기간 한정 완화 설정)
- 테스트 DB: SQLite in-memory (`StaticPool`) — 실제 DB(Postgres) 없이도 테스트가 빠르게 실행됨
- 라우터는 `backend/app/api/` 아래에 둔다 (`routers/`가 아님). 검증만 하고, 비즈니스 로직은 `backend/app/services/`에 둔다
- 상태값(`RentalStatus`)은 한글 문자열로 저장한다: `신청됨` / `대여중` / `반려됨` / `반납완료`
- 커밋 메시지는 `docs/development/convention.md`의 `feat:`/`fix:`/`test:`/`chore:` 규칙을 따른다
- 이 레포의 `backend/` 폴더만 다룬다. `frontend/`는 건드리지 않는다 (별도 계획: `2026-08-06-frontend-ui-plan.md`)

---

### Task 1: 보일러플레이트 확인 + DB 연결 + 헬스체크 테스트

**보일러플레이트는 이미 레포에 있다.** `backend/requirements.txt`, `backend/.env.example`, `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/core/database.py`가 전부 준비돼 있으므로 이 태스크는 새로 만드는 게 아니라 **연결을 확인하고 테스트 인프라를 얹는 것**이다.

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Test: `backend/tests/test_health.py`

**Interfaces:**
- Consumes: `get_db()`, `Base`(`app/core/database.py`), `app`(`app/main.py`) — 이미 존재
- Produces:
  - `db_session` fixture — 테스트용 raw SQLAlchemy 세션, `tests/conftest.py`
  - `client` fixture — 테스트용 `TestClient` (FastAPI 앱에 `db_session`을 주입), `tests/conftest.py`

- [ ] **Step 1: PostgreSQL 연결 확인**

`docs/development/setup.md`대로 PostgreSQL을 네이티브 설치하고 `.env`를 채운 뒤:

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# .env를 실제 Postgres 접속 정보로 수정
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/health`에서 `{"status": "ok"}`가 뜨면 DB 연결·앱 실행 확인 완료.

- [ ] **Step 2: conftest.py 작성 (테스트 DB 픽스처)**

테스트는 실제 Postgres가 없어도 돌아가도록 SQLite in-memory를 쓴다.

```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
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

- [ ] **Step 3: 헬스체크 테스트 작성**

```python
# backend/tests/test_health.py
def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pytest tests/test_health.py -v`
Expected: PASS (헬스체크는 이미 `main.py`에 구현돼 있으므로 바로 통과해야 정상)

- [ ] **Step 5: 커밋**

```bash
git add backend/tests
git commit -m "test: 헬스체크 테스트 및 conftest 픽스처 추가"
git push
```

---

### Task 2: Equipment 모델 + 조회 API

**Files:**
- Create: `backend/app/models/rental_status.py`
- Create: `backend/app/models/equipment.py`
- Create: `backend/app/models/rental.py`
- Modify: `backend/app/models/__init__.py` (재수출 — 이미 빈 패키지로 존재)
- Create: `backend/app/schemas/equipment.py`
- Create: `backend/app/schemas/rental.py`
- Modify: `backend/app/schemas/__init__.py` (재수출 — 이미 빈 패키지로 존재)
- Create: `backend/app/api/equipment.py`
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

- [ ] **Step 1: models/ 패키지 작성 (Equipment + Rental + RentalStatus)**

`backend/app/models/__init__.py`는 이미 빈 패키지로 있다 (보일러플레이트). 아래 세 파일을 추가하고 `__init__.py`에 재수출을 채운다.

```python
# backend/app/models/rental_status.py
import enum


class RentalStatus(str, enum.Enum):
    PENDING = "신청됨"
    APPROVED = "대여중"
    REJECTED = "반려됨"
    RETURNED = "반납완료"
```

```python
# backend/app/models/equipment.py
from sqlalchemy import Column, Integer, String

from ..core.database import Base


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    total_quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
```

```python
# backend/app/models/rental.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base
from .rental_status import RentalStatus


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

```python
# backend/app/models/__init__.py
from .rental_status import RentalStatus
from .equipment import Equipment
from .rental import Rental
```

`from app import models`로 불러오면 기존처럼 `models.Equipment`, `models.Rental`, `models.RentalStatus`로 그대로 쓸 수 있다 — 아래 테스트 코드가 그 형태를 그대로 쓴다.

`Rental`은 Task 3에서 실제로 API에 쓰이지만, 테이블을 여기서 같이 정의해야 `Base.metadata.create_all()`이 두 테이블을 한 번에 만든다. Task 3에서 이 파일들을 다시 열지 않는다.

- [ ] **Step 2: schemas/ 패키지 작성**

`backend/app/schemas/__init__.py`도 이미 빈 패키지로 있다.

```python
# backend/app/schemas/equipment.py
from pydantic import BaseModel, ConfigDict


class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department: str
    name: str
    total_quantity: int
    available_quantity: int
    description: str | None = None
```

```python
# backend/app/schemas/rental.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from ..models import RentalStatus


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

```python
# backend/app/schemas/__init__.py
from .equipment import EquipmentOut
from .rental import RentalCreate, RentalOut
```

`from app import schemas`로 불러오면 `schemas.EquipmentOut`, `schemas.RentalCreate`, `schemas.RentalOut`으로 그대로 쓸 수 있다.

`RentalCreate`/`RentalOut`은 Task 3에서 쓰이지만, 이 파일들도 한 번만 작성해 이후 태스크에서 이어 쓴다.

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

- [ ] **Step 5: api/equipment.py 작성 + main.py에 등록**

`backend/app/api/__init__.py`: 빈 파일로 생성.

```python
# backend/app/api/equipment.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db

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
from .api import equipment

app.include_router(equipment.router)
```

- [ ] **Step 6: 테스트 실행 → 통과 확인**

Run: `pytest tests/test_equipment.py tests/test_health.py -v`
Expected: PASS (5개 테스트 전부)

- [ ] **Step 7: 커밋**

```bash
git add backend/app backend/tests
git commit -m "feat: 기자재 조회 API (학과 목록, 학과별 재고)"
git push
```

---

### Task 3: Rental 신청 생성 API

**Files:**
- Create: `backend/app/api/rentals.py`
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

- [ ] **Step 3: api/rentals.py 작성 (POST만) + main.py 등록**

```python
# backend/app/api/rentals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db

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
from .api import rentals

app.include_router(rentals.router)
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pytest tests/test_rentals_create.py -v`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/app backend/tests
git commit -m "feat: 대여 신청 생성 API"
git push
```

---

### Task 4: Rental 목록 + 승인/반려/반납 API

**Files:**
- Modify: `backend/app/api/rentals.py`
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

`backend/app/api/rentals.py` 전체 내용 (Task 3의 `create_rental` 아래에 추가):

```python
# backend/app/api/rentals.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db

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
git add backend/app/api/rentals.py backend/tests/test_rentals_manage.py
git commit -m "feat: 대여 신청 목록/승인/반려/반납 API"
git push
```

---

### Task 5: 시드 데이터 + 시연 연결 확인 (배포 없음, Tailscale만)

**Files:**
- Create: `backend/app/seed.py`
- Test: `backend/tests/test_seed.py`

**Interfaces:**
- Consumes: `models.Equipment`, `SessionLocal`, `Base`, `engine` (Task 1, 2)
- Produces: `seed(db: Session) -> int` — 시드 함수 (몇 개 넣었는지 반환, 이미 데이터 있으면 0)

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

from .core.database import Base, SessionLocal, engine
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

- [ ] **Step 5: 로컬 시드 데이터 주입**

```bash
python -m app.seed
```
Expected: `6개 기자재를 추가했습니다.` (`.env`에 연결된 로컬 PostgreSQL에 그대로 들어감)

- [ ] **Step 6: 커밋**

```bash
git add backend/app/seed.py backend/tests/test_seed.py
git commit -m "feat: 시드 데이터 스크립트"
git push
```

- [ ] **Step 7: Tailscale로 다른 기기에서 접근 확인**

이 컴퓨터에서 `uvicorn app.main:app --reload --port 8000`이 켜진 상태에서, `tailscale ip -4`로 본인 IP 확인 후 팀원 다른 기기(같은 tailnet)에서:

```bash
curl http://<이 컴퓨터의 Tailscale IP>:8000/health
```
Expected: `{"status":"ok"}` — 이게 되면 프론트가 이 백엔드에 연결할 준비 끝. 협업가이드의 "개발 중 프론트-백엔드 통신" 섹션에 이 IP를 공유한다.

- [ ] **Step 8: 시연 당일 체크리스트에 반영**

이 로컬 서버(uvicorn + PostgreSQL)가 시연 당일에도 그대로 켜져 있어야 한다. 시연 전 재부팅했다면 PostgreSQL 서비스가 자동 기동됐는지 확인 후 `uvicorn app.main:app --reload --port 8000` 다시 실행. **백업:** Tailscale 연결이 현장에서 불안정할 경우를 대비해, 프론트와 백엔드를 한 노트북에서 같이 띄우는 방법도 알아둔다 (`VITE_API_BASE_URL=http://localhost:8000`으로 바꾸기만 하면 됨).
