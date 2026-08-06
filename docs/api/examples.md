# API 요청/응답 예시

## GET /departments

```http
GET /departments
```

```json
["전자공학과", "기계공학과", "컴퓨터공학과"]
```

## GET /equipment?department=전자공학과

```http
GET /equipment?department=전자공학과
```

```json
[
  {
    "id": 1,
    "department": "전자공학과",
    "name": "오실로스코프",
    "total_quantity": 3,
    "available_quantity": 2,
    "description": "2채널, 최대 100MHz"
  }
]
```

## POST /rentals

```http
POST /rentals
Content-Type: application/json

{
  "equipment_id": 1,
  "student_name": "홍길동",
  "student_number": "20231234",
  "contact": "010-0000-0000",
  "reason": "캡스톤 프로젝트"
}
```

응답 (201):

```json
{
  "id": 10,
  "equipment_id": 1,
  "student_name": "홍길동",
  "student_number": "20231234",
  "contact": "010-0000-0000",
  "reason": "캡스톤 프로젝트",
  "status": "신청됨",
  "requested_at": "2026-08-06T10:00:00Z",
  "processed_at": null
}
```

실패 (404 — 존재하지 않는 기자재):

```json
{ "detail": "기자재를 찾을 수 없습니다" }
```

## PATCH /rentals/10/approve

```http
PATCH /rentals/10/approve
```

응답 (200):

```json
{
  "id": 10,
  "equipment_id": 1,
  "student_name": "홍길동",
  "student_number": "20231234",
  "contact": "010-0000-0000",
  "reason": "캡스톤 프로젝트",
  "status": "대여중",
  "requested_at": "2026-08-06T10:00:00Z",
  "processed_at": "2026-08-06T10:05:00Z"
}
```

실패 (400 — 재고 없음):

```json
{ "detail": "대여 가능한 재고가 없습니다" }
```

## PATCH /rentals/10/return

응답 (200):

```json
{
  "id": 10,
  "equipment_id": 1,
  "student_name": "홍길동",
  "student_number": "20231234",
  "contact": "010-0000-0000",
  "reason": "캡스톤 프로젝트",
  "status": "반납완료",
  "requested_at": "2026-08-06T10:00:00Z",
  "processed_at": "2026-08-06T15:00:00Z"
}
```
