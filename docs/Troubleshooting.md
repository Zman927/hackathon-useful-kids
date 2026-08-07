# Troubleshooting

실행 및 개발 중 발생하는 문제의 원인과 해결 방법입니다.

---

## 빠른 진단

문제가 발생하면 아래 순서로 범위를 좁히십시오.

```mermaid
flowchart TD
    A[문제 발생] --> B{"백엔드 응답?<br/>curl localhost:8000/health"}
    B -->|실패| C[백엔드 문제<br/>→ 1장]
    B -->|성공| D{"프론트 화면 표시?"}
    D -->|실패| E[프론트엔드 문제<br/>→ 2장]
    D -->|성공| F{"API 호출 성공?<br/>브라우저 Network 탭"}
    F -->|실패| G[연결 · CORS 문제<br/>→ 3장]
    F -->|성공| H[데이터 · 권한 문제<br/>→ 4장]

    style C fill:#ffcdd2
    style E fill:#fff3e0
    style G fill:#e1f5fe
    style H fill:#f3e5f5
```

---

## 1. 백엔드

### `could not connect to server` / `Connection refused` (PostgreSQL)

PostgreSQL 서비스가 실행 중이지 않습니다.

| 환경 | 확인 |
|---|---|
| Windows | 서비스 관리자에서 `postgresql-x64-16` 상태 확인 |
| macOS | `brew services list` |
| Linux | `sudo systemctl status postgresql` |

### `password authentication failed for user "postgres"`

`.env`의 `DATABASE_URL`에 있는 비밀번호가 PostgreSQL 설치 시 설정한 값과 다릅니다.

```env
DATABASE_URL=postgresql+asyncpg://postgres:여기가_실제_비밀번호@localhost:5432/equipment_rental
```

비밀번호를 잊었다면 재설정합니다.

```bash
psql -U postgres -c "ALTER USER postgres WITH PASSWORD '새비밀번호';"
```

### `database "equipment_rental" does not exist`

데이터베이스를 생성하지 않았습니다.

```bash
psql -U postgres -c "CREATE DATABASE equipment_rental;"
```

### `InvalidRequestError: The asyncio extension requires an async driver`

`DATABASE_URL`이 동기 드라이버로 지정되어 있습니다. **`postgresql://`가 아니라 `postgresql+asyncpg://`** 여야 합니다.

```env
# 잘못됨
DATABASE_URL=postgresql://postgres:pw@localhost:5432/equipment_rental
# 올바름
DATABASE_URL=postgresql+asyncpg://postgres:pw@localhost:5432/equipment_rental
```

### `ModuleNotFoundError: No module named 'app'`

`backend/` 디렉터리가 아닌 곳에서 실행했습니다.

```bash
cd backend    # 반드시 backend 디렉터리에서
uvicorn app.main:app --reload --port 8000
```

가상환경 활성화 여부도 확인하십시오. 프롬프트에 `(.venv)`가 표시되어야 합니다.

### `Address already in use` (포트 8000)

이전에 실행한 `uvicorn` 프로세스가 종료되지 않았습니다.

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS / Linux
lsof -ti:8000 | xargs kill -9
```

다른 포트를 쓸 경우 프론트엔드 `.env`의 `VITE_API_BASE_URL`도 함께 변경해야 합니다.

### 서버는 뜨는데 데이터가 비어 있음

시드 주입이 실패했을 수 있습니다. 시작 로그에서 오류를 확인하고, DB를 직접 조회해 보십시오.

```bash
psql -U postgres -d equipment_rental -c "SELECT student_id, name, role FROM users;"
```

시드 함수는 멱등하게 구현되어 있어 **기존 데이터가 있으면 건너뜁니다.** 초기 상태로 되돌리려면 테이블을 비우고 재시작하십시오.

```bash
psql -U postgres -d equipment_rental -c "DROP TABLE IF EXISTS rentals, equipments, users CASCADE;"
```

> 위 명령은 모든 대여 이력을 삭제합니다. 시연 직전에는 사용하지 마십시오.

---

## 2. 프론트엔드

### `npm run dev` 실행 후 화면이 비어 있음

브라우저 개발자 도구(F12)의 Console 탭에서 오류를 확인하십시오. 대부분 import 경로 오류이며, 파일명 대소문자 불일치가 흔한 원인입니다(Windows에서는 동작하고 Linux/macOS에서 실패).

### 환경변수가 반영되지 않음

Vite는 **개발 서버 시작 시점에 `.env`를 읽습니다.** 파일을 수정했다면 서버를 재시작해야 합니다.

```bash
# Ctrl+C 로 중지 후
npm run dev
```

`VITE_` 접두사가 없는 변수는 클라이언트에 노출되지 않습니다. 반드시 `VITE_API_BASE_URL` 형태여야 합니다.

### 로그인은 되는데 새로고침하면 로그아웃됨

`localStorage`의 인증 정보가 손상되었을 수 있습니다. 개발자 도구 → Application → Local Storage에서 `auth_user` 항목을 삭제한 뒤 다시 로그인하십시오.

---

## 3. 연결 · CORS

### `Failed to fetch` / `Network Error`

다음 순서로 확인하십시오.

| # | 확인 항목 | 방법 |
|---|---|---|
| 1 | 백엔드 가동 여부 | `curl http://localhost:8000/health` |
| 2 | `VITE_API_BASE_URL` 값 | 브라우저 Network 탭에서 실제 요청 주소 확인 |
| 3 | Tailscale 연결 (팀원 서버 사용 시) | 양쪽 모두 `tailscale status`로 온라인 확인 |
| 4 | 백엔드 담당자 서버 상태 | uvicorn 프로세스가 살아 있는지 |

> 팀원 서버 사용 중 갑자기 모든 요청이 실패한다면 대부분 **백엔드 컴퓨터가 절전 모드에 들어갔거나 uvicorn이 종료된 경우**입니다. 코드 문제가 아닙니다.

### CORS 오류

```
Access to fetch at '...' has been blocked by CORS policy
```

백엔드는 개발 단계에서 모든 origin을 허용하도록 설정되어 있습니다([`main.py`](../backend/app/main.py)). 이 오류가 발생한다면:

1. 요청이 실제로 백엔드에 도달했는지 확인 — 서버가 죽어 있으면 CORS 오류처럼 보일 수 있습니다
2. `allow_credentials` 설정을 변경하지 않았는지 확인

> `allow_origins=["*"]`와 `allow_credentials=True`는 **함께 사용할 수 없습니다.** 브라우저 CORS 명세 위반입니다. 본 프로젝트는 Bearer 토큰 인증을 사용하므로 `allow_credentials=False`가 올바른 설정입니다.

### Tailscale로 접속되지 않음

```bash
tailscale status          # 양쪽 기기가 목록에 보이는지
tailscale ip -4           # 백엔드 컴퓨터의 IP 확인
```

백엔드는 `--host` 옵션 없이 실행하면 `127.0.0.1`에만 바인딩되어 외부에서 접근할 수 없습니다. 팀원이 접속해야 한다면 다음과 같이 실행하십시오.

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 4. 데이터 · 권한

### `401 인증 정보가 유효하지 않습니다`

| 원인 | 해결 |
|---|---|
| 토큰 만료 (기본 60분) | 다시 로그인 |
| 팀원 간 `SECRET_KEY` 불일치 | 백엔드 `.env`의 `SECRET_KEY`를 팀 내 동일한 값으로 통일 |
| 토큰 미전송 | Network 탭에서 `Authorization: Bearer ...` 헤더 확인 |

> 백엔드를 재시작해도 토큰은 유효합니다. JWT는 무상태이므로 서버 세션에 의존하지 않습니다. 단, `SECRET_KEY`를 변경하면 기존 토큰이 모두 무효화됩니다.

### `403 이 작업을 수행할 권한이 없습니다`

학생 계정으로 조교 전용 기능을 호출했습니다. 조교 계정(`com`, `aigame`, `combo`, `elec`, `tong`)으로 로그인하십시오.

### `403 본인 학과의 기자재만 등록할 수 있습니다`

의도된 동작입니다. 조교는 본인 소속 학과의 기자재만 등록·수정할 수 있으며, 대여 신청 처리도 마찬가지입니다.

예를 들어 `com`(컴퓨터공학과 조교)은 전자공학과의 오실로스코프를 등록하거나 그에 대한 신청을 승인할 수 없습니다. 상세 설계는 [Architecture.md — 권한과 소유권의 분리](Architecture.md#31-권한과-소유권의-분리)를 참고하십시오.

### `400 대여 가능한 수량이 없습니다`

재고가 부족합니다. 다음을 확인하십시오.

- **심사 중인 신청도 재고를 점유합니다.** 승인 전이라도 이미 차감된 상태입니다
- 조교가 반려하거나 학생이 취소하면 재고가 복원됩니다

현재 재고 확인:

```bash
psql -U postgres -d equipment_rental \
  -c "SELECT name, total_quantity, available_quantity FROM equipments;"
```

### `400 이미 처리된 대여 신청입니다`

`PENDING` 상태가 아닌 신청을 승인·반려하려 했습니다. 화면이 최신 상태가 아닐 수 있으니 새로고침 후 다시 시도하십시오.

### 재고 수치가 실제와 맞지 않음

정상 흐름에서는 발생하지 않아야 합니다. DB를 직접 수정한 이력이 있는지 확인하고, 필요하면 수동으로 보정하십시오.

```sql
-- 특정 기자재의 활성 대여 수량 확인
SELECT e.name, e.total_quantity, e.available_quantity,
       COALESCE(SUM(r.quantity), 0) AS 점유중
FROM equipments e
LEFT JOIN rentals r ON r.equipment_id = e.id
     AND r.status IN ('PENDING', 'APPROVED')
GROUP BY e.id, e.name, e.total_quantity, e.available_quantity;
```

`total_quantity - 점유중 = available_quantity`가 성립해야 합니다.

---

## 5. 시연 당일 체크리스트

| # | 항목 | 확인 |
|---|---|---|
| 1 | PostgreSQL 서비스 실행 중 | `psql -U postgres -c "SELECT 1;"` |
| 2 | 백엔드 실행 및 응답 | `curl http://localhost:8000/health` |
| 3 | 시드 데이터 존재 | 로그인 화면에서 `2026001` / `pwd123` 로그인 |
| 4 | Tailscale 양쪽 온라인 | `tailscale status` |
| 5 | 프론트엔드 최신 빌드 | `npm run dev` 재시작 |
| 6 | 전체 흐름 리허설 | [Development.md — 통합 검증 시나리오](Development.md#73-통합-검증-시나리오) |
| 7 | 노트북 충전 · 절전 모드 해제 | 백엔드 컴퓨터가 절전되면 연결이 끊김 |

**최종 백업 수단** — 네트워크가 완전히 불가능한 상황에서는 `frontend/.env`를 다음과 같이 변경하고 재시작하면 백엔드 없이 전체 흐름을 시연할 수 있습니다.

```env
VITE_USE_MOCK=true
```

---

## 관련 문서

- [Development.md](Development.md) — 개발 환경 구성
- [API.md](API.md) — 오류 응답 명세
- [Architecture.md](Architecture.md) — 권한 · 재고 설계
