# Frontend

React + Vite 기반 SPA입니다.

## 스택

- React 18 · Vite · React Router v6
- Context API (인증 · 전역 상태)
- Tailwind CSS

## 실행

```bash
npm install
cp .env.example .env    # 값 채우기
npm run dev
```

http://localhost:5173 에서 확인할 수 있습니다.

## 환경변수

| 변수 | 설명 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 주소. 팀원 서버 사용 시 Tailscale IP |
| `VITE_USE_MOCK` | `true`면 백엔드 없이 목업 데이터로 동작 (시연 백업용) |

> `.env` 수정 후에는 개발 서버를 **재시작**해야 반영됩니다.

## 구조

| 디렉터리 | 역할 |
|---|---|
| `src/api/` | 백엔드 통신. 모든 호출은 `apiClient.js`를 경유 |
| `src/components/` | 재사용 UI (`common` · `equipment` · `layout` · `rental`) |
| `src/context/` | `AuthContext` · `AppContext` |
| `src/pages/` | 화면 단위 컴포넌트 |

## 규약

- API 호출은 반드시 `api/` 계층을 경유합니다. 컴포넌트에서 `fetch`를 직접 호출하지 않습니다.
- 모든 데이터 화면은 **로딩 / 빈 상태 / 에러** 세 가지 상태를 처리합니다.

## 문서

- [개발 환경 설정](../docs/Development.md)
- [API 명세](../docs/API.md)
- [아키텍처](../docs/Architecture.md)
- [문제 해결](../docs/Troubleshooting.md)
