# API 요청/응답 예시

실제 로컬 DB에서 동작을 확인한 예시. 필드/에러 메시지는 코드(`backend/app/api/`, `backend/app/schemas/`) 기준.

## POST /auth/login

```http
POST /auth/login
Content-Type: application/json

{ "student_id": "2026001", "password": "pwd123" }
```

응답 (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "2026001",
  "user_name": "컴퓨터공학과 학생",
  "role": "student"
}
```

실패 (401 — 학번/비밀번호 불일치):
```json
{ "detail": "학번 또는 비밀번호가 올바르지 않습니다." }
```

이후 모든 요청에 `Authorization: Bearer <access_token>` 헤더를 붙인다.

## GET /auth/me

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

응답 (200):
```json
{
  "id": 2,
  "student_id": "2026001",
  "name": "컴퓨터공학과 학생",
  "department": "컴퓨터공학과",
  "role": "student",
  "created_at": "2026-08-06T17:27:17.121995Z"
}
```

## GET /departments

```http
GET /departments
```

응답 (200, 일부 발췌 — 실제로는 5개 단과대학, 32개 학과 전부 내려옴):
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
  }
]
```

## GET /equipment?department_id=4

```http
GET /equipment?department_id=4
```

응답 (200):
```json
[
  {
    "id": 4,
    "name": "디지털 오실로스코프",
    "image_url": "http://100.74.207.33:8000/static/uploads/equipments/2a915530d9534f38b88ede0c6aed60f8.jpg",
    "category": "측정장비",
    "description": "회로 실험용 오실로스코프",
    "department_id": 4,
    "is_available": true,
    "remaining_quantity": 2,
    "total_quantity": 2,
    "created_at": "2026-08-06T17:27:17.121995Z"
  },
  {
    "id": 13,
    "name": "디지털 멀티미터",
    "image_url": "http://100.74.207.33:8000/static/uploads/equipments/a65bfc43655d4774ab4ddc0c5f68f81b.jpg",
    "category": "측정장비",
    "description": "전압/전류/저항 측정용 디지털 멀티미터",
    "department_id": 4,
    "is_available": true,
    "remaining_quantity": 6,
    "total_quantity": 6,
    "created_at": "2026-08-07T00:43:57.606829Z"
  }
]
```

`image_url`은 요청이 들어온 host를 기준으로 조립되므로, `localhost`로 호출하면 `http://localhost:8000/...`, Tailscale IP로 호출하면 `http://100.x.y.z:8000/...`으로 그대로 나온다.

## POST /equipment (조교 전용, multipart/form-data)

```http
POST /equipment
Authorization: Bearer <조교 토큰>
Content-Type: multipart/form-data

name=3D 프린터
department_id=2
total_quantity=2
category=제작장비
description=시제품 제작용 FDM 3D 프린터
image=<파일>
```

응답 (201): `EquipmentOut` (위 형식과 동일)

실패 (403 — 본인 학과가 아닌 곳에 등록 시도):
```json
{ "detail": "본인 학과의 기자재만 등록할 수 있습니다." }
```

## POST /rentals

```http
POST /rentals
Authorization: Bearer <학생 또는 조교 토큰>
Content-Type: application/json

{
  "equipment_id": 4,
  "start_date": "2026-08-10",
  "end_date": "2026-08-12",
  "quantity": 1,
  "purpose": "캡스톤 프로젝트"
}
```

응답 (201):
```json
{
  "id": 30,
  "student_name": "컴퓨터공학과 학생",
  "student_id": "2026001",
  "student_department": "컴퓨터공학과",
  "equipment_id": 4,
  "equipment_name": "디지털 오실로스코프",
  "equipment_image_url": "http://100.74.207.33:8000/static/uploads/equipments/2a915530d9534f38b88ede0c6aed60f8.jpg",
  "equipment_category": "측정장비",
  "department_name": "전자공학과",
  "start_date": "2026-08-10",
  "end_date": "2026-08-12",
  "quantity": 1,
  "purpose": "캡스톤 프로젝트",
  "status": "pending",
  "is_cross_department": true,
  "created_at": "2026-08-07T01:20:49.064816Z",
  "processed_at": null
}
```

`student_department`(전자공학과가 아님)와 `department_name`(전자공학과)이 다르면 타 학과 기자재를 빌린 것이고, 이때 `is_cross_department: true`가 된다.

실패 (400 — 재고 없음):
```json
{ "detail": "대여 가능한 수량이 없습니다." }
```

실패 (404 — 존재하지 않는 기자재):
```json
{ "detail": "기자재를 찾을 수 없습니다." }
```

## POST /rentals/30/approve (조교 전용)

```http
POST /rentals/30/approve
Authorization: Bearer <해당 학과 조교 토큰>
```

응답 (200): 위 `RentalOut`에서 `"status": "rented"`, `"processed_at": "2026-08-07T01:21:03.000Z"`로 바뀐 형태.

실패 (400 — 이미 처리된 신청):
```json
{ "detail": "이미 처리된 대여 신청입니다." }
```

실패 (403 — 다른 학과 조교가 처리 시도):
```json
{ "detail": "본인 학과 기자재에 대한 대여 신청만 처리할 수 있습니다." }
```

## POST /rentals/30/return (조교 전용)

```http
POST /rentals/30/return
Authorization: Bearer <해당 학과 조교 토큰>
```

응답 (200): `"status": "returned"`로 바뀌고 `available_quantity`가 신청 수량만큼 복구됨.

실패 (400 — 대여중 상태가 아님):
```json
{ "detail": "대여중인 신청만 반납 처리할 수 있습니다." }
```

## POST /rentals/30/cancel (본인 신청만)

```http
POST /rentals/30/cancel
Authorization: Bearer <신청한 본인 토큰>
```

응답: 204 No Content — `PENDING` 상태일 때만 가능하며, 성공 시 재고 복구 후 레코드가 삭제된다.

실패 (400 — 이미 심사된 신청):
```json
{ "detail": "심사 중인 신청만 취소할 수 있습니다." }
```

## 공통 인증 에러

토큰 없이/만료된 토큰으로 인증 필요한 엔드포인트 호출 시 (401):
```json
{ "detail": "인증 정보가 유효하지 않습니다." }
```

학생 토큰으로 조교 전용 엔드포인트 호출 시 (403):
```json
{ "detail": "이 작업을 수행할 권한이 없습니다." }
```
