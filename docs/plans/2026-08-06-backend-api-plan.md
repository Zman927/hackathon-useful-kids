# 기자재 대여 플랫폼 — 백엔드 API 구현 기록 (As-Built)

> 이 문서는 원래 TDD 태스크 계획 초안이었으나, 실제 개발 과정에서 설계가 크게 바뀌었다(무엇보다 인증(JWT)이 추가됨). **아래는 실제로 만들어진 백엔드를 기준으로 다시 정리한 "as-built" 기록**이다 — 지금 이 코드베이스를 처음 보는 사람이 구조를 파악하거나, 비슷한 걸 처음부터 다시 만들어야 할 때 참고하는 용도.
>
> **자동화 테스트는 존재하지 않는다.** 초안은 pytest + SQLite in-memory로 TDD를 하는 걸 전제로 했지만, 실제로는 시간 제약상 수동 테스트(curl/Swagger UI로 직접 호출 확인)로 진행됐다. `backend/tests/`는 없다.

**Goal:** 공학관 기자재 대여를 위한 REST API. 학생·조교 모두 로그인해서 학과별 재고를 조회하고 대여를 신청하며, 조교는 본인 학과 신청을 승인·반려하고 반납을 처리한다.

**Architecture:** FastAPI 단일 서비스 + PostgreSQL(로컬 네이티브 설치, Docker 안 씀). SQLAlchemy 2.x **비동기**(async, `asyncpg`) ORM으로 `User`, `Equipment`, `Rental` 세 테이블을 관리한다. **JWT 기반 인증** — 로그인 시 발급된 토큰을 `Authorization: Bearer`로 실어 보낸다. 비즈니스 로직은 별도 서비스 계층 없이 `app/api/*.py` 라우터에 직접 있다 (`docs/design/architecture.md`의 "계층 구조" 참고). 별도 배포 없음 — 로컬 uvicorn을 Tailscale로 시연에 그대로 사용한다.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.x(async) + `asyncpg`, Pydantic v2, `python-jose`(JWT), `passlib[bcrypt]`(비밀번호 해시), `python-multipart`(이미지 업로드), Tailscale.

## Global Constraints (실제 적용된 제약)

- DB 마이그레이션 도구 없음 — 앱 시작 시 `Base.metadata.create_all()`로 없는 테이블만 생성. 기존 테이블 컬럼을 바꾸려면 로컬 Postgres에 수동으로 `ALTER TABLE` 실행 필요
- Docker 미사용, 배포 없음 — `docs/design/architecture.md` 참고
- 상태값(`RentalStatus`)은 영문 Enum으로 저장한다: `PENDING` / `APPROVED` / `REJECTED` / `RETURNED` (초안의 한글 값에서 변경됨 — Enum 이름 그대로 저장하는 SQLAlchemy 기본 동작을 따름)
- CORS: 모든 origin 허용, `credentials`는 끔 (JWT를 쿠키가 아니라 `Authorization` 헤더로 보내므로 자격증명 모드가 필요 없고, `origins=*`와 `credentials=True`를 같이 쓰면 브라우저 스펙 위반이라 분리함)
- 커밋 메시지는 `docs/development/convention.md`의 `feat:`/`fix:`/`docs:`/`chore:` 규칙을 따른다
- 이 문서는 `backend/` 폴더만 다룬다

---

## 1. 기반: 설정 · DB 연결 · 인증

**Files:** `app/core/config.py`, `app/core/database.py`, `app/core/security.py`, `app/models/enums.py`, `app/models/user.py`, `app/deps.py`, `app/main.py`

- `core/config.py` — `pydantic-settings`로 `.env` 로드 (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`)
- `core/database.py` — `create_async_engine` + `async_sessionmaker`, `Base`, FastAPI 의존성용 `get_db()` 제너레이터
- `core/security.py` — `passlib`로 bcrypt 해시/검증, `python-jose`로 JWT 발급(`create_access_token`)/검증(`decode_access_token`)
- `models/enums.py` — `Department`(32개 학과 Enum), `Role`(`STUDENT`/`ASSISTANT`), `RentalStatus`
- `models/user.py` — `User` 모델 (`student_id` UNIQUE, `password_hash`, `name`, `department`, `role`)
- `deps.py` — `get_current_user`(토큰 검증 → `User` 조회), `require_role(*roles)` 팩토리 → `require_assistant` (학생/조교 구분 없이 로그인만 필요한 엔드포인트는 `get_current_user`를 직접 씀. 예전엔 `require_student`도 있었지만, 조교도 자기 명의로 대여할 수 있어야 해서 제거함)
- `main.py` — `lifespan`에서 시작 시 `create_all` + `seed_initial_data()` 실행, CORS 미들웨어, `/static` 정적 파일 마운트, 라우터 등록, `/health`

**완료 기준:** `uvicorn app.main:app --reload --port 8000` 실행 후 `/health` 200, `/docs`에서 Swagger UI 확인.

---

## 2. 학과 마스터 + 인증 API

**Files:** `app/models/departments.py`, `app/api/departments.py`, `app/schemas/auth.py`, `app/schemas/user.py`, `app/api/auth.py`

- `models/departments.py` — 5개 단과대학 × 32개 학과를 `id`(1~32)와 함께 하드코딩한 리스트(`DEPARTMENTS`). `Department` Enum ↔ `id` 상호 변환 헬퍼(`department_id_of`, `department_by_id`) 제공 — 프론트가 학과를 정수 ID로 다루기 때문
- `GET /departments` — 단과대학별로 묶어서 반환
- `POST /auth/login` — `student_id` + `password` 검증 → JWT 발급. 응답의 `role`은 프론트 친화적으로 `"admin"`/`"student"`로 매핑해서 내려줌(`ROLE_TO_FRONTEND`, `schemas/user.py`)
- `GET /auth/me` — 토큰으로 본인 정보 조회, `role` 매핑은 로그인 응답과 동일한 소스(`ROLE_TO_FRONTEND`)를 재사용해 값이 어긋나지 않게 함

**완료 기준:** 시드 계정으로 로그인 → 토큰 발급 → `/auth/me` 호출 시 로그인 응답과 동일한 `role` 값 확인.

---

## 3. 기자재 조회/등록/수정 API (사진 업로드 포함)

**Files:** `app/models/equipment.py`, `app/schemas/equipment.py`, `app/api/equipment.py`, `app/core/storage.py`

- `models/equipment.py` — `Equipment` (`name`, `department`, `category`, `total_quantity`, `available_quantity`, `description`, `image_url`)
- `core/storage.py` — 업로드된 이미지를 `Content-Type` 헤더 + 실제 파일 시그니처(매직 바이트)로 이중 검증, 5MB 초과분은 청크 단위로 조기 차단, `static/uploads/equipments/{uuid}.{ext}`로 저장하고 **상대경로**(`/static/uploads/equipments/...`)를 반환
- `schemas/equipment.py` — `EquipmentOut.from_equipment(equipment, base_url)`이 상대경로를 요청 시점의 host와 조합해 절대 URL로 만들어 응답 (DB에는 절대 URL을 저장하지 않음 — 백엔드 IP가 바뀌어도 기존 데이터가 깨지지 않도록)
- `GET /equipment?department_id=`, `GET /equipment/{id}` — 인증 불필요
- `POST /equipment`, `PATCH /equipment/{id}` — 조교 전용 + **본인 학과 기자재만** 등록/수정 가능하도록 검증 (생성 시에도 검증하도록 함 — 처음엔 수정에만 있고 생성엔 빠져 있던 구멍을 나중에 메움)

**완료 기준:** 조교 토큰으로 본인 학과 기자재 등록(사진 포함) → `GET /equipment`로 이미지 URL이 정상적으로 뜨는지 확인. 다른 학과 `department_id`로 등록 시도 시 403 확인.

---

## 4. 대여 신청 · 승인 · 반려 · 반납 · 취소 API

**Files:** `app/models/rental.py`, `app/schemas/rental.py`, `app/api/rentals.py`

- `models/rental.py` — `Rental` (`user_id`/`equipment_id` FK, `start_date`/`end_date`/`quantity`/`reason`, `status`, `is_cross_department`, `created_at`, `processed_at`)
- `POST /rentals` — 로그인만 하면 학생/조교 구분 없이 신청 가능. 기자재 행에 `SELECT ... FOR UPDATE`로 잠근 뒤 재고 확인 → **신청 시점에 즉시 `available_quantity` 차감** → `PENDING` 상태로 저장 (동시에 여러 명이 신청해도 재고보다 많이 나가지 않도록)
- `GET /rentals` — 로그인한 본인의 신청만 (역할 무관)
- `GET /rentals/all` — 조교 전용, 본인 학과 기자재에 대한 신청 전체
- `POST /rentals/{id}/approve` — 조교 + 본인 학과만, `PENDING → APPROVED`, `processed_at` 기록 (재고는 신청 시점에 이미 차감됐으므로 다시 건드리지 않음)
- `POST /rentals/{id}/reject` — 조교 + 본인 학과만, 재고 복구 + `PENDING → REJECTED`
- `POST /rentals/{id}/return` — 조교 + 본인 학과만, 재고 복구 + `APPROVED → RETURNED`
- `POST /rentals/{id}/cancel` — 신청 본인만(역할 무관), `PENDING`일 때만, 재고 복구 후 레코드 삭제

**완료 기준:** 신청 → 승인 → 반납 전체 흐름을 curl/Swagger로 직접 호출해 재고(`available_quantity`)와 상태 값이 매 단계마다 기대대로 바뀌는지 확인.

---

## 5. 시드 데이터

**Files:** `app/init_db.py`

- 앱 시작 시(`main.py`의 `lifespan`) `seed_initial_data()`가 이미 존재하지 않는 데이터만 채운다(멱등)
- 5개 학과(AI·SW융합학부 소속)에 조교 1명 + 학생 1명 + 기자재 1개씩, 공통 비밀번호 `pwd123`
- 이후 로컬 데모용으로 32개 학과 전체에 학과당 2개씩 기자재(사진 포함)를 DB에 직접 채워 넣었는데, 이건 `init_db.py`에는 반영돼 있지 않다 — **완전히 새 DB로 시작하면 시드 5개 학과분만 자동으로 채워진다.**

---

## 이후 발견되어 고친 것들 (참고용 변경 이력)

최초 구현 이후 코드 리뷰에서 발견해 고친 것들. 새로 이 코드를 보는 사람이 "왜 이렇게 돼 있지" 헷갈리지 않도록 기록.

- `SECRET_KEY`가 `.env`에 예시 문구 그대로 남아있던 것 → 랜덤 값으로 교체 (`docs/development/setup.md` 참고)
- CORS `allow_origins=["*"]` + `allow_credentials=True` 조합(스펙 위반) → `credentials=False`로 정리
- `POST /equipment`에 학과 소유권 검증이 빠져 있던 것 → `PATCH`와 동일하게 추가
- `POST /rentals`의 재고 체크가 레이스 컨디션에 노출돼 있던 것 → `SELECT ... FOR UPDATE` 추가
- 반납 처리(`RETURNED` 상태, `POST /rentals/{id}/return`)가 아예 없던 것 → 추가, `processed_at` 컬럼도 함께 추가
- `is_cross_department`가 항상 계산만 되고 응답에 노출되지 않던 것 → `RentalOut`에 노출
- 기자재 이미지 URL이 등록 시점의 Tailscale IP로 고정 저장돼 있던 것(IP가 바뀌면 전부 깨짐) → 상대경로 저장 + 응답 시점에 조립하는 방식으로 변경
- `GET /rentals`, `POST /rentals`, `POST /rentals/{id}/cancel`이 학생 전용으로 막혀 있어 조교가 자기 명의로 대여할 수 없던 것 → 로그인만 하면 역할 무관하게 접근 가능하도록 변경
- `POST /auth/login`과 `GET /auth/me`의 `role` 값이 서로 다르게 나가던 것(`"admin"` vs `"ASSISTANT"`) → 매핑 로직을 한 곳(`ROLE_TO_FRONTEND`)으로 통일
- "타 학과 대여 서약"(`pledge_agreed`) 기능은 한 차례 구현했다가 팀 판단으로 최종 제거함 — `is_cross_department`만 남아 있음
