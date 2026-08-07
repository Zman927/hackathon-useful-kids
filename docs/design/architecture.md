# 시스템 아키텍처

## 전체 구조도

```
┌──────────────────────┐        REST API (HTTP, JWT Bearer)   ┌───────────────────────┐
│  Frontend (React)     │ ─────────────────────────────────▶  │  Backend (FastAPI)     │
│  Vite Dev Server       │ ◀───────────────────────────────── │  uvicorn                │
└──────────────────────┘                                     └───────────┬───────────┘
        │                                                                 │
        │  같은 Tailscale tailnet                                          │  SQLAlchemy (async)
        ▼                                                                 ▼
   팀원 각자의 로컬 브라우저                                           PostgreSQL (로컬 네이티브 설치)
```

- 프론트엔드와 백엔드는 각자 팀원의 로컬 컴퓨터에서 실행된다.
- 서로 다른 컴퓨터에서 실행 중인 프론트/백엔드는 **Tailscale**(사설 메시 네트워크)로 직접 통신한다. 같은 wifi가 아니어도 연결된다.
- **별도 배포는 하지 않는다.** 심사 제출물이 GitHub + 현장 시연이라 퍼블릭 호스팅이 불필요하다. 개발 중 쓰는 로컬 환경을 시연 당일에도 그대로 사용한다.
- **Docker를 쓰지 않는다.** PostgreSQL은 각자 컴퓨터에 네이티브로 설치해 로컬 서비스로 띄운다. 설치·연결 방법은 [development/setup.md](../development/setup.md) 참고.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 18 + Vite, react-router-dom, Axios |
| Backend | FastAPI, SQLAlchemy 2.x (async, `asyncpg`), Pydantic v2 |
| 인증 | JWT (`python-jose`) + bcrypt 해시 (`passlib`) — `Authorization: Bearer` 헤더 방식, 쿠키 안 씀 |
| DB | PostgreSQL (로컬 네이티브 설치) |
| 네트워크 | Tailscale (팀원 간, 시연 시에도 동일하게 사용) |
| API 스타일 | REST, 버저닝 없음 |

## 왜 이 스택을 쓰지 않았는가

의도적으로 제외한 것들 — 해커톤 규모와 기간에 비해 이득보다 비용이 큰 것들.

| 제외한 것 | 이유 |
|---|---|
| Docker / Docker Compose | 팀원이 3명뿐이고 실행 환경 차이가 크지 않아, 컨테이너화 비용보다 네이티브 설치가 더 빠르다 |
| Vercel / Railway 등 배포 | 심사위원이 원격 접속할 필요가 없다 (제출물: GitHub + 현장 시연) |
| API 버저닝 (v1, v2) | 단일 버전으로 끝나는 해커톤 프로젝트라 불필요한 추상화 |
| CI/CD | 배포 대상이 없어 파이프라인을 돌릴 이유가 없다 |
| DB 마이그레이션 도구 (Alembic) | 앱 시작 시 `Base.metadata.create_all()`로 스키마를 생성하는 것으로 충분한 규모. 스키마 변경 시 로컬 DB는 수동 `ALTER` |

인증/로그인은 초기 기획 단계에서는 MVP 범위 밖(검토 중)이었으나, 실제 개발 과정에서 학과별 권한 분리(조교는 본인 학과 기자재만 관리)가 필요해져 채택되었다.

## 계층 구조 (Backend) — 실제 구현

```
요청 → api/(Router: 요청 검증 + 인증/권한 확인 + DB 접근 + 응답 조립까지 전부 처리)
```

**기획 초기에는 `services/`에 비즈니스 로직을 분리할 계획이었지만, 실제로는 라우터(`app/api/*.py`)가 검증부터 DB 쿼리, 재고 계산까지 전부 직접 처리한다.** `app/services/`는 빈 패키지로 남아 있다 — 해커톤 규모에서 계층을 나눌 실익이 크지 않았기 때문. 규모가 커지면 분리를 고려할 지점.

```
backend/app/
├── main.py            FastAPI 앱, CORS, 라우터 등록, 시작 시 테이블 생성 + 시드
├── deps.py             인증/권한 의존성 (get_current_user, require_assistant)
├── init_db.py           초기 시드 데이터
├── core/
│   ├── config.py        환경변수 설정 (.env)
│   ├── database.py       비동기 SQLAlchemy 엔진/세션
│   ├── security.py       JWT 발급/검증, 비밀번호 해시
│   └── storage.py        기자재 이미지 업로드 저장/삭제
├── api/                  라우터 — 검증 + 인증 + DB 접근 + 응답 조립
│   ├── auth.py
│   ├── departments.py
│   ├── equipment.py
│   └── rentals.py
├── models/               SQLAlchemy ORM 모델 + 학과 마스터 데이터
├── schemas/              Pydantic 요청/응답 스키마
├── services/             (미사용, 빈 패키지)
└── utils/                (미사용, 빈 패키지)
```

## 데이터 흐름 (요청 1건 기준)

1. 사용자가 로그인 → `POST /auth/login` 호출, JWT 발급받아 프론트가 보관 (이후 모든 요청에 `Authorization: Bearer` 헤더로 실어 보냄)
2. 기자재 목록 조회 → `GET /equipment?department_id=` 호출 (비로그인도 가능)
3. 대여 신청 폼 제출 → `POST /rentals` 호출. **이 시점에 재고(`available_quantity`)가 즉시 차감되고** `PENDING` 상태로 저장 (동시 신청에 의한 재고 초과를 막기 위해 기자재 행에 `SELECT ... FOR UPDATE` 잠금을 건다)
4. 조교가 대시보드에서 승인 → `POST /rentals/{id}/approve` 호출, 상태만 `APPROVED`로 변경 (재고는 이미 3단계에서 차감돼 있어 추가 변화 없음)
5. 조교가 반납 처리 → `POST /rentals/{id}/return` 호출, 재고 복구 + 상태 `RETURNED`로 변경

거부·취소 시에도 재고가 즉시 복구된다 (`POST /rentals/{id}/reject`, `POST /rentals/{id}/cancel`).

상세 시퀀스는 [sequence.md](./sequence.md) 참고.

## 실행 환경

로컬 실행 방법은 [development/setup.md](../development/setup.md) 참고.
