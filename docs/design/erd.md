# ERD 및 테이블 정의서

## 현재 확정 스키마

```
┌─────────────────────────────────┐
│            equipment             │
├─────────────────────────────────┤
│ PK  id                : SERIAL  │
│     department        : VARCHAR │
│     name              : VARCHAR │
│     total_quantity    : INTEGER │
│     available_quantity: INTEGER │
│     description       : TEXT    │
└──────────────┬──────────────────┘
               │ (1)
               │ 기자재 1개는 여러 대여 신청과 연결
               ▼ (N)
┌─────────────────────────────────┐
│             rental               │
├─────────────────────────────────┤
│ PK  id             : SERIAL     │
│ FK  equipment_id    : INTEGER   │
│     student_name    : VARCHAR   │
│     student_number  : VARCHAR   │
│     contact          : VARCHAR  │
│     reason           : TEXT     │
│     status            : VARCHAR │
│     requested_at      : TIMESTAMP │
│     processed_at      : TIMESTAMP (nullable) │
└─────────────────────────────────┘
```

### `equipment`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | SERIAL | PK | 고유 식별자 |
| `department` | VARCHAR | NOT NULL | 관리 학과명 |
| `name` | VARCHAR | NOT NULL | 기자재명 |
| `total_quantity` | INTEGER | NOT NULL | 전체 보유 수량 |
| `available_quantity` | INTEGER | NOT NULL | 현재 대여 가능 수량 |
| `description` | TEXT | NULLABLE | 상세 설명 |

### `rental`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | SERIAL | PK | 대여 신청 번호 |
| `equipment_id` | INTEGER | FK → equipment.id | 대상 기자재 |
| `student_name` | VARCHAR | NOT NULL | 신청자 이름 |
| `student_number` | VARCHAR | NOT NULL | 학번 |
| `contact` | VARCHAR | NOT NULL | 연락처 |
| `reason` | TEXT | NOT NULL | 대여 사유 |
| `status` | VARCHAR | NOT NULL, DEFAULT `'신청됨'` | `신청됨` / `대여중` / `반려됨` / `반납완료` |
| `requested_at` | TIMESTAMP | DEFAULT now() | 신청 일시 |
| `processed_at` | TIMESTAMP | NULLABLE | 승인/반려/반납 처리 일시 |

로그인 없이 신청자 정보를 폼에서 직접 받는 구조 (인증 미포함, MVP 범위).

---

## 검토 중인 확장안 (박범근 제안, 미확정)

아래는 아직 팀 결정이 안 난 제안. 채택 시 스키마와 API 계약이 바뀌므로 **PM 승인 후 이 문서와 [rest-api.md](../api/rest-api.md)를 함께 갱신할 것.**

- **`users` 테이블 추가** — 학번/비밀번호 기반 로그인, `role`(STUDENT/ASSISTANT) 구분. 현재는 인증 없이 폼 입력으로 대체 중이라, 채택 시 인증 플로우 전체를 새로 구현해야 함
- **대여 기간 필드** (`start_date`, `end_date`) — 현재 스키마엔 대여 기간 개념이 없음. 채택 시 기간 중복 검증 로직 필요
- **타 학과 대여 서약** (`is_cross_department`, `pledge_agreed`) — 실제 기자재실 운영 정책을 반영한 것으로 보임. 로그인 없이도 폼 필드로 추가 가능해 비용이 낮음

**PM 판단(잠정):** 로그인은 시간 대비 비용이 커서 보류, 대여 기간·타 학과 서약 필드는 폼에 추가하는 정도라 채택 검토 중.
