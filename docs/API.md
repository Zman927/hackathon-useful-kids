# API Reference

REST API 전체 명세입니다. 서버 실행 중에는 `http://<host>:8000/docs`에서 대화형 문서(Swagger UI)를 이용할 수 있습니다.

---

## 공통 사항

### Base URL

| 환경 | 주소 |
|---|---|
| 로컬 | `http://localhost:8000` |
| Tailscale (팀원 백엔드) | `http://<Tailscale IP>:8000` |

### 인증

로그인 이후의 모든 요청은 `Authorization` 헤더에 JWT를 포함해야 합니다.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

프론트엔드에서는 [`apiClient.js`](../frontend/src/api/apiClient.js)가 토큰 주입과 401 처리를 자동으로 수행합니다.

### 권한 표기

| 표기 | 의미 |
|---|---|
| 🔓 | 인증 불필요 |
| 🔒 | 로그인 필요 (학생 · 조교) |
| 🛡️ | 조교 권한 필요 + **본인 학과 소유권 검증** |

### 오류 응답

모든 오류는 동일한 형태를 따릅니다.

```json
{ "detail": "사람이 읽을 수 있는 한국어 메시지" }
```

| 코드 | 상황 |
|---|---|
| `400` | 잘못된 요청 — 재고 부족, 처리 불가능한 상태 전이 |
| `401` | 인증 실패 — 토큰 누락 · 만료 · 위조, 로그인 정보 불일치 |
| `403` | 권한 없음 — 역할 부족 또는 타 학과 리소스 접근 |
| `404` | 대상 없음 |
| `422` | 스키마 검증 실패 (Pydantic 자동 응답) |

### API 버저닝

본 프로젝트는 `/api/v1` 형태의 버전 경로를 사용하지 않습니다. 단일 버전으로 종료되는 프로젝트에서 버전 세그먼트는 불필요한 추상화 계층이라 판단했습니다.

---

## 엔드포인트 목록

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/health` | 🔓 | 서버 상태 확인 |
| `POST` | `/auth/login` | 🔓 | 로그인 |
| `GET` | `/auth/me` | 🔒 | 내 정보 조회 |
| `GET` | `/departments` | 🔓 | 학과 목록 (학부별 그룹) |
| `GET` | `/equipment` | 🔓 | 기자재 목록 |
| `GET` | `/equipment/{id}` | 🔓 | 기자재 상세 |
| `POST` | `/equipment` | 🛡️ | 기자재 등록 |
| `PATCH` | `/equipment/{id}` | 🛡️ | 기자재 수정 |
| `POST` | `/rentals` | 🔒 | 대여 신청 |
| `GET` | `/rentals` | 🔒 | 내 대여 내역 |
| `GET` | `/rentals/all` | 🛡️ | 학과 전체 대여 현황 |
| `POST` | `/rentals/{id}/approve` | 🛡️ | 승인 |
| `POST` | `/rentals/{id}/reject` | 🛡️ | 반려 |
| `POST` | `/rentals/{id}/return` | 🛡️ | 반납 처리 |
| `POST` | `/rentals/{id}/cancel` | 🔒 | 신청 취소 (본인) |

---

## 1. System

### `GET /health` 🔓

서버 가동 확인용. 인증·DB 접근 없이 응답합니다.

```json
{ "status": "ok" }
```

---

## 2. Authentication

### `POST /auth/login` 🔓

**Request**

```json
{
  "student_id": "2026001",
  "password": "pwd123"
}
```

**Response** `200`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "2026001",
  "user_name": "컴퓨터공학과 학생",
  "role": "student"
}
```

| 필드 | 설명 |
|---|---|
| `access_token` | JWT. 기본 만료 60분 (`ACCESS_TOKEN_EXPIRE_MINUTES`) |
| `role` | `student` \| `admin` (DB의 `STUDENT`/`ASSISTANT`를 프론트엔드 표현으로 변환) |

**Errors**

| 코드 | 메시지 | 조건 |
|---|---|---|
| `401` | 학번 또는 비밀번호가 올바르지 않습니다. | 계정 없음 또는 비밀번호 불일치 |

> 존재하지 않는 계정과 비밀번호 오류를 **동일한 메시지**로 응답합니다. 계정 존재 여부가 노출되지 않도록 하기 위함입니다.

### `GET /auth/me` 🔒

**Response** `200`

```json
{
  "id": 1,
  "student_id": "2026001",
  "name": "컴퓨터공학과 학생",
  "department": "컴퓨터공학과",
  "role": "student",
  "created_at": "2026-08-07T01:20:00Z"
}
```

새로고침 후 세션 복원 시 토큰 유효성 확인 용도로 사용합니다.

---

## 3. Departments

### `GET /departments` 🔓

32개 학과를 학부별로 묶어 반환합니다.

**Response** `200`

```json
[
  {
    "college": "AI·SW융합학부",
    "departments": [
      { "id": 1, "name": "AI게임소프트웨어학과" },
      { "id": 2, "name": "컴퓨터공학과" },
      { "id": 3, "name": "컴퓨터보안공학과" },
      { "id": 4, "name": "전자공학과" },
      { "id": 5, "name": "정보통신공학과" }
    ]
  },
  {
    "college": "스마트시스템공학부",
    "departments": [
      { "id": 6, "name": "기계공학과" }
    ]
  }
]
```

---

## 4. Equipment

### `GET /equipment` 🔓

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `department_id` | `int` | 아니오 | 학과 필터. 생략 시 전체 조회 |

**Example**

```http
GET /equipment?department_id=2
```

**Response** `200`

```json
[
  {
    "id": 1,
    "name": "라즈베리 파이 4",
    "department": "컴퓨터공학과",
    "departmentId": 2,
    "category": null,
    "totalQuantity": 5,
    "remainingQuantity": 4,
    "description": "라즈베리 파이 4 Model B",
    "imageUrl": "http://100.74.207.33:8000/static/uploads/a1b2c3.jpg"
  }
]
```

> `imageUrl`은 DB에 상대 경로로 저장되며, 응답 시 요청의 base URL과 결합되어 절대 URL로 반환됩니다. 서버 주소가 바뀌어도 데이터 수정이 필요 없습니다.

**Errors**

| 코드 | 메시지 | 조건 |
|---|---|---|
| `400` | 존재하지 않는 학과 ID입니다. | 1~32 범위 밖 |

### `GET /equipment/{id}` 🔓

단일 기자재 상세. 응답 형태는 목록의 개별 항목과 동일합니다.

**Errors** — `404` 기자재를 찾을 수 없습니다.

### `POST /equipment` 🛡️

기자재를 등록합니다. 이미지 업로드를 위해 `multipart/form-data`를 사용합니다.

**Request** `multipart/form-data`

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `name` | `string` | ✅ | |
| `department_id` | `int` | ✅ | **본인 소속 학과여야 함** |
| `total_quantity` | `int` | ✅ | `> 0` |
| `category` | `string` | | |
| `description` | `string` | | |
| `image` | `file` | | 이미지 파일 |

등록 시 `available_quantity`는 `total_quantity`와 동일하게 초기화됩니다.

**Response** `201` — 생성된 기자재 객체

**Errors**

| 코드 | 메시지 | 조건 |
|---|---|---|
| `400` | 존재하지 않는 학과 ID입니다. | 잘못된 `department_id` |
| `403` | 이 작업을 수행할 권한이 없습니다. | 학생 계정 |
| `403` | 본인 학과의 기자재만 등록할 수 있습니다. | 타 학과 ID 지정 |

### `PATCH /equipment/{id}` 🛡️

전달된 필드만 갱신합니다. `multipart/form-data`.

| 필드 | 타입 | 비고 |
|---|---|---|
| `name` | `string` | |
| `total_quantity` | `int` | `> 0` |
| `category` | `string` | |
| `description` | `string` | |
| `image` | `file` | 교체 시 기존 파일 삭제 |

**`total_quantity` 변경 시 재고 처리**

```
delta = 새 총수량 − 기존 총수량
available_quantity = max(0, available_quantity + delta)
```

증감분만 가용 수량에 반영하므로 **이미 대여 중인 수량이 보존**됩니다. 총수량을 5→3으로 줄여도 대여 중인 2대가 사라지지 않습니다.

**Errors** — `403` 본인 학과의 기자재만 수정할 수 있습니다. / `404` 기자재를 찾을 수 없습니다.

---

## 5. Rentals

### `POST /rentals` 🔒

대여를 신청합니다. **신청 즉시 재고가 차감**되며, 처리는 [행 잠금으로 원자적으로 수행](Architecture.md#32-동시성-제어--재고-정합성)됩니다.

**Request**

```json
{
  "equipment_id": 1,
  "start_date": "2026-08-10",
  "end_date": "2026-08-15",
  "quantity": 1,
  "purpose": "캡스톤 디자인 프로젝트 프로토타입 제작"
}
```

**Response** `201`

```json
{
  "id": 10,
  "equipmentId": 1,
  "equipmentName": "라즈베리 파이 4",
  "departmentName": "컴퓨터공학과",
  "imageUrl": "http://100.74.207.33:8000/static/uploads/a1b2c3.jpg",
  "applicantName": "컴퓨터공학과 학생",
  "applicantStudentId": "2026001",
  "startDate": "2026-08-10",
  "endDate": "2026-08-15",
  "quantity": 1,
  "purpose": "캡스톤 디자인 프로젝트 프로토타입 제작",
  "status": "pending",
  "isCrossDepartment": false,
  "createdAt": "2026-08-07T02:00:00Z",
  "processedAt": null
}
```

| 필드 | 설명 |
|---|---|
| `status` | `pending` \| `rented` \| `rejected` \| `returned` |
| `isCrossDepartment` | 신청 시점에 `기자재 학과 ≠ 신청자 학과`이면 `true` |

**Errors**

| 코드 | 메시지 | 조건 |
|---|---|---|
| `400` | 대여 가능한 수량이 없습니다. | `available_quantity < quantity` |
| `401` | 인증 정보가 유효하지 않습니다. | 토큰 문제 |
| `404` | 기자재를 찾을 수 없습니다. | |

### `GET /rentals` 🔒

본인이 신청한 내역만 최신순으로 반환합니다. 응답은 `RentalOut` 배열입니다.

### `GET /rentals/all` 🛡️

**본인 학과 기자재**에 대한 모든 학생의 신청 내역을 최신순으로 반환합니다. 조교 대시보드용입니다.

**Errors** — `403` 이 작업을 수행할 권한이 없습니다.

### 상태 변경 엔드포인트

세 엔드포인트 모두 조교 권한과 학과 소유권을 검증하며, 성공 시 `processed_at`이 기록되고 갱신된 `RentalOut`을 반환합니다.

| 엔드포인트 | 전제 상태 | 결과 상태 | 재고 |
|---|---|---|---|
| `POST /rentals/{id}/approve` 🛡️ | `PENDING` | `APPROVED` | 변동 없음 |
| `POST /rentals/{id}/reject` 🛡️ | `PENDING` | `REJECTED` | **+quantity** |
| `POST /rentals/{id}/return` 🛡️ | `APPROVED` | `RETURNED` | **+quantity** |

> 승인 시 재고가 변하지 않는 것은 **신청 시점에 이미 차감**되었기 때문입니다. 이 설계로 승인 대기 중인 장비가 다른 학생에게 이중 배정되지 않습니다.

**공통 Errors**

| 코드 | 메시지 | 조건 |
|---|---|---|
| `400` | 이미 처리된 대여 신청입니다. | approve · reject에서 상태가 `PENDING`이 아님 |
| `400` | 대여중인 신청만 반납 처리할 수 있습니다. | return에서 상태가 `APPROVED`가 아님 |
| `403` | 본인 학과 기자재에 대한 대여 신청만 처리할 수 있습니다. | 타 학과 신청 |
| `404` | 대여 신청을 찾을 수 없습니다. | |

### `POST /rentals/{id}/cancel` 🔒

본인이 신청한 **심사 중** 건을 취소합니다. 레코드를 삭제하고 재고를 복원합니다.

**Response** `204 No Content`

**Errors**

| 코드 | 메시지 | 조건 |
|---|---|---|
| `400` | 심사 중인 신청만 취소할 수 있습니다. | 상태가 `PENDING`이 아님 |
| `404` | 대여 신청을 찾을 수 없습니다. | 존재하지 않거나 **타인의 신청** |

> 타인의 신청에 대해 `403`이 아닌 `404`를 반환합니다. 다른 사용자의 신청 ID 존재 여부가 노출되지 않도록 하기 위함입니다.

---

## 6. 전체 흐름 예시

```mermaid
sequenceDiagram
    autonumber
    participant S as 학생
    participant A as 조교
    participant API as Backend

    S->>API: POST /auth/login (2026001)
    API-->>S: access_token

    S->>API: GET /equipment?department_id=2
    API-->>S: 라즈베리 파이 4 (잔여 5)

    S->>API: POST /rentals
    API-->>S: 201 status=pending (잔여 4)

    A->>API: POST /auth/login (com)
    API-->>A: access_token (role=admin)

    A->>API: GET /rentals/all
    API-->>A: 학과 신청 목록

    A->>API: POST /rentals/10/approve
    API-->>A: 200 status=rented (잔여 4)

    Note over S,API: 사용 기간 종료

    A->>API: POST /rentals/10/return
    API-->>A: 200 status=returned (잔여 5)
```

---

## 관련 문서

- [Architecture.md](Architecture.md) — 인증 흐름, 동시성 제어
- [Database.md](Database.md) — 데이터 모델
- [Troubleshooting.md](Troubleshooting.md) — API 호출 실패 시 진단
