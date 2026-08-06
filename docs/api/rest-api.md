# REST API 명세서

Base URL: `http://<백엔드 담당자 Tailscale IP>:8000` (배포 없음 — 로컬 실행 기준. [setup.md](../development/setup.md) 참고)

버저닝 없음 (`/api/v1` 형태 사용하지 않음).

## 상태 코드 규칙

| 코드 | 의미 |
|---|---|
| 200 | 조회/처리 성공 |
| 201 | 생성 성공 (`POST /rentals`) |
| 400 | 잘못된 요청 (재고 없음, 잘못된 상태 전이 등) |
| 404 | 대상 리소스 없음 |

## 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 헬스체크 |
| GET | `/departments` | 학과 목록 |
| GET | `/equipment` | 기자재 목록 (쿼리: `department`) |
| POST | `/rentals` | 대여 신청 생성 |
| GET | `/rentals` | 대여 신청 목록 (쿼리: `status`) |
| PATCH | `/rentals/{id}/approve` | 승인 |
| PATCH | `/rentals/{id}/reject` | 반려 |
| PATCH | `/rentals/{id}/return` | 반납 처리 |

## 상세

### `GET /health`
응답: `{"status": "ok"}`

### `GET /departments`
응답: `string[]` — 학과명 목록

### `GET /equipment?department=`
`department` 생략 시 전체 조회.
응답: `Equipment[]`

### `POST /rentals`
요청 바디: `RentalCreate`
응답: `Rental` (201)
- 404: `equipment_id`에 해당하는 기자재 없음

### `GET /rentals?status=`
`status`는 `신청됨` / `대여중` / `반려됨` / `반납완료` 중 하나. 생략 시 전체 조회.
응답: `Rental[]`

### `PATCH /rentals/{id}/approve`
- 400: 신청 상태가 `신청됨`이 아님 / 재고 없음
- 성공 시 `available_quantity -1`, 상태 → `대여중`

### `PATCH /rentals/{id}/reject`
- 400: 신청 상태가 `신청됨`이 아님
- 성공 시 재고 변화 없음, 상태 → `반려됨`

### `PATCH /rentals/{id}/return`
- 400: 신청 상태가 `대여중`이 아님
- 성공 시 `available_quantity +1`, 상태 → `반납완료`

## 데이터 모델

### Equipment
| 필드 | 타입 |
|---|---|
| id | int |
| department | string |
| name | string |
| total_quantity | int |
| available_quantity | int |
| description | string \| null |

### RentalCreate (요청)
| 필드 | 타입 |
|---|---|
| equipment_id | int |
| student_name | string |
| student_number | string |
| contact | string |
| reason | string |

### Rental (응답)
| 필드 | 타입 |
|---|---|
| id | int |
| equipment_id | int |
| student_name | string |
| student_number | string |
| contact | string |
| reason | string |
| status | string |
| requested_at | datetime |
| processed_at | datetime \| null |

예시 요청/응답은 [examples.md](./examples.md) 참고.
