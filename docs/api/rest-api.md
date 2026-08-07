# REST API 명세서

Base URL: `http://<백엔드 담당자 Tailscale IP>:8000` (배포 없음 — 로컬 실행 기준. [setup.md](../development/setup.md) 참고)

버저닝 없음 (`/api/v1` 형태 사용하지 않음). 인터랙티브 문서는 서버 실행 중 `/docs`(Swagger UI)에서 항상 최신 상태로 확인 가능.

## 인증

로그인 후 발급되는 JWT를 `Authorization: Bearer <token>` 헤더로 실어 보낸다. `/health`, `/auth/login`, `/departments`, `GET /equipment*`를 제외한 모든 엔드포인트는 인증이 필요하다.

| 역할 | 값 |
|---|---|
| 학생 | `role: "student"` (DB에는 `STUDENT`) |
| 조교 | `role: "admin"` (DB에는 `ASSISTANT`) |

## 상태 코드 규칙

| 코드 | 의미 |
|---|---|
| 200 | 조회/처리 성공 |
| 201 | 생성 성공 (`POST /equipment`, `POST /rentals`) |
| 204 | 성공, 응답 바디 없음 (`POST /rentals/{id}/cancel`) |
| 400 | 잘못된 요청 (재고 없음, 이미 처리된 신청 등) |
| 401 | 인증 실패 (토큰 없음/만료/학번·비밀번호 불일치) |
| 403 | 권한 없음 (역할 불일치, 타 학과 리소스 접근) |
| 404 | 대상 리소스 없음 |

## 엔드포인트 목록

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/health` | - | 헬스체크 |
| POST | `/auth/login` | - | 로그인, JWT 발급 |
| GET | `/auth/me` | 로그인 | 내 정보 조회 |
| GET | `/departments` | - | 단과대학별 학과 목록 |
| GET | `/equipment` | - | 기자재 목록 (쿼리: `department_id`) |
| GET | `/equipment/{id}` | - | 기자재 단건 조회 |
| POST | `/equipment` | 조교 | 기자재 등록 (본인 학과만) |
| PATCH | `/equipment/{id}` | 조교 | 기자재 수정 (본인 학과만) |
| POST | `/rentals` | 로그인 | 대여 신청 생성 |
| GET | `/rentals` | 로그인 | 내 대여 신청 목록 |
| GET | `/rentals/all` | 조교 | 본인 학과 전체 대여 신청 목록 |
| POST | `/rentals/{id}/approve` | 조교 | 승인 (본인 학과만) |
| POST | `/rentals/{id}/reject` | 조교 | 반려 (본인 학과만) |
| POST | `/rentals/{id}/return` | 조교 | 반납 처리 (본인 학과만) |
| POST | `/rentals/{id}/cancel` | 로그인 | 취소 (본인 신청만) |

`GET /rentals`, `POST /rentals`, `POST /rentals/{id}/cancel`은 학생·조교 구분 없이 로그인만 하면 누구나 쓸 수 있다 (조교도 자기 명의로 기자재를 빌릴 수 있어야 하므로).

## 상세

### `GET /health`
응답: `{"status": "ok"}`

### `POST /auth/login`
요청 바디:
```json
{ "student_id": "2026001", "password": "pwd123" }
```
응답 (200): `LoginResponse` — 아래 "데이터 모델" 참고
- 401: 학번 또는 비밀번호 불일치

### `GET /auth/me`
헤더: `Authorization: Bearer <token>`
응답 (200): `UserOut`

### `GET /departments`
응답: 단과대학별로 묶인 학과 배열 (아래 "데이터 모델" 참고)

### `GET /equipment?department_id=`
`department_id` 생략 시 전체 조회. `department_id`는 `GET /departments` 응답의 각 학과 `id` 값.
응답: `EquipmentOut[]`
- 400: 존재하지 않는 `department_id`

### `GET /equipment/{id}`
응답: `EquipmentOut`
- 404: 없는 기자재

### `POST /equipment` (조교 전용, `multipart/form-data`)
필드: `name`(필수), `department_id`(필수), `total_quantity`(필수, 1 이상), `category`, `description`, `image`(파일, jpg/png/webp/gif, 5MB 이하)
응답 (201): `EquipmentOut`
- 400: 존재하지 않는 `department_id`, 이미지 형식/용량 오류
- 403: 본인 학과가 아닌 `department_id`로 등록 시도

### `PATCH /equipment/{id}` (조교 전용, `multipart/form-data`)
필드: 전부 선택 — `name`, `total_quantity`, `category`, `description`, `image`. `total_quantity`를 바꾸면 현재 대여중 수량을 고려해 `available_quantity`도 같이 조정된다.
응답 (200): `EquipmentOut`
- 403: 본인 학과 기자재가 아님
- 404: 없는 기자재

### `POST /rentals`
요청 바디: `RentalCreateIn`
응답 (201): `RentalOut` — 생성 시점에 `available_quantity`가 즉시 차감된다 (승인 시점 아님)
- 400: 신청 수량이 대여 가능 수량보다 많음
- 404: `equipment_id`에 해당하는 기자재 없음

### `GET /rentals`
로그인한 사용자 본인의 신청 목록만 반환 (역할 무관).
응답: `RentalOut[]`

### `GET /rentals/all` (조교 전용)
본인 학과 기자재에 대한 전체 신청 목록.
응답: `RentalOut[]`

### `POST /rentals/{id}/approve` (조교 전용)
- 400: 신청 상태가 `PENDING`이 아님
- 403: 본인 학과 기자재에 대한 신청이 아님
- 성공 시 상태 → `APPROVED`, `processed_at` 기록 (재고는 신청 시점에 이미 차감돼 있어 변화 없음)

### `POST /rentals/{id}/reject` (조교 전용)
- 400: 신청 상태가 `PENDING`이 아님
- 성공 시 `available_quantity` 복구, 상태 → `REJECTED`, `processed_at` 기록

### `POST /rentals/{id}/return` (조교 전용)
- 400: 신청 상태가 `APPROVED`가 아님
- 성공 시 `available_quantity` 복구, 상태 → `RETURNED`, `processed_at` 기록

### `POST /rentals/{id}/cancel`
본인이 신청한 건만 취소 가능 (역할 무관).
- 400: 신청 상태가 `PENDING`이 아님 (이미 승인/반려/반납된 건은 취소 불가)
- 404: 본인 신청 중에 없음
- 성공 시 (204) `available_quantity` 복구 후 신청 레코드 삭제

## 데이터 모델

### LoginResponse
| 필드 | 타입 |
|---|---|
| access_token | string |
| user_id | string (student_id) |
| user_name | string |
| role | `"admin"` \| `"student"` |

### UserOut
| 필드 | 타입 |
|---|---|
| id | int |
| student_id | string |
| name | string |
| department | string (학과명) |
| role | `"admin"` \| `"student"` |
| created_at | datetime |

### Department (`GET /departments` 응답 원소)
| 필드 | 타입 |
|---|---|
| college | string (단과대학명) |
| departments | `{ id: int, name: string }[]` |

### EquipmentOut
| 필드 | 타입 |
|---|---|
| id | int |
| name | string |
| image_url | string \| null (절대 URL) |
| category | string \| null |
| description | string \| null |
| department_id | int |
| is_available | boolean (`remaining_quantity > 0`) |
| remaining_quantity | int |
| total_quantity | int |
| created_at | datetime |

### RentalCreateIn (요청)
| 필드 | 타입 | 필수 |
|---|---|---|
| equipment_id | int | ✓ |
| start_date | date | ✓ |
| end_date | date (≥ start_date) | ✓ |
| quantity | int (기본값 1, 1 이상) | |
| purpose | string \| null | |

### RentalOut (응답)
| 필드 | 타입 |
|---|---|
| id | int |
| student_name | string |
| student_id | string |
| student_department | string |
| equipment_id | int |
| equipment_name | string |
| equipment_image_url | string \| null |
| equipment_category | string \| null |
| department_name | string (기자재 소속 학과) |
| start_date | date |
| end_date | date |
| quantity | int |
| purpose | string \| null |
| status | `"pending"` \| `"rented"` \| `"rejected"` \| `"returned"` |
| is_cross_department | boolean |
| created_at | datetime |
| processed_at | datetime \| null |

예시 요청/응답은 [examples.md](./examples.md) 참고.
