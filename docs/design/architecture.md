# 시스템 아키텍처

## 전체 구조도

```
┌──────────────────────┐        REST API (HTTP)        ┌───────────────────────┐
│  Frontend (React)     │ ─────────────────────────────▶ │  Backend (FastAPI)     │
│  Vite Dev Server       │ ◀───────────────────────────── │  uvicorn --reload      │
└──────────────────────┘                                └───────────┬───────────┘
        │                                                             │
        │  같은 Tailscale tailnet                                      │  SQLAlchemy
        ▼                                                             ▼
   팀원 각자의 로컬 브라우저                                      PostgreSQL (로컬 네이티브 설치)
```

- 프론트엔드와 백엔드는 각자 팀원의 로컬 컴퓨터에서 실행된다.
- 서로 다른 컴퓨터에서 실행 중인 프론트/백엔드는 **Tailscale**(사설 메시 네트워크)로 직접 통신한다. 같은 wifi가 아니어도 연결된다.
- **별도 배포는 하지 않는다.** 심사 제출물이 GitHub + 현장 시연이라 퍼블릭 호스팅이 불필요하다. 개발 중 쓰는 로컬 환경을 시연 당일에도 그대로 사용한다.
- **Docker를 쓰지 않는다.** PostgreSQL은 각자 컴퓨터에 네이티브로 설치해 로컬 서비스로 띄운다. 설치·연결 방법은 [development/setup.md](../development/setup.md) 참고.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 18 + Vite, react-router-dom, Axios |
| Backend | FastAPI, SQLAlchemy 2.x, Pydantic v2 |
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
| 인증/로그인 | MVP 범위에서 제외 (검토 중 — [erd.md](./erd.md) 참고) |

## 계층 구조 (Backend)

Router는 요청/응답/검증만 담당하고, 비즈니스 로직은 `services/`에 둔다.

```
요청 → api/(Router: 검증만) → services/(비즈니스 로직) → models/(DB 접근) → 응답
```

## 데이터 흐름 (요청 1건 기준)

1. 학생이 프론트엔드에서 기자재 목록 조회 → `GET /equipment?department=` 호출
2. 학생이 대여 신청 폼 제출 → `POST /rentals` 호출, DB에 `신청됨` 상태로 저장
3. 조교가 대시보드에서 승인 → `PATCH /rentals/{id}/approve` 호출, 재고 차감 + 상태 `대여중`으로 변경
4. 조교가 반납 처리 → `PATCH /rentals/{id}/return` 호출, 재고 복구 + 상태 `반납완료`로 변경

상세 시퀀스는 [sequence.md](./sequence.md) 참고.

## 실행 환경

로컬 실행 방법은 [development/setup.md](../development/setup.md) 참고.
