# Backend

FastAPI 기반 REST API 서버입니다.

## 스택

- FastAPI · SQLAlchemy 2.x (async) · Pydantic v2
- PostgreSQL 16 (`asyncpg`)
- JWT 인증 (python-jose) · bcrypt

## 실행

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate        # macOS/Linux

pip install -r requirements.txt
cp .env.example .env               # 값 채우기
uvicorn app.main:app --reload --port 8000
```

- 상태 확인: http://localhost:8000/health
- API 문서: http://localhost:8000/docs

## 구조

| 디렉터리 | 역할 |
|---|---|
| `app/api/` | 라우터 — 요청 검증 · 응답 직렬화 |
| `app/core/` | 설정 · DB · 보안 · 파일 저장 |
| `app/models/` | SQLAlchemy ORM 모델 |
| `app/schemas/` | Pydantic 요청/응답 스키마 |
| `app/deps.py` | 인증 · 권한 의존성 |
| `app/init_db.py` | 시드 데이터 |

## 문서

- [개발 환경 설정](../docs/Development.md)
- [API 명세](../docs/API.md)
- [데이터 모델](../docs/Database.md)
- [아키텍처](../docs/Architecture.md)
- [문제 해결](../docs/Troubleshooting.md)
