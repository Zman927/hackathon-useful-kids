# 기자재 대여 시스템 - Frontend React 컴포넌트 구조 설계

## 배경

[2026-08-06-frontend-ui-flow-design.md](./2026-08-06-frontend-ui-flow-design.md)에서 정의한 5페이지(Login/Home/EquipmentDetail/Rental/MyPage) UI 흐름을 구현하기 위한 React 컴포넌트 구조를 설계한다. 코드는 작성하지 않고 구조와 역할만 정의한다. 학생 사용자 MVP 범위이며, 추후 FastAPI backend 연동을 고려한다.

## 상태 관리 접근

여러 페이지에서 공유되는 상태(로그인 사용자, 헤더의 선택 학과)는 **React Context**로 관리한다.

- `AuthContext`: 로그인한 사용자 정보, `login`/`logout` 함수 보유.
- `AppContext`: 헤더의 선택된 학과 state 보유.

대안으로 App.jsx에서 state를 들고 props로 내려주는 방식과 Redux/Zustand 도입을 검토했으나, 전자는 React Router 라우트 엘리먼트에 props를 넘기기 번거롭고(`useOutletContext` 우회 필요), 후자는 페이지 5개 규모의 MVP에는 과한 설정 비용이라 기각했다.

## 폴더 구조

```
src/
  api/
    apiClient.js       # fetch 래퍼: base URL, 공통 헤더, 에러 처리
    authApi.js         # login(studentId, password)
    equipmentApi.js     # getEquipmentList(deptId), getEquipmentDetail(id)
    rentalApi.js        # createRental(payload), getMyRentals(userId)
  context/
    AuthContext.jsx    # 로그인 사용자, login/logout
    AppContext.jsx     # 헤더의 선택된 학과 state
  components/
    layout/
      Header.jsx
      Layout.jsx        # Header + <Outlet/>, Login 제외 라우트에 적용
    common/
      Badge.jsx
      EmptyState.jsx
    equipment/
      EquipmentCard.jsx
      DepartmentSelect.jsx
    rental/
      RentalHistoryItem.jsx
  pages/
    Login.jsx
    Home.jsx
    EquipmentDetail.jsx
    Rental.jsx
    MyPage.jsx
  App.jsx               # Router + Context Provider 조립
```

**라우팅 구조**: `Login`은 `Layout` 밖(헤더 없음). 나머지 4개 페이지는 `Layout` 라우트 하위에 nested route로 묶어 `<Outlet/>`으로 렌더링.

## 페이지별 역할

| 페이지 | 역할 |
|---|---|
| Login | 학번+비밀번호 입력 → `authApi.login(studentId, password)` 호출(DB 비교) → 성공 시 `AuthContext`에 저장 후 Home으로 이동, 실패 시 오류 표시. 회원가입 화면 없음 |
| Home | `AppContext`의 선택 학과 기준 `equipmentApi.getEquipmentList()` 호출 → `EquipmentCard` 리스트 렌더링 |
| EquipmentDetail | `useParams`로 id 수신 → `equipmentApi.getEquipmentDetail()` 호출 → 상세 표시, [대여신청] 클릭 시 Rental로 이동 |
| Rental | 대상 기자재 요약 표시 + 폼(기간/수량/사유) 상태 관리 → `rentalApi.createRental()` 호출 → 성공 시 MyPage로 이동 |
| MyPage | `rentalApi.getMyRentals()` 호출 → `RentalHistoryItem` 리스트 + 상태 필터 |

## 공통 컴포넌트 정의

| 컴포넌트 | 위치 | 역할 | 사용처 |
|---|---|---|---|
| `Header` | components/layout | 로고(Home 링크) + `DepartmentSelect` + 마이페이지 아이콘. `AuthContext`/`AppContext`를 직접 구독해 props 없이 동작 | Home, EquipmentDetail, Rental, MyPage 공통 |
| `Layout` | components/layout | `Header` + `<Outlet/>` 렌더링, 페이지 공통 여백/래퍼 담당 | 라우터 nested route 껍데기 |
| `DepartmentSelect` | components/equipment | 학과 드롭다운 UI. 선택 시 `AppContext` 값 갱신 | Header 내부 |
| `EquipmentCard` | components/equipment | 기자재 이미지/이름/카테고리/가용 뱃지 표시, 클릭 시 상세로 이동. `{equipment, onClick}` props | Home 리스트 |
| `Badge` | components/common | 상태값에 따라 색상만 다르게 표시하는 범용 뱃지. `{label, variant}` props로 대여가능여부(EquipmentDetail)와 대여상태(MyPage)를 하나의 컴포넌트로 재사용 | EquipmentCard, EquipmentDetail, RentalHistoryItem |
| `EmptyState` | components/common | "목록 없음" 안내. `{message}` props | Home(학과 미선택/목록 없음), MyPage(내역 없음) |
| `RentalHistoryItem` | components/rental | 대여 내역 한 줄(기자재명/신청일/기간/`Badge`) | MyPage 리스트 |

`Badge`를 공통화한 이유는 "대여가능/불가"와 "심사중/대여중/반납완료"가 형태상 동일한 라벨+색상 패턴이라, variant만 다르게 넘기면 컴포넌트 하나로 양쪽을 커버할 수 있기 때문이다.

## API 연동 레이어 (FastAPI 대비)

- `apiClient.js`가 base URL(`.env`의 `VITE_API_BASE_URL`)과 공통 에러 처리를 담당하고, 각 도메인 API 모듈(`authApi`, `equipmentApi`, `rentalApi`)이 이를 통해 실제 엔드포인트를 호출한다.
- FastAPI 응답이 보통 snake_case(Pydantic 모델)로 오는 걸 감안해, **각 API 모듈 함수 안에서 응답을 camelCase로 정규화**한 뒤 페이지/컴포넌트에 넘긴다. 컴포넌트는 항상 일관된 필드명만 다루고, 실제 백엔드 스키마가 확정되거나 바뀌어도 수정 범위는 `api/` 폴더 안으로 국한된다.
- UI 흐름 설계 문서의 "가정 및 backend 확인 필요 사항"(필드명, 상태 enum 등)이 실제로 정해지면 `api/` 레이어의 매핑 코드만 고치면 되고, 컴포넌트/페이지는 손댈 필요가 없다.
- 로그인은 `authApi.login(studentId, password)`가 FastAPI의 인증 엔드포인트(예: `/auth/login`)를 호출하고, 응답으로 받은 토큰을 `AuthContext`에 저장하는 구조로 통일한다. 토큰 저장 위치(메모리 vs localStorage)와 이후 요청에 토큰을 싣는 방식(`apiClient.js`의 공통 헤더 처리)은 구현 단계에서 결정한다.

## 범위 밖

- 회원가입 화면/플로우
- 비밀번호 재설정
- 기자재 검색/필터 상세 UX
- MyPage 개별 항목 상세 모달
- 반응형(모바일) 레이아웃
- 실제 API 연동 코드, 로딩/에러 상태 UI
