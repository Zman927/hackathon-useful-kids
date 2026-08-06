# 기자재 대여 시스템 Frontend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [2026-08-06-frontend-ui-flow-design.md](../specs/2026-08-06-frontend-ui-flow-design.md)와 [2026-08-06-frontend-component-structure-design.md](../specs/2026-08-06-frontend-component-structure-design.md)에서 승인된 설계를 바탕으로 5페이지(Login/Home/EquipmentDetail/Rental/MyPage) MVP를 구현한다.

**Architecture:** React Context(`AuthContext`, `AppContext`)로 로그인 사용자와 선택 학과를 공유하고, `api/` 레이어(`apiClient` + 도메인별 모듈)가 FastAPI 응답(snake_case)을 camelCase로 정규화해 컴포넌트에 전달한다. `Login`은 헤더 없는 단독 라우트, 나머지 4개 페이지는 `Layout`(헤더 포함) 하위 nested route로 구성한다.

**Tech Stack:** React 19, Vite, React Router v7. 테스트 프레임워크는 설치하지 않는다 — 각 작업은 코드 작성 후 `npm run dev`로 브라우저에서 직접 확인한다(해커톤 일정 고려, 사용자 확정).

---

## 검증 관련 참고사항

FastAPI 백엔드가 아직 준비되지 않았다. 따라서 이 계획의 각 작업에서 "브라우저 확인"은 다음 중 하나를 의미한다:
- 라우팅/폼 검증/버튼 활성화 조건 등 **클라이언트 로직**은 실제 동작을 눈으로 확인한다.
- 실제 데이터가 필요한 부분(기자재 목록, 대여 내역)은 API 요청이 **올바른 URL/메서드로 전송되는지 브라우저 개발자도구 Network 탭**으로 확인하고, 응답 실패 시 에러 상태 UI가 올바르게 뜨는지 확인한다.
- 백엔드가 준비된 이후 실데이터로 카드/뱃지 등이 의도대로 보이는지는 별도 QA로 재확인이 필요하다(이 계획의 범위 밖).

## 파일 구조

```
src/
  api/
    apiClient.js
    authApi.js
    equipmentApi.js
    rentalApi.js
  context/
    AuthContext.jsx
    AppContext.jsx
  components/
    layout/
      Header.jsx
      Layout.jsx
    common/
      Badge.jsx
      EmptyState.jsx
    equipment/
      DepartmentSelect.jsx
      EquipmentCard.jsx
    rental/
      RentalHistoryItem.jsx
  pages/
    Login.jsx        (신규)
    Home.jsx          (기존 플레이스홀더 교체)
    EquipmentDetail.jsx (기존 플레이스홀더 교체)
    Rental.jsx         (기존 플레이스홀더 교체)
    MyPage.jsx         (기존 플레이스홀더 교체)
  App.jsx              (라우팅 재구성)
```

라우팅: `/login`은 Layout 밖. `/`, `/equipment/:id`, `/rental/:id`, `/mypage`는 `Layout` 하위 nested route. (스펙의 "기자재 id 전달 방식" 미결정 항목은 `/rental/:id`로 `/equipment/:id`와 동일한 패턴을 사용하기로 이 계획에서 확정한다.)

---

### Task 1: apiClient

**Files:**
- Create: `src/api/apiClient.js`

- [ ] **Step 1: 코드 작성**

```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 콘솔/브라우저에 빌드 에러가 없는지 확인(아직 이 파일을 사용하는 곳이 없어 화면 변화는 없음).

- [ ] **Step 3: 커밋**

```bash
git add src/api/apiClient.js
git commit -m "feat: add fetch wrapper apiClient"
```

---

### Task 2: authApi

**Files:**
- Create: `src/api/authApi.js`

- [ ] **Step 1: 코드 작성**

```js
import { request } from "./apiClient";

export async function login(studentId, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, password }),
  });

  return {
    token: data.access_token,
    userId: data.user_id,
    userName: data.user_name,
  };
}
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/api/authApi.js
git commit -m "feat: add authApi login"
```

---

### Task 3: equipmentApi

**Files:**
- Create: `src/api/equipmentApi.js`

- [ ] **Step 1: 코드 작성**

```js
import { request } from "./apiClient";

function toEquipment(raw) {
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.image_url,
    category: raw.category,
    description: raw.description,
    departmentId: raw.department_id,
    isAvailable: raw.is_available,
  };
}

export async function getEquipmentList(departmentId) {
  const data = await request(`/equipment?department_id=${departmentId}`);
  return data.map(toEquipment);
}

export async function getEquipmentDetail(equipmentId) {
  const data = await request(`/equipment/${equipmentId}`);
  return toEquipment(data);
}
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/api/equipmentApi.js
git commit -m "feat: add equipmentApi list/detail"
```

---

### Task 4: rentalApi

**Files:**
- Create: `src/api/rentalApi.js`

- [ ] **Step 1: 코드 작성**

```js
import { request } from "./apiClient";

function toRental(raw) {
  return {
    id: raw.id,
    equipmentId: raw.equipment_id,
    equipmentName: raw.equipment_name,
    startDate: raw.start_date,
    endDate: raw.end_date,
    quantity: raw.quantity,
    purpose: raw.purpose,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

export async function createRental(payload) {
  const data = await request("/rentals", {
    method: "POST",
    body: JSON.stringify({
      equipment_id: payload.equipmentId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      quantity: payload.quantity,
      purpose: payload.purpose,
    }),
  });

  return toRental(data);
}

export async function getMyRentals(userId) {
  const data = await request(`/rentals?user_id=${userId}`);
  return data.map(toRental);
}
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/api/rentalApi.js
git commit -m "feat: add rentalApi create/list"
```

---

### Task 5: AuthContext

**Files:**
- Create: `src/context/AuthContext.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(userData) {
    setUser(userData);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/context/AuthContext.jsx
git commit -m "feat: add AuthContext"
```

---

### Task 6: AppContext

**Files:**
- Create: `src/context/AppContext.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);

  return (
    <AppContext.Provider
      value={{ selectedDepartmentId, setSelectedDepartmentId }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add AppContext for selected department"
```

---

### Task 7: Badge

**Files:**
- Create: `src/components/common/Badge.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
const VARIANT_STYLES = {
  available: { background: "#e6f4ea", color: "#1e7e34" },
  unavailable: { background: "#fdecea", color: "#c0392b" },
  pending: { background: "#fff8e1", color: "#b58105" },
  rented: { background: "#e8f0fe", color: "#1a56db" },
  returned: { background: "#eceff1", color: "#546e7a" },
};

function Badge({ label, variant }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.pending;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

export default Badge;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(아직 사용하는 곳 없음, Task 10/11에서 실제로 화면에 보임).

- [ ] **Step 3: 커밋**

```bash
git add src/components/common/Badge.jsx
git commit -m "feat: add Badge component"
```

---

### Task 8: EmptyState

**Files:**
- Create: `src/components/common/EmptyState.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
function EmptyState({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 16px", color: "#888" }}>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(Task 16/19에서 실제로 화면에 보임).

- [ ] **Step 3: 커밋**

```bash
git add src/components/common/EmptyState.jsx
git commit -m "feat: add EmptyState component"
```

---

### Task 9: DepartmentSelect

**Files:**
- Create: `src/components/equipment/DepartmentSelect.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { useApp } from "../../context/AppContext";

const DEPARTMENTS = [
  { id: 1, name: "컴퓨터공학과" },
  { id: 2, name: "전자공학과" },
  { id: 3, name: "기계공학과" },
  { id: 4, name: "화학공학과" },
];

function DepartmentSelect() {
  const { selectedDepartmentId, setSelectedDepartmentId } = useApp();

  function handleChange(event) {
    const value = event.target.value;
    setSelectedDepartmentId(value ? Number(value) : null);
  }

  return (
    <select value={selectedDepartmentId ?? ""} onChange={handleChange}>
      <option value="">학과 선택</option>
      {DEPARTMENTS.map((department) => (
        <option key={department.id} value={department.id}>
          {department.name}
        </option>
      ))}
    </select>
  );
}

export default DepartmentSelect;
```

학과 목록은 정적으로 하드코딩한다(이전 스펙의 미결정 항목을 이 계획에서 정적 목록으로 확정). 추후 API 조회로 바뀌면 이 컴포넌트 내부만 수정하면 된다.

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(Task 12에서 Header에 실제로 보임).

- [ ] **Step 3: 커밋**

```bash
git add src/components/equipment/DepartmentSelect.jsx
git commit -m "feat: add DepartmentSelect component"
```

---

### Task 10: EquipmentCard

**Files:**
- Create: `src/components/equipment/EquipmentCard.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import Badge from "../common/Badge";

function EquipmentCard({ equipment, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px",
        cursor: "pointer",
      }}
    >
      <img
        src={equipment.imageUrl}
        alt={equipment.name}
        style={{ width: "100%", height: "140px", objectFit: "cover" }}
      />
      <h3>{equipment.name}</h3>
      <p>{equipment.category}</p>
      <Badge
        label={equipment.isAvailable ? "대여가능" : "대여불가"}
        variant={equipment.isAvailable ? "available" : "unavailable"}
      />
    </div>
  );
}

export default EquipmentCard;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(Task 16에서 Home에 실제로 보임, 단 백엔드 없이는 목록이 비어 카드 자체는 안 보일 수 있음).

- [ ] **Step 3: 커밋**

```bash
git add src/components/equipment/EquipmentCard.jsx
git commit -m "feat: add EquipmentCard component"
```

---

### Task 11: RentalHistoryItem

**Files:**
- Create: `src/components/rental/RentalHistoryItem.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import Badge from "../common/Badge";

const STATUS_LABELS = {
  pending: "심사중",
  rented: "대여중",
  returned: "반납완료",
};

function RentalHistoryItem({ rental }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div>
        <p>{rental.equipmentName}</p>
        <p style={{ fontSize: "12px", color: "#888" }}>
          {rental.startDate} ~ {rental.endDate}
        </p>
      </div>
      <Badge
        label={STATUS_LABELS[rental.status] || rental.status}
        variant={rental.status}
      />
    </div>
  );
}

export default RentalHistoryItem;
```

`STATUS_LABELS`의 키(`pending`/`rented`/`returned`)는 backend 상태 enum이 확정되면 실제 값에 맞춰 이 파일만 수정하면 된다(스펙 문서의 "가정 및 backend 확인 필요 사항" 3번과 연결).

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(Task 19에서 MyPage에 실제로 보임).

- [ ] **Step 3: 커밋**

```bash
git add src/components/rental/RentalHistoryItem.jsx
git commit -m "feat: add RentalHistoryItem component"
```

---

### Task 12: Header

**Files:**
- Create: `src/components/layout/Header.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DepartmentSelect from "../equipment/DepartmentSelect";

function Header() {
  const { user } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        borderBottom: "1px solid #eee",
      }}
    >
      <Link to="/">기자재 대여</Link>
      <DepartmentSelect />
      <Link to="/mypage">{user ? user.userName : "마이페이지"}</Link>
    </header>
  );
}

export default Header;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(Task 15에서 라우팅에 실제로 연결됨).

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/Header.jsx
git commit -m "feat: add Header component"
```

---

### Task 13: Layout

**Files:**
- Create: `src/components/layout/Layout.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { Outlet } from "react-router-dom";
import Header from "./Header";

function Layout() {
  return (
    <div>
      <Header />
      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(Task 15에서 라우팅에 실제로 연결됨).

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/Layout.jsx
git commit -m "feat: add Layout wrapper with Header and Outlet"
```

---

### Task 14: Login 페이지

**Files:**
- Create: `src/pages/Login.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginRequest } from "../api/authApi";

function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const userData = await loginRequest(studentId, password);
      login(userData);
      navigate("/");
    } catch (err) {
      setError("학번 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <div style={{ maxWidth: "320px", margin: "80px auto" }}>
      <h1>기자재 대여</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="학번"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit">로그인</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 빌드 에러 없는지 확인(Task 15에서 라우팅에 실제로 연결됨).

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Login.jsx
git commit -m "feat: add Login page"
```

---

### Task 15: App.jsx 라우팅 재구성

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EquipmentDetail from "./pages/EquipmentDetail";
import Rental from "./pages/Rental";
import MyPage from "./pages/MyPage";

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/equipment/:id" element={<EquipmentDetail />} />
              <Route path="/rental/:id" element={<Rental />} />
              <Route path="/mypage" element={<MyPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 브라우저에서 아래를 확인한다:
- `/login` 접속 → 헤더 없이 로그인 폼만 보임
- `/` 접속 → 상단에 Header(로고/학과선택/마이페이지)가 보이고 그 아래 기존 "기자재 대여 Home" 플레이스홀더가 보임
- `/equipment/1`, `/rental/1`, `/mypage` 접속 → 각각 Header + 해당 플레이스홀더 문구가 보임

- [ ] **Step 3: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: wire routing with Layout and Context providers"
```

---

### Task 16: Home 페이지

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getEquipmentList } from "../api/equipmentApi";
import EquipmentCard from "../components/equipment/EquipmentCard";
import EmptyState from "../components/common/EmptyState";

function Home() {
  const { selectedDepartmentId } = useApp();
  const [equipmentList, setEquipmentList] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedDepartmentId) {
      setEquipmentList([]);
      return;
    }

    setError("");
    getEquipmentList(selectedDepartmentId)
      .then(setEquipmentList)
      .catch(() => setError("기자재 목록을 불러오지 못했습니다."));
  }, [selectedDepartmentId]);

  if (!selectedDepartmentId) {
    return <EmptyState message="학과를 선택해주세요." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (equipmentList.length === 0) {
    return <EmptyState message="대여 가능한 기자재가 없습니다." />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
      }}
    >
      {equipmentList.map((equipment) => (
        <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          onClick={() => navigate(`/equipment/${equipment.id}`)}
        />
      ))}
    </div>
  );
}

export default Home;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 `/` 접속. 학과 미선택 시 "학과를 선택해주세요." 표시 확인. 헤더에서 학과 선택 시 "기자재 목록을 불러오지 못했습니다." EmptyState가 뜨는지 확인(백엔드 없어 정상). 브라우저 개발자도구 Network 탭에서 `GET /equipment?department_id=...` 요청이 나가는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Home.jsx
git commit -m "feat: implement Home page equipment list"
```

---

### Task 17: EquipmentDetail 페이지

**Files:**
- Modify: `src/pages/EquipmentDetail.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEquipmentDetail } from "../api/equipmentApi";
import Badge from "../components/common/Badge";

function EquipmentDetail() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setError("");
    getEquipmentDetail(id)
      .then(setEquipment)
      .catch(() => setError("기자재 정보를 불러오지 못했습니다."));
  }, [id]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!equipment) {
    return <p>불러오는 중...</p>;
  }

  return (
    <div>
      <button onClick={() => navigate("/")}>← 목록으로</button>
      <img
        src={equipment.imageUrl}
        alt={equipment.name}
        style={{ width: "100%", maxWidth: "400px" }}
      />
      <h1>{equipment.name}</h1>
      <p>{equipment.category}</p>
      <p>{equipment.description}</p>
      <Badge
        label={equipment.isAvailable ? "대여가능" : "대여불가"}
        variant={equipment.isAvailable ? "available" : "unavailable"}
      />
      <div>
        <button
          disabled={!equipment.isAvailable}
          onClick={() => navigate(`/rental/${equipment.id}`)}
        >
          대여신청
        </button>
      </div>
    </div>
  );
}

export default EquipmentDetail;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 `/equipment/1` 직접 접속. "기자재 정보를 불러오지 못했습니다." 표시 확인(백엔드 없어 정상), Network 탭에서 `GET /equipment/1` 요청 확인. "← 목록으로" 클릭 시 `/`로 이동하는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/EquipmentDetail.jsx
git commit -m "feat: implement EquipmentDetail page"
```

---

### Task 18: Rental 페이지

**Files:**
- Modify: `src/pages/Rental.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createRental } from "../api/rentalApi";

function Rental() {
  const { id } = useParams();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isValid = startDate && endDate && quantity > 0 && purpose.trim() !== "";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await createRental({
        equipmentId: id,
        startDate,
        endDate,
        quantity,
        purpose,
      });
      navigate("/mypage");
    } catch (err) {
      setError("대여 신청에 실패했습니다.");
    }
  }

  return (
    <div style={{ maxWidth: "400px" }}>
      <h1>대여 신청</h1>
      <form onSubmit={handleSubmit}>
        <label>
          시작일
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          반납일
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label>
          수량
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>
        <label>
          사용 목적
          <textarea
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
          />
        </label>
        <button type="submit" disabled={!isValid}>
          신청하기
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

export default Rental;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 `/rental/1` 직접 접속. 필드를 모두 채우기 전에는 "신청하기" 버튼이 비활성화되는지 확인. 모두 채운 뒤 제출 시 "대여 신청에 실패했습니다." 표시 확인(백엔드 없어 정상), Network 탭에서 `POST /rentals` 요청과 body가 올바른지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Rental.jsx
git commit -m "feat: implement Rental page"
```

---

### Task 19: MyPage 페이지

**Files:**
- Modify: `src/pages/MyPage.jsx`

- [ ] **Step 1: 코드 작성**

```jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyRentals } from "../api/rentalApi";
import RentalHistoryItem from "../components/rental/RentalHistoryItem";
import EmptyState from "../components/common/EmptyState";

function MyPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setError("");
    getMyRentals(user.userId)
      .then(setRentals)
      .catch(() => setError("대여 내역을 불러오지 못했습니다."));
  }, [user]);

  if (!user) {
    return <EmptyState message="로그인이 필요합니다." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (rentals.length === 0) {
    return <EmptyState message="아직 신청한 대여가 없어요." />;
  }

  return (
    <div>
      <h1>{user.userName}님의 대여 내역</h1>
      {rentals.map((rental) => (
        <RentalHistoryItem key={rental.id} rental={rental} />
      ))}
    </div>
  );
}

export default MyPage;
```

- [ ] **Step 2: 확인**

`npm run dev` 실행 후 로그인하지 않은 상태로 `/mypage` 접속 → "로그인이 필요합니다." 표시 확인(AuthContext에 user가 없으므로 API 호출 자체가 안 나가는 것도 함께 확인).

- [ ] **Step 3: 커밋**

```bash
git add src/pages/MyPage.jsx
git commit -m "feat: implement MyPage rental history"
```

---

### Task 20: 전체 라우팅/에러 상태 점검

**Files:**
- (코드 변경 없음, 수동 점검만)

- [ ] **Step 1: 전체 흐름 점검**

`npm run dev` 실행 후 다음을 순서대로 확인한다:
1. `/login` → 학번/비밀번호 입력 후 로그인 시도 → 실패 안내 문구 표시(백엔드 없어 정상), Network 탭에 `POST /auth/login` 확인
2. `/` → Header의 학과 선택 드롭다운에서 학과 변경 시 EmptyState 문구가 바뀌는지 확인
3. `/equipment/1` 직접 접속 → 에러 문구 + "← 목록으로" 클릭 시 `/`로 이동 확인
4. `/rental/1` 직접 접속 → 폼 유효성 검사(빈 값일 때 버튼 비활성화) 확인
5. `/mypage` → 비로그인 상태에서 "로그인이 필요합니다." 확인
6. 브라우저 콘솔에 React 관련 경고/에러가 없는지 확인

- [ ] **Step 2: 커밋 (필요 시)**

이 작업에서 코드 변경이 없다면 커밋은 생략한다. 점검 중 발견된 문제가 있다면 해당 파일을 수정하고 별도로 커밋한다.

---

## 이후 단계 (이 계획 범위 밖)

- FastAPI 백엔드 준비 후: 실제 데이터로 EquipmentCard/Badge/RentalHistoryItem 렌더링 육안 확인
- 로그인 토큰 저장 방식(localStorage 등)과 인증이 필요한 요청에 토큰을 싣는 방식 결정
- 대여 상태 enum, 기자재 필드명 등 backend 확정값과 `api/` 레이어 매핑 재확인
- 반응형(모바일) 레이아웃
