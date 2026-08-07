<div align="center">

# MJC 기자재 대여 플랫폼

**수기 장부로 운영되던 공학관 학과별 기자재 대여를, 학생과 조교 모두를 위한 웹 서비스로 전환합니다.**

2026학년도 교내 AI 해커톤 경진대회 · 팀 **유용한 아이들**

<br>

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

</div>

---

## 목차

| | |
|---|---|
| [1. 프로젝트 소개](#1-프로젝트-소개) | [9. 프로젝트 구조](#9-프로젝트-구조) |
| [2. 프로젝트 배경](#2-프로젝트-배경) | [10. 설치 방법](#10-설치-방법) |
| [3. 해결하려는 문제](#3-해결하려는-문제) | [11. 실행 방법](#11-실행-방법) |
| [4. 프로젝트 목표](#4-프로젝트-목표) | [12. 문서](#12-문서) |
| [5. 핵심 기능](#5-핵심-기능) | [13. 팀 소개](#13-팀-소개) |
| [6. AI 활용 전략](#6-ai-활용-전략) | [14. 프로젝트 일정](#14-프로젝트-일정) |
| [7. 기술 스택](#7-기술-스택) | [15. 향후 발전 방향](#15-향후-발전-방향) |
| [8. 시스템 아키텍처](#8-시스템-아키텍처) | [16. License](#16-license) |

---

## 1. 프로젝트 소개

MJC 기자재 대여 플랫폼은 **공학관 학과별 기자재의 조회·신청·승인·반납 전 과정을 하나의 웹 서비스로 통합한 대여 관리 시스템**입니다.

학생은 어느 학과에 무슨 장비가 몇 개 남아 있는지 실시간으로 확인하고 그 자리에서 대여를 신청합니다. 조교는 본인 학과로 들어온 신청을 대시보드에서 승인·반려하고, 반납 처리까지 한 화면에서 끝냅니다. 재고 수량은 신청·반려·반납 시점에 자동으로 조정되므로, 별도의 장부 정리가 필요 없습니다.

## 2. 프로젝트 배경

교내 공학관에는 **32개 학과가 각자 기자재를 보유·관리**하고 있습니다. 오실로스코프, VR 헤드셋, 무선 패킷 분석 랜카드처럼 수업과 프로젝트에 필수적인 장비들이지만, 이를 빌리는 절차는 다음과 같이 이루어집니다.

1. 학생이 학과 사무실을 직접 방문한다
2. 조교에게 "○○ 있나요?"라고 구두로 묻는다
3. 있으면 **종이 장부에 손으로** 이름·학번·날짜를 적는다
4. 조교는 별도의 엑셀 파일에 같은 내용을 **다시 입력**한다

이 절차는 학생과 조교 모두에게 비용을 발생시키며, 그 비용은 학과 수(32개)만큼 중복됩니다.

## 3. 해결하려는 문제

> 각 문제는 실제 시스템 기능과 1:1로 대응되도록 설계했습니다.

| # | 문제 | 대상 | 현재 상황 | 본 프로젝트의 해결 방식 |
|---|---|---|---|---|
| P1 | **재고를 알 수 없다** | 학생 | 직접 찾아가 물어보기 전까지 보유 여부·잔여 수량을 알 방법이 없어 헛걸음이 발생한다 | 학과별 기자재 목록과 잔여 수량을 실시간 조회 |
| P2 | **신청 이력이 남지 않는다** | 학생 | 내가 무엇을 언제까지 빌렸는지 종이 장부 외에 확인할 방법이 없다 | 개인별 대여 내역 및 상태(심사중/대여중/반납완료) 조회 |
| P3 | **이중 관리** | 조교 | 종이 장부 + 엑셀 파일을 각각 관리해 동일 정보를 두 번 기록한다 | 승인·반려·반납 처리 시 재고가 자동 반영되는 단일 원장 |
| P4 | **재고 정합성** | 조교 | 수기 계산이라 실물 수량과 장부 수량이 어긋나기 쉽다 | 신청 시 차감 · 반려/반납 시 복원. DB 행 잠금으로 동시 신청에도 정합성 보장 |
| P5 | **권한 경계 부재** | 학과 | 누가 어느 학과 장비를 관리하는지 시스템적 구분이 없다 | JWT 기반 역할(학생/조교) 및 **학과 소유권 검증** |

## 4. 프로젝트 목표

| 구분 | 목표 | 달성 여부 |
|---|---|---|
| **기능** | 조회 → 신청 → 승인/반려 → 반납의 전체 흐름이 끊김 없이 동작 | ✅ |
| **신뢰성** | 동시 신청 상황에서도 재고가 음수가 되거나 초과 대여되지 않음 | ✅ 행 잠금(`SELECT ... FOR UPDATE`) 적용 |
| **보안** | 타 학과 기자재를 임의로 등록·수정·승인할 수 없음 | ✅ 학과 소유권 검증 |
| **재현성** | 새 환경에서 문서만 보고 5분 내 실행 가능 | ✅ 시드 데이터 자동 주입 |
| **확장성** | 학과 추가 시 코드 수정 없이 데이터만으로 확장 | ✅ 32개 학과 마스터 데이터 분리 |

## 5. 핵심 기능

### 학생

| 기능 | 설명 |
|---|---|
| **학과별 기자재 탐색** | 5개 학부 32개 학과 중 선택하여 해당 학과 보유 장비와 잔여 수량 확인 |
| **대여 신청** | 대여 시작일·반납 예정일·수량·사유를 입력해 신청. 신청 즉시 재고에서 차감되어 중복 배정 방지 |
| **타 학과 대여 식별** | 본인 학과가 아닌 장비를 신청하면 `is_cross_department` 플래그가 자동 기록되어 조교가 판단 근거로 활용 |
| **내 대여 내역** | 상태별(전체/심사중/대여중/반납완료) 필터링 조회 |
| **신청 취소** | 아직 심사 중인 신청에 한해 취소 가능. 취소 시 재고 자동 복원 |

### 조교

| 기능 | 설명 |
|---|---|
| **학과 대여 현황 대시보드** | 본인 학과 기자재에 대한 **모든 학생의** 신청 내역 조회 |
| **승인 / 반려** | 심사 중 신청을 처리. 반려 시 차감됐던 재고를 자동 복원 |
| **반납 처리** | 대여중 상태의 건을 반납 완료로 전환하며 재고 복원 |
| **기자재 등록 / 수정** | 이미지 업로드를 포함한 장비 등록. **본인 학과 장비만** 등록·수정 가능 |

### 공통

- **JWT 기반 인증** — bcrypt 해시 저장, 액세스 토큰 만료 관리, 401 응답 시 자동 로그아웃
- **역할 기반 접근 제어(RBAC)** — 학생/조교 권한 분리, 조교 전용 엔드포인트 보호
- **오프라인 시연 모드** — `VITE_USE_MOCK=true` 설정 시 백엔드 없이 목업 데이터로 전체 흐름 시연 가능 (현장 네트워크 장애 대비)

## 6. AI 활용 전략

> 상세 내용: **[docs/AI.md](docs/AI.md)**

본 프로젝트는 **AI를 서비스 런타임 기능이 아니라 개발 프로세스 전반의 도구로 활용**했습니다. 이는 기술적 판단에 따른 의도적 설계 결정입니다.

**왜 인앱 LLM을 넣지 않았는가:**

기자재 대여의 핵심 요구사항은 *재고 정합성*, *권한 경계*, *상태 전이의 정확성*입니다. 이 세 가지는 모두 **결정론적(deterministic)으로 동작해야 하는 영역**으로, 확률적 출력을 내는 LLM을 개입시키면 오히려 신뢰성이 훼손됩니다. "재고가 몇 개 남았는가"라는 질문에 LLM이 답해야 할 이유는 없습니다.

대신 AI는 다음 영역에 집중 투입했습니다.

| 단계 | AI 활용 | 산출물 |
|---|---|---|
| 문제 정의 | 문제 구조화 및 거름망 설계 | 5개 문제(P1~P5) 도출 |
| 설계 | API 계약 사전 확정으로 프론트/백엔드 병렬 개발 | REST API 명세 |
| 구현 | 코드 생성 및 리뷰 | 백엔드 API, 프론트 컴포넌트 |
| 품질 검증 | **적대적 코드 리뷰** | 보안·인가·동시성 결함 6건 발견 및 수정 |
| 문서화 | 구조 정합성 검증 및 문서 생성 | 본 문서 일체 |

**가장 큰 성과는 품질 검증 단계**였습니다. AI 코드 리뷰를 통해 `allow_origins="*"` + `allow_credentials=True`라는 CORS 스펙 위반 조합, 재고 차감 시 레이스 컨디션, 타 학과 기자재 등록 가능 취약점 등을 배포 전에 발견하여 수정했습니다.

## 7. 기술 스택

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| **Frontend** | React 18 + Vite | 팀 내 경험 보유. Vite의 HMR로 1.5일이라는 짧은 개발 기간에 반복 속도 확보 |
| | React Router v6 | SPA 라우팅 표준 |
| | Context API | 인증 상태 전역 관리. 상태 규모가 작아 Redux 등 외부 상태 관리 라이브러리는 과설계로 판단 |
| | Tailwind CSS | 유틸리티 클래스로 별도 CSS 파일 없이 일관된 디자인 시스템 유지 |
| **Backend** | FastAPI | 타입 힌트 기반 자동 검증·자동 API 문서(`/docs`) 생성. 문서화 비용 절감 |
| | SQLAlchemy 2.x (async) | `asyncpg` 기반 비동기 I/O. 최신 `Mapped[]` 타입 어노테이션 스타일 적용 |
| | Pydantic v2 | 요청/응답 스키마 검증. FastAPI와 통합되어 잘못된 입력을 라우터 진입 전 차단 |
| **Database** | PostgreSQL 16 | `SELECT ... FOR UPDATE` 행 잠금으로 동시 신청 시 재고 정합성 보장. SQLite로는 이 요구사항 충족 불가 |
| **Auth** | JWT (python-jose) + bcrypt | 무상태 인증으로 서버 세션 저장소 불필요 |
| **Network** | Tailscale | 팀원 간 및 시연 환경의 사설 메시 네트워크 |

<details>
<summary><b>의도적으로 제외한 기술과 그 이유</b></summary>

| 제외 대상 | 판단 근거 |
|---|---|
| **Docker / Docker Compose** | 팀원 3명, 개발 기간 1.5일. 컨테이너 환경 구축 비용이 네이티브 설치 대비 이득을 넘어섬 |
| **클라우드 배포 (Vercel/Railway 등)** | 제출물이 GitHub 저장소와 현장 시연으로 규정됨. 퍼블릭 호스팅이 평가에 기여하지 않는 반면 설정·비용·장애 대응 부담이 발생 |
| **API 버저닝 (`/api/v1`)** | 단일 버전으로 종료되는 프로젝트에서 버전 경로는 불필요한 추상화 계층 |
| **CI/CD 파이프라인** | 배포 대상이 없어 파이프라인이 검증할 산출물이 존재하지 않음 |
| **인앱 LLM 연동** | 위 [6. AI 활용 전략](#6-ai-활용-전략) 참고 — 결정론적 정합성이 요구되는 도메인 |

> 과설계를 피하는 것 역시 설계 결정입니다. 각 항목은 "쓸 수 없어서"가 아니라 **"이 프로젝트의 제약 조건에서 비용이 이득을 초과하여"** 제외했습니다.

</details>

## 8. 시스템 아키텍처

```mermaid
graph LR
    subgraph Client["프론트엔드 (팀원 A 로컬)"]
        UI[React + Vite<br/>SPA]
        AC[apiClient.js<br/>JWT 자동 주입 · 401 처리]
        UI --> AC
    end

    subgraph Server["백엔드 (팀원 B 로컬)"]
        API[FastAPI]
        DEPS[deps.py<br/>인증 · RBAC]
        SVC[api/<br/>equipment · rentals · auth]
        API --> DEPS --> SVC
    end

    DB[(PostgreSQL 16)]
    FS[/static/uploads/<br/>기자재 이미지/]

    AC -->|REST over Tailscale| API
    SVC -->|SQLAlchemy async| DB
    SVC --> FS

    style Client fill:#e3f2fd,stroke:#1976d2
    style Server fill:#e8f5e9,stroke:#388e3c
    style DB fill:#fff3e0,stroke:#f57c00
```

**핵심 설계 원칙**

- **계층 분리** — 라우터(`api/`)는 요청 검증과 응답 직렬화만 담당하고, 인증·인가는 의존성 주입(`deps.py`)으로 분리하여 각 엔드포인트에 선언적으로 적용합니다.
- **학과 소유권 경계** — 조교 권한만으로는 부족하며, "본인 학과 소속"인지를 추가 검증합니다. 권한(Role)과 소유권(Ownership)을 별개 관심사로 다룹니다.
- **원자적 재고 처리** — 대여 신청 시 `SELECT ... FOR UPDATE`로 기자재 행을 잠근 뒤 재고를 확인·차감하여, 동시 요청에서도 초과 대여가 발생하지 않습니다.

### 대여 신청 처리 흐름

```mermaid
sequenceDiagram
    participant S as 학생
    participant F as Frontend
    participant B as Backend
    participant D as PostgreSQL

    S->>F: 대여 신청 (기간·수량·사유)
    F->>B: POST /rentals<br/>Authorization: Bearer {JWT}
    B->>B: JWT 검증 → 사용자 식별
    B->>D: SELECT equipment FOR UPDATE 🔒
    D-->>B: 기자재 행 (잠금)
    alt 재고 부족
        B-->>F: 400 대여 가능한 수량이 없습니다
    else 재고 충분
        B->>D: available_quantity -= quantity
        B->>D: INSERT rental (PENDING)
        Note over B,D: 커밋 시점에 잠금 해제 🔓
        B-->>F: 201 Created
        F-->>S: 마이페이지로 이동
    end
```

> 상태 전이 다이어그램과 전체 시퀀스: **[docs/Architecture.md](docs/Architecture.md)**

## 9. 프로젝트 구조

```
.
├── backend/                     FastAPI 서버
│   ├── app/
│   │   ├── api/                 라우터 — 요청 검증 · 응답 직렬화
│   │   │   ├── auth.py          로그인 · 내 정보 조회
│   │   │   ├── equipment.py     기자재 조회 · 등록 · 수정
│   │   │   ├── rentals.py       대여 신청 · 승인 · 반려 · 반납 · 취소
│   │   │   └── departments.py   학과 마스터 데이터
│   │   ├── core/                횡단 관심사
│   │   │   ├── config.py        환경변수 로딩 (pydantic-settings)
│   │   │   ├── database.py      비동기 엔진 · 세션 · Base
│   │   │   ├── security.py      JWT 발급/검증 · bcrypt 해싱
│   │   │   └── storage.py       이미지 업로드 · 삭제
│   │   ├── models/              SQLAlchemy ORM 모델
│   │   ├── schemas/             Pydantic 요청/응답 스키마
│   │   ├── deps.py              인증 · RBAC 의존성
│   │   ├── init_db.py           시드 데이터 (계정 · 기자재)
│   │   └── main.py              앱 진입점 · CORS · 라우터 등록
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/                    React SPA
│   ├── src/
│   │   ├── api/                 백엔드 통신 계층
│   │   │   ├── apiClient.js     공통 fetch 래퍼 · JWT 주입 · 401 핸들링
│   │   │   ├── authApi.js       로그인
│   │   │   ├── equipmentApi.js  기자재 조회 · 등록
│   │   │   └── rentalApi.js     대여 신청 · 승인 · 반려 · 반납 · 취소
│   │   ├── components/          재사용 UI 컴포넌트
│   │   │   ├── common/          Badge · EmptyState · LoginPromptModal
│   │   │   ├── equipment/       EquipmentCard · DepartmentSelect · AddEquipmentModal
│   │   │   ├── layout/          AppHeader · Layout
│   │   │   └── rental/          RentalHistoryItem · TARentalItem
│   │   ├── context/             AuthContext · AppContext
│   │   ├── pages/               Login · Home · EquipmentDetail · Rental · MyPage
│   │   ├── App.jsx              라우팅 정의
│   │   └── main.jsx             진입점
│   ├── .env.example
│   └── package.json
│
├── docs/                        프로젝트 문서
│   ├── Architecture.md          시스템 설계 · 다이어그램
│   ├── Database.md              ERD · 테이블 명세
│   ├── API.md                   REST API 명세 · 예시
│   ├── AI.md                    AI 활용 전략 및 방법론
│   ├── Product.md               PRD · 요구사항 정의
│   ├── Development.md           개발 환경 · 컨벤션 · 브랜치 전략
│   ├── Troubleshooting.md       문제 해결 가이드
│   ├── Roadmap.md               향후 발전 방향
│   └── plans/                   구현 계획 (개발 기록)
│
├── .github/                     이슈 · PR 템플릿
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

## 10. 설치 방법

### 사전 요구사항

| 도구 | 버전 | 용도 |
|---|---|---|
| Node.js | 18 이상 | 프론트엔드 |
| Python | 3.11 이상 | 백엔드 |
| PostgreSQL | 16 이상 | 데이터베이스 |

### 1) 저장소 클론

```bash
git clone https://github.com/Zman927/hackathon-useful-kids.git
cd hackathon-useful-kids
```

### 2) 데이터베이스 준비

```bash
psql -U postgres -c "CREATE DATABASE equipment_rental;"
```

### 3) 백엔드 설치

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env    # Windows: copy .env.example .env
```

`.env` 파일을 열어 실제 접속 정보로 수정합니다.

```env
DATABASE_URL=postgresql+asyncpg://postgres:비밀번호@localhost:5432/equipment_rental
SECRET_KEY=충분히-긴-랜덤-문자열
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 4) 프론트엔드 설치

```bash
cd ../frontend
npm install
cp .env.example .env    # Windows: copy .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 11. 실행 방법

**터미널 1 — 백엔드**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

최초 실행 시 테이블이 자동 생성되고 시드 데이터가 주입됩니다.

**터미널 2 — 프론트엔드**

```bash
cd frontend
npm run dev
```

| 주소 | 설명 |
|---|---|
| http://localhost:5173 | 웹 애플리케이션 |
| http://localhost:8000/health | 백엔드 상태 확인 |
| http://localhost:8000/docs | 자동 생성 API 문서 (Swagger UI) |

### 데모 계정

시드 데이터로 5개 학과의 조교·학생 계정이 자동 생성됩니다. **비밀번호는 모두 `pwd123`입니다.**

| 학과 | 조교 ID | 학생 ID | 보유 기자재 |
|---|---|---|---|
| 컴퓨터공학과 | `com` | `2026001` | 라즈베리 파이 4 (5대) |
| AI게임소프트웨어학과 | `aigame` | `2026101` | Meta Quest 3 VR 헤드셋 (3대) |
| 컴퓨터보안공학과 | `combo` | `2026201` | 무선 패킷 분석 랜카드 (4대) |
| 전자공학과 | `elec` | `2026301` | 디지털 오실로스코프 (2대) |
| 정보통신공학과 | `tong` | `2026401` | 광파워미터 측정기 (3대) |

> **권장 시연 순서**: `2026001`(학생)으로 로그인 → 라즈베리 파이 대여 신청 → 로그아웃 → `com`(조교)으로 로그인 → 신청 승인 → 반납 처리

## 12. 문서

| 문서 | 내용 |
|---|---|
| [Architecture.md](docs/Architecture.md) | 시스템 구조, 설계 결정, 시퀀스·상태 다이어그램 |
| [Database.md](docs/Database.md) | ERD, 테이블 명세, 인덱스 및 제약 조건 |
| [API.md](docs/API.md) | 전체 엔드포인트 명세와 요청/응답 예시 |
| [AI.md](docs/AI.md) | AI 활용 전략, 단계별 적용 방법, 검증 결과 |
| [Product.md](docs/Product.md) | 문제 정의, 요구사항, MVP 범위 |
| [Development.md](docs/Development.md) | 개발 환경 구성, 커밋 컨벤션, 브랜치 전략 |
| [Troubleshooting.md](docs/Troubleshooting.md) | 자주 발생하는 문제와 해결 방법 |
| [Roadmap.md](docs/Roadmap.md) | 단계별 확장 계획 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 기여 가이드 |
| [SECURITY.md](SECURITY.md) | 보안 정책 및 알려진 제약 |

## 13. 팀 소개

**유용한 아이들**

| 역할 | 담당 | 주요 기여 |
|---|---|---|
| **PM · 기획 · 문서** | [Jorden](https://github.com/Zman927) | 문제 정의, API 계약 설계, 저장소 아키텍처, 문서 총괄, 브랜치 통합 관리 |
| **Backend** | [박범근](https://github.com/pang-4) | FastAPI 서버, 데이터 모델링, JWT 인증·RBAC, 재고 동시성 제어 |
| **Frontend** | [허정주](https://github.com/jungppung) | React SPA, 화면 설계 및 구현, API 연동 계층, 인증 상태 관리 |

**협업 방식** — 기능별 브랜치에서 작업 후 `main`으로 통합합니다. 개발 착수 전 REST API 계약을 문서로 확정하여, 백엔드 완성을 기다리지 않고 프론트엔드가 병렬로 진행할 수 있도록 설계했습니다. 상세 규약은 [Development.md](docs/Development.md)를 참고하십시오.

## 14. 프로젝트 일정

```mermaid
gantt
    title 프로젝트 진행 일정
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section 기획
    문제 정의 및 아이템 확정    :2026-07-30, 6d
    API 계약 설계               :2026-08-05, 1d

    section 개발
    저장소 · 문서 구조 수립      :2026-08-06, 1d
    백엔드 구현                  :2026-08-06, 2d
    프론트엔드 구현              :2026-08-06, 2d
    통합 및 연동 검증            :2026-08-07, 1d

    section 품질
    AI 코드 리뷰 · 결함 수정     :2026-08-07, 1d
    문서화 및 제출               :2026-08-07, 1d
```

| 일자 | 마일스톤 |
|---|---|
| 7/30 – 8/5 | 문제 정의, 아이템 확정, 심사 기준 분석, API 계약 설계 |
| 8/6 | 저장소 구조 수립, 백엔드·프론트엔드 병렬 개발 착수 |
| 8/7 | Tailscale 연동 검증, AI 코드 리뷰 기반 결함 수정, 문서화, 제출 |

## 15. 향후 발전 방향

> 상세 계획: **[docs/Roadmap.md](docs/Roadmap.md)**

| 단계 | 목표 | 주요 과제 |
|---|---|---|
| **1단계 — 운영 안정화** | 실제 학과 도입 | 예약 캘린더(기간 중복 방지), 연체 알림, 반납 기한 관리 |
| **2단계 — 학사 시스템 연동** | 계정 통합 | 학교 SSO 연동, 학생증 QR 인증, 실물 재고 실사 기능 |
| **3단계 — 전교 확대** | 32개 학과 전체 운영 | 학과별 관리자 위임, 이용 통계 대시보드, 장비 예산 편성 근거 데이터 제공 |

## 16. License

이 프로젝트는 [MIT License](LICENSE)를 따릅니다.

---

<div align="center">

**팀 유용한 아이들** · 2026학년도 AI 해커톤 경진대회

</div>
