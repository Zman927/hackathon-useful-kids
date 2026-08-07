# 시퀀스 다이어그램

모든 요청(로그인 제외)은 `Authorization: Bearer <JWT>` 헤더를 포함한다. 아래 다이어그램에서는 표기를 생략했다.

## 0. 로그인

```
User             Frontend            Backend             DB
  │                  │                  │                 │
  │  학번/비밀번호 입력 │                  │                 │
  ├─────────────────▶│                  │                 │
  │                  │ POST /auth/login │                 │
  │                  ├─────────────────▶│                 │
  │                  │                  │ SELECT users     │
  │                  │                  │ WHERE student_id │
  │                  │                  ├────────────────▶│
  │                  │                  │◀────────────────┤
  │                  │                  │ bcrypt.verify    │
  │                  │                  │ JWT 발급          │
  │                  │◀─────────────────┤ {access_token,  │
  │◀─────────────────┤ 토큰 저장          │  role, ...}      │
```

## 1. 대여 신청 (학생 또는 조교, 본인 명의)

```
User             Frontend            Backend             DB
  │                  │                  │                 │
  │  기자재 선택       │                  │                 │
  ├─────────────────▶│                  │                 │
  │                  │ GET /equipment?department_id=       │
  │                  ├─────────────────▶│                 │
  │                  │                  │ SELECT equipments│
  │                  │                  ├────────────────▶│
  │                  │                  │◀────────────────┤
  │                  │◀─────────────────┤                 │
  │  신청 폼 제출      │                  │                 │
  │  (기간/수량/사유)   │                  │                 │
  ├─────────────────▶│                  │                 │
  │                  │ POST /rentals    │                 │
  │                  ├─────────────────▶│                 │
  │                  │                  │ SELECT equipment │
  │                  │                  │ FOR UPDATE (잠금) │
  │                  │                  ├────────────────▶│
  │                  │                  │ 재고 충분한지 확인  │
  │                  │                  │ available_quantity│
  │                  │                  │ -= quantity      │
  │                  │                  │ INSERT rental    │
  │                  │                  │ (status=PENDING) │
  │                  │                  ├────────────────▶│
  │                  │◀─────────────────┤                 │
  │◀─────────────────┤ 신청 완료 표시     │                 │
```

재고 부족(400) 또는 존재하지 않는 기자재(404)면 이 시점에 실패한다.

## 2. 승인 처리 (조교, 본인 학과만)

```
Assistant        Frontend            Backend             DB
  │                  │                  │                 │
  │  대시보드 진입     │                  │                 │
  ├─────────────────▶│                  │                 │
  │                  │ GET /rentals/all │                 │
  │                  ├─────────────────▶│                 │
  │                  │                  │ SELECT rentals   │
  │                  │                  │ JOIN equipments  │
  │                  │                  │ WHERE department │
  │                  │                  │ = 조교 학과        │
  │                  │                  ├────────────────▶│
  │                  │◀─────────────────┤                 │
  │  승인 클릭         │                  │                 │
  ├─────────────────▶│                  │                 │
  │                  │ POST /rentals/{id}/approve          │
  │                  ├─────────────────▶│                 │
  │                  │                  │ 본인 학과 기자재인지│
  │                  │                  │ status=PENDING인지│
  │                  │                  │ 확인              │
  │                  │                  │ status=APPROVED, │
  │                  │                  │ processed_at 기록 │
  │                  │                  ├────────────────▶│
  │                  │◀─────────────────┤                 │
  │◀─────────────────┤ 목록 갱신          │                 │
```

재고는 신청 생성 시점에 이미 차감됐으므로 승인 단계에서는 재고를 다시 건드리지 않는다.

## 3. 반납 처리 (조교, 본인 학과만)

```
Assistant        Frontend            Backend             DB
  │  반납 클릭         │                  │                 │
  ├─────────────────▶│                  │                 │
  │                  │ POST /rentals/{id}/return            │
  │                  ├─────────────────▶│                 │
  │                  │                  │ status=APPROVED  │
  │                  │                  │ 인지 확인          │
  │                  │                  │ available_quantity│
  │                  │                  │ += quantity      │
  │                  │                  │ status=RETURNED, │
  │                  │                  │ processed_at 기록 │
  │                  │                  ├────────────────▶│
  │                  │◀─────────────────┤                 │
  │◀─────────────────┤ 목록 갱신          │                 │
```

## 4. 반려 / 취소 (재고 즉시 복구)

`POST /rentals/{id}/reject`(조교, 본인 학과)와 `POST /rentals/{id}/cancel`(신청 본인)은 흐름이 같다 — 대상이 `PENDING` 상태인지 확인 후 `available_quantity`를 복구한다. 취소는 레코드를 아예 삭제하고, 반려는 상태만 `REJECTED`로 남긴다.
