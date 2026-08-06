# 유용한 아이들 — MJC 기자재 대여 플랫폼

2026학년도 AI 해커톤 경진대회 제출 저장소.

## 프로젝트 소개

공학관 기자재 대여를 디지털화하는 플랫폼. 학생은 학과별 기자재 재고를 실시간으로 조회하고 대여를 신청하며, 조교는 대시보드에서 신청을 승인·반려하고 반납을 처리한다.

## 문제 정의

공학관 기자재 대여는 지금 이렇게 이루어진다.

- 학생은 어떤 기자재가 있는지, 지금 빌릴 수 있는지 알 방법이 없어 학과 사무실을 직접 찾아가 물어봐야 한다.
- 대여 기록은 수기 장부로 남고, 조교는 별도 파일(엑셀 등)로 다시 정리해 이중 관리한다.

이 프로젝트는 조회·신청·승인·반납을 한 곳에서 처리해 이 과정을 대체한다.

## 핵심 기능

| 기능 | 사용자 |
|---|---|
| 학과별 기자재 재고 조회 | 학생 |
| 대여 신청 | 학생 |
| 신청 승인 / 반려 | 조교 |
| 반납 처리 (재고 자동 갱신) | 조교 |

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 18, Vite, react-router-dom, Axios |
| Backend | FastAPI, SQLAlchemy 2.x, Pydantic v2 |
| DB | PostgreSQL (로컬 네이티브 설치) |
| 네트워크 | Tailscale (팀원 간, 시연 시에도 동일하게 사용) |

배포하지 않는다 — 제출물이 GitHub + 현장 시연이라 퍼블릭 호스팅이 불필요하다. Docker도 쓰지 않는다. 왜 이 구성인지는 [architecture.md](./docs/design/architecture.md)에 설명되어 있다.

## 시스템 아키텍처

```
Frontend (React, Vite) ──REST API──▶ Backend (FastAPI)
        ▲                                   │
        └──────── Tailscale ────────────────┘
                                             ▼
                                   PostgreSQL (로컬)
```

프론트와 백엔드는 각자 팀원의 로컬 컴퓨터에서 실행되고, Tailscale로 서로 연결된다. 상세 구조는 [docs/design/architecture.md](./docs/design/architecture.md) 참고.

## 프로젝트 구조

```
.
├── README.md
├── 협업가이드.md              팀 역할·개발 순서·동기화 체크포인트
│
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/               API 클라이언트 (Axios)
│       ├── assets/
│       ├── components/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/             화면 단위 컴포넌트
│       ├── router/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
│
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py            FastAPI 앱, CORS, 라우터 등록
│       ├── core/               설정, DB 연결
│       ├── api/                 라우터 (요청/응답/검증만)
│       ├── models/              SQLAlchemy 모델
│       ├── schemas/             Pydantic 스키마
│       ├── services/            비즈니스 로직
│       └── utils/
│
└── docs/
    ├── product/
    │   ├── prd.md              문제 정의, 목표
    │   └── requirements.md     기능 명세, MVP 범위
    ├── design/
    │   ├── architecture.md     아키텍처, 스택 선택 이유
    │   ├── erd.md               데이터 모델
    │   └── sequence.md          주요 플로우 시퀀스
    ├── api/
    │   ├── rest-api.md          API 명세
    │   └── examples.md          요청/응답 예시
    ├── development/
    │   ├── setup.md             실행 방법, 환경 설정
    │   ├── convention.md        커밋 컨벤션
    │   └── branch-strategy.md   브랜치 전략
    └── plans/                   구현 계획 (TDD 태스크 단위)
```

## 실행 방법

```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env    # 값 채우기
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
copy .env.example .env    # 값 채우기
npm run dev
```

PostgreSQL 설치, Tailscale 연결, 문제 해결까지 포함한 전체 가이드는 [docs/development/setup.md](./docs/development/setup.md) 참고.

## 문서

| 문서 | 내용 |
|---|---|
| [PRD](./docs/product/prd.md) | 문제 정의, 목표 |
| [요구사항 정의서](./docs/product/requirements.md) | 기능 명세, MVP 범위 |
| [아키텍처](./docs/design/architecture.md) | 시스템 구조, 스택 선택 이유 |
| [ERD](./docs/design/erd.md) | 데이터 모델 |
| [시퀀스](./docs/design/sequence.md) | 주요 플로우 |
| [REST API](./docs/api/rest-api.md) | API 명세 |
| [API 예시](./docs/api/examples.md) | 요청/응답 예시 |
| [개발 환경 설정](./docs/development/setup.md) | 실행 방법, Tailscale, Troubleshooting |
| [커밋 컨벤션](./docs/development/convention.md) | 커밋 메시지 규칙 |
| [브랜치 전략](./docs/development/branch-strategy.md) | 브랜치 운영 방식 |
| [구현 계획](./docs/plans/) | TDD 태스크 단위 개발 순서 (개발용 상세) |
| [협업가이드](./협업가이드.md) | 팀 역할, 개발 순서, 동기화 체크포인트 |

## 팀

| 이름 | 역할 |
|---|---|
| Jorden | PM · 기획 · 문서 |
| 박범근 | Backend |
| 허정주 | Frontend |
