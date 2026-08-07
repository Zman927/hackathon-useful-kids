# ERD 및 테이블 정의서

> 이 문서는 실제 구현된 백엔드(`backend/app/models/`) 기준으로 작성됨. 로그인(JWT)·학과 마스터·기자재 사진 등이 포함된 확장 스키마이며, 아래 "검토 중인 확장안"에 있던 항목들이 전부 채택되어 반영된 상태다.

## 현재 스키마

```
┌───────────────────────────┐
│           users            │
├───────────────────────────┤
│ PK  id             : SERIAL│
│ UQ  student_id     : VARCHAR│
│     password_hash  : VARCHAR│
│     name           : VARCHAR│
│     department     : department_enum│
│     role           : role_enum│
│     created_at      : TIMESTAMPTZ│
└──────────────┬─────────────┘
               │ (1)
               │ 사용자 1명은 여러 대여 신청을 가짐
               ▼ (N)
┌───────────────────────────┐        (N) ┌───────────────────────────┐
│          rentals           │◀───────────┤          equipments        │
├───────────────────────────┤   기자재 1개는│├───────────────────────────┤
│ PK  id             : SERIAL│  여러 대여와  ││ PK  id             : SERIAL│
│ FK  user_id        : INTEGER│  연결 (1)   ││     name           : VARCHAR│
│ FK  equipment_id    : INTEGER│───────────┘│     department     : department_enum│
│     start_date      : DATE  │             │     category       : VARCHAR (nullable)│
│     end_date        : DATE  │             │     total_quantity  : INTEGER│
│     quantity        : INTEGER│             │     available_quantity: INTEGER│
│     reason          : TEXT (nullable)│     │     description    : TEXT (nullable)│
│     status          : rental_status_enum│  │     image_url       : VARCHAR (nullable)│
│     is_cross_department: BOOLEAN│          │     created_at      : TIMESTAMPTZ│
│     created_at      : TIMESTAMPTZ│         └───────────────────────────┘
│     processed_at    : TIMESTAMPTZ (nullable)│
└───────────────────────────┘
```

### `users`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | SERIAL | PK | 고유 식별자 |
| `student_id` | VARCHAR(20) | UNIQUE, NOT NULL | 로그인 ID (학번 또는 조교 계정명) |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt 해시 (평문 저장 안 함) |
| `name` | VARCHAR(50) | NOT NULL | 이름 |
| `department` | ENUM(`department_enum`) | NOT NULL | 소속 학과 (32개 학과, [departments.py](../../backend/app/models/departments.py) 참고) |
| `role` | ENUM(`role_enum`) | NOT NULL | `STUDENT` \| `ASSISTANT` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 가입 일시 |

### `equipments`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | SERIAL | PK | 고유 식별자 |
| `name` | VARCHAR(100) | NOT NULL | 기자재명 |
| `department` | ENUM(`department_enum`) | NOT NULL | 관리 학과 |
| `category` | VARCHAR(50) | NULLABLE | 분류 (예: `IT기기`, `측정장비`) |
| `total_quantity` | INTEGER | NOT NULL, DEFAULT 0 | 전체 보유 수량 |
| `available_quantity` | INTEGER | NOT NULL, DEFAULT 0 | 현재 대여 가능 수량 |
| `description` | TEXT | NULLABLE | 상세 설명 |
| `image_url` | VARCHAR(255) | NULLABLE | 기자재 사진. **DB엔 `/static/uploads/equipments/...` 상대경로로 저장**하고, API 응답 시점에 요청받은 host를 붙여 절대 URL로 내려준다 (백엔드 IP가 바뀌어도 안 깨지도록) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 등록 일시 |

### `rentals`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | SERIAL | PK | 대여 신청 번호 |
| `user_id` | INTEGER | FK → `users.id`, NOT NULL | 신청자 |
| `equipment_id` | INTEGER | FK → `equipments.id`, NOT NULL | 대상 기자재 |
| `start_date` | DATE | NOT NULL | 대여 시작일 |
| `end_date` | DATE | NOT NULL | 대여 종료일 (시작일보다 빠를 수 없음, API에서 검증) |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | 신청 수량 |
| `reason` | TEXT | NULLABLE | 대여 사유 (API 필드명은 `purpose`) |
| `status` | ENUM(`rental_status_enum`) | NOT NULL, DEFAULT `PENDING` | `PENDING` / `APPROVED` / `REJECTED` / `RETURNED` |
| `is_cross_department` | BOOLEAN | NOT NULL, DEFAULT false | 신청자 학과 ≠ 기자재 학과 여부 (신청 시점에 계산해서 저장) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | 신청 일시 |
| `processed_at` | TIMESTAMPTZ | NULLABLE | 승인/반려/반납 처리 일시 |

로그인 계정(`users`)을 신청자 정보로 참조하므로, 이전 안(신청자 정보를 폼에서 직접 입력)과 달리 `student_name`/`student_number`/`contact` 컬럼은 없다 — 응답 시 `users` 테이블을 조인해서 채운다.

## 상태 전이

```
PENDING ──approve──▶ APPROVED ──return──▶ RETURNED
   │
   └──reject──▶ REJECTED

PENDING ──cancel(본인만)──▶ (삭제)
```

- 재고 차감은 **승인 시점이 아니라 신청 생성 시점**에 일어난다 (`available_quantity -= quantity`). 신청 단계에서부터 재고를 선점해 중복 신청을 막기 위함.
- 반려/취소/반납 시 `available_quantity`를 신청 수량만큼 되돌린다.
- 신청 생성 시 기자재 행에 `SELECT ... FOR UPDATE` 잠금을 걸어, 동시에 여러 명이 같은 기자재를 신청해도 재고보다 많이 승인되지 않도록 한다.

## 마이그레이션 도구

Alembic 등 별도 마이그레이션 도구는 쓰지 않는다. 앱 시작 시 `Base.metadata.create_all()`로 없는 테이블만 생성한다 — **기존 테이블의 컬럼 추가/변경은 자동 반영되지 않으므로, 스키마를 바꿀 때는 로컬 Postgres에 수동으로 `ALTER TABLE`을 실행해야 한다.**

## 시드 데이터

앱 시작 시 `app/init_db.py`의 `seed_initial_data()`가 존재하지 않는 데이터만 채운다(멱등):
- 5개 학과(AI·SW융합학부 소속)에 조교 1명 + 학생 1명 + 기자재 1개씩
- 기본 비밀번호: `pwd123` (전 계정 공통, 데모용)

이후 나머지 27개 학과(32개 전체 기준)와 학과당 2개씩의 기자재는 시드 스크립트가 아니라 **DB에 직접 데이터를 채워 넣은 것**이라, `init_db.py`를 다시 실행해도 새로 안 생기고 재현되지 않는다 — 완전히 새 DB에서 시작하면 이 시드 5개 학과분만 자동으로 채워진다.
