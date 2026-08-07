# 개발 환경 설정

배포하지 않는다. 이 문서대로 로컬에 띄운 환경을 개발 중에도, 시연 당일에도 그대로 쓴다.

## 사전 준비물

| 도구 | 용도 |
|---|---|
| Node.js 18+ | Frontend |
| Python 3.11+ | Backend |
| PostgreSQL 16+ | DB (네이티브 설치, Docker 안 씀) |
| [Tailscale](https://tailscale.com/download) | 팀원 간 네트워크 연결 |

## 1. PostgreSQL 설치 및 연결

Docker를 쓰지 않으므로 각자 컴퓨터에 PostgreSQL을 직접 설치한다.

**Windows:** [postgresql.org](https://www.postgresql.org/download/windows/) 설치 마법사 실행 → 설치 중 지정한 비밀번호를 기억해둘 것.

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

설치 후 DB와 사용자를 만든다 (백엔드를 실행할 컴퓨터에서 한 번만):

```bash
psql -U postgres
CREATE DATABASE equipment_rental;
```

이미 있는 `postgres` 계정을 그대로 써도 되고, 별도 계정을 만들어도 된다 — `backend/.env`의 `DATABASE_URL`에 실제 값만 맞춰주면 된다.

## 2. Backend 실행

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate        # macOS/Linux

pip install -r requirements.txt

copy .env.example .env             # Windows
# cp .env.example .env              # macOS/Linux
# .env를 열어 실제 Postgres 접속 정보로 수정

uvicorn app.main:app --reload --port 8000
```

정상 실행되면 `http://localhost:8000/health`에서 `{"status": "ok"}` 확인. `http://localhost:8000/docs`에서 Swagger UI로 전체 API를 바로 테스트해볼 수 있다.

앱이 처음 시작될 때 테이블을 자동 생성하고(`Base.metadata.create_all`, 마이그레이션 도구 없음), 5개 학과(AI·SW융합학부 소속)에 조교·학생 계정과 기자재 시드 데이터를 자동으로 채운다(`app/init_db.py`, 이미 있으면 건너뜀). 시드 계정 로그인 정보:

| 학번(ID) | 비밀번호 | 역할 |
|---|---|---|
| `com` | `pwd123` | 컴퓨터공학과 조교 |
| `2026001` | `pwd123` | 컴퓨터공학과 학생 |

다른 4개 학과(AI게임소프트웨어, 컴퓨터보안공학과, 전자공학과, 정보통신공학과)도 같은 패턴(조교 계정 학과 약칭, 학생 계정 `2026xxx`)으로 존재한다. 전체 목록은 `backend/app/init_db.py`의 `SEED_DATA` 참고.

## 3. Frontend 실행

```bash
cd frontend
npm install

copy .env.example .env             # Windows
# cp .env.example .env              # macOS/Linux
# .env를 열어 VITE_API_BASE_URL 설정 (아래 "API 주소" 참고)

npm run dev
```

## 4. .env 설정

### backend/.env

```
DATABASE_URL=postgresql+asyncpg://postgres:<본인이 설정한 비밀번호>@localhost:5432/equipment_rental
SECRET_KEY=<임의의 랜덤 문자열>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

`SECRET_KEY`는 JWT 서명에 쓰인다 — `.env.example`의 예시 문구(`change-this-secret-key-...`)를 그대로 두면 로그인 토큰을 아무나 위조할 수 있으니 **반드시 랜덤 값으로 바꿀 것**. 생성 예: `python3 -c "import secrets; print(secrets.token_hex(32))"`

### frontend/.env

```
VITE_API_BASE_URL=http://localhost:8000
```

**팀원 컴퓨터의 백엔드에 붙일 때는** `localhost` 대신 그 컴퓨터의 Tailscale IP를 쓴다 (아래 참고).

## 5. Tailscale 연결 방법

프론트와 백엔드가 서로 다른 컴퓨터에서 돌아갈 때, 같은 wifi가 아니어도 연결하기 위해 사용한다.

1. [Tailscale 설치](https://tailscale.com/download) 후 팀 계정으로 로그인 (팀원 전원 같은 tailnet에 있어야 함)
2. 백엔드를 실행 중인 컴퓨터에서 본인 IP 확인:
   ```bash
   tailscale ip -4
   ```
3. 프론트엔드 쪽 `.env`의 `VITE_API_BASE_URL`에 그 IP를 넣는다:
   ```
   VITE_API_BASE_URL=http://100.x.y.z:8000
   ```

백엔드 컴퓨터가 꺼지거나 uvicorn이 멈추면 프론트 쪽 API 호출이 전부 실패한다 — 버그가 아니라 "백엔드 꺼짐" 신호다.

## 6. API 주소

| 환경 | 주소 |
|---|---|
| 로컬(같은 컴퓨터) | `http://localhost:8000` |
| 팀원 컴퓨터에 연결 | `http://<그 컴퓨터의 Tailscale IP>:8000` |

## 7. Troubleshooting

**`asyncpg` 연결 오류 (`could not connect to server`)**
→ PostgreSQL 서비스가 실행 중인지 확인. Windows는 서비스 관리자에서 `postgresql-x64-16` 상태 확인, macOS는 `brew services list`.

**`password authentication failed`**
→ `backend/.env`의 `DATABASE_URL`에 들어간 비밀번호가 실제 설치 시 설정한 비밀번호와 다름. 재설정하거나 `.env`를 맞춘다.

**프론트에서 API 호출이 전부 실패 (`Failed to fetch` / `Network Error`)**
→ 1) 백엔드가 켜져 있는지, 2) `VITE_API_BASE_URL`이 맞는 주소인지, 3) 팀원 컴퓨터라면 Tailscale이 둘 다 연결돼 있는지 순서로 확인.

**CORS 에러**
→ 백엔드가 개발 중 `allow_origins=["*"]`로 열려 있어야 정상. `app/main.py`의 CORS 설정이 바뀌지 않았는지 확인.

**`포트 8000 already in use`**
→ 이전에 띄운 uvicorn 프로세스가 안 죽었을 가능성. 프로세스 종료 후 재실행하거나 `--port` 값을 바꿔서 실행하고 프론트 `.env`도 맞춰준다.
