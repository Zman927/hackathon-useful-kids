# 기자재 대여 플랫폼 — 프론트엔드 UI Implementation Plan

> 이 문서는 TDD 방식 구현 계획입니다. Task 순서대로, 각 Step의 체크박스(`- [ ]`)를 따라 진행하세요.

**Goal:** 학생이 학과별 기자재를 조회하고 대여를 신청하며, 조교가 신청을 승인·반려·반납 처리할 수 있는 화면을 만든다.

**Architecture:** Vite + React SPA, react-router-dom으로 3개 화면(목록/신청폼/조교 대시보드) 라우팅. 백엔드는 팀원 로컬에서 돌아가는 FastAPI를 Tailscale로 직접 호출한다 — 프론트도 배포하지 않는다. 인증 없음 — 조교 대시보드는 URL(`/admin`)만 비공개로 공유한다.

**Tech Stack:** React 18, Vite, react-router-dom v6, Vitest + @testing-library/react. **배포 없음** — 로컬(`npm run dev` 또는 `npm run preview`)에서 Tailscale로 백엔드에 연결해 그대로 시연

## Global Constraints

- 백엔드 API 베이스 URL은 환경변수 `VITE_API_BASE`로 주입한다 (로컬 기본값: `http://localhost:8000`, 팀원 컴퓨터의 백엔드에 붙일 땐 그 컴퓨터의 Tailscale IP)
- **배포하지 않는다.** 심사위원 원격 접속이 필요 없어(제출물은 github + 현장 시연) Vercel 등 공개 호스팅이 불필요하다
- API 계약은 `docs/plans/2026-08-06-backend-api-plan.md`에 정의된 엔드포인트를 그대로 따른다: `GET /departments`, `GET /equipment?department=`, `POST /rentals`, `GET /rentals?status=`, `PATCH /rentals/{id}/approve|reject|return`
- 인증 없음 — 백엔드와 동일한 MVP 범위
- 모든 화면은 로딩 상태 / 빈 리스트 안내 / 에러 메시지를 반드시 포함한다 (제출 전 체크리스트의 "겉보기 완성도" 항목)
- 커밋 메시지는 레포 루트 `README.md`의 `[타입] 내용` 규칙을 따른다
- 이 레포의 `frontend/` 폴더만 다룬다. `backend/`는 건드리지 않는다

---

### Task 1: 프로젝트 셋업 + API 클라이언트

**Files:**
- Modify: `frontend/package.json` (의존성 추가)
- Create: `frontend/vite.config.js` (Vite 템플릿 기본 파일을 테스트 설정 포함하도록 수정)
- Create: `frontend/src/setupTests.js`
- Create: `frontend/src/api.js`
- Test: `frontend/src/api.test.js`

**Interfaces:**
- Consumes: 백엔드 API 계약 (`2026-08-06-backend-api-plan.md` Task 2~4)
- Produces: `getDepartments()`, `getEquipment(department)`, `createRental(payload)`, `getRentals(status)`, `approveRental(id)`, `rejectRental(id)`, `returnRental(id)` — 전부 `src/api.js`에서 export, Promise 반환, 실패 시 `Error`를 throw

- [ ] **Step 1: Vite 프로젝트 생성 + 패키지 설치**

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install react-router-dom
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

`frontend/package.json`의 `scripts`에 추가:
```json
"test": "vitest run"
```

- [ ] **Step 2: 테스트 환경 설정**

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
```

```js
// frontend/src/setupTests.js
import '@testing-library/jest-dom'
```

- [ ] **Step 3: 실패하는 api.js 테스트 작성**

```js
// frontend/src/api.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDepartments } from './api'

describe('getDepartments', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('returns department list on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ['전자공학과', '기계공학과'],
    })

    const result = await getDepartments()

    expect(result).toEqual(['전자공학과', '기계공학과'])
  })

  it('throws when response is not ok', async () => {
    global.fetch.mockResolvedValue({ ok: false })

    await expect(getDepartments()).rejects.toThrow('학과 목록을 불러오지 못했습니다')
  })
})
```

- [ ] **Step 4: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL — `./api` 모듈이 없음

- [ ] **Step 5: api.js 작성**

```js
// frontend/src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function getDepartments() {
  const res = await fetch(`${API_BASE}/departments`)
  if (!res.ok) throw new Error('학과 목록을 불러오지 못했습니다')
  return res.json()
}

export async function getEquipment(department) {
  const url = department
    ? `${API_BASE}/equipment?department=${encodeURIComponent(department)}`
    : `${API_BASE}/equipment`
  const res = await fetch(url)
  if (!res.ok) throw new Error('기자재 목록을 불러오지 못했습니다')
  return res.json()
}

export async function createRental(payload) {
  const res = await fetch(`${API_BASE}/rentals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('대여 신청에 실패했습니다')
  return res.json()
}

export async function getRentals(status) {
  const url = status
    ? `${API_BASE}/rentals?status=${encodeURIComponent(status)}`
    : `${API_BASE}/rentals`
  const res = await fetch(url)
  if (!res.ok) throw new Error('신청 목록을 불러오지 못했습니다')
  return res.json()
}

export async function approveRental(id) {
  const res = await fetch(`${API_BASE}/rentals/${id}/approve`, { method: 'PATCH' })
  if (!res.ok) throw new Error('승인 처리에 실패했습니다')
  return res.json()
}

export async function rejectRental(id) {
  const res = await fetch(`${API_BASE}/rentals/${id}/reject`, { method: 'PATCH' })
  if (!res.ok) throw new Error('반려 처리에 실패했습니다')
  return res.json()
}

export async function returnRental(id) {
  const res = await fetch(`${API_BASE}/rentals/${id}/return`, { method: 'PATCH' })
  if (!res.ok) throw new Error('반납 처리에 실패했습니다')
  return res.json()
}
```

- [ ] **Step 6: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/src/setupTests.js frontend/src/api.js frontend/src/api.test.js
git commit -m "[설정] Vite+React 프로젝트 셋업 + API 클라이언트"
git push
```

---

### Task 2: 학과 선택 + 기자재 목록 화면

**Files:**
- Create: `frontend/src/pages/EquipmentList.jsx`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/pages/EquipmentList.test.jsx`

**Interfaces:**
- Consumes: `getDepartments()`, `getEquipment(department)` (Task 1)
- Produces: `EquipmentList` 컴포넌트 (default export), `App.jsx`의 `/` 라우트, 각 기자재 항목에서 `/rentals/new/:equipmentId`로 가는 링크

- [ ] **Step 1: 실패하는 테스트 작성**

```jsx
// frontend/src/pages/EquipmentList.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EquipmentList from './EquipmentList'
import * as api from '../api'

describe('EquipmentList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows equipment for the first department after loading', async () => {
    vi.spyOn(api, 'getDepartments').mockResolvedValue(['전자공학과'])
    vi.spyOn(api, 'getEquipment').mockResolvedValue([
      { id: 1, department: '전자공학과', name: '오실로스코프', total_quantity: 3, available_quantity: 2 },
    ])

    render(<EquipmentList />, { wrapper: MemoryRouter })

    await waitFor(() => {
      expect(screen.getByText(/오실로스코프/)).toBeInTheDocument()
    })
    expect(screen.getByText(/대여 가능 2\/3/)).toBeInTheDocument()
  })

  it('shows empty state when department has no equipment', async () => {
    vi.spyOn(api, 'getDepartments').mockResolvedValue(['전자공학과'])
    vi.spyOn(api, 'getEquipment').mockResolvedValue([])

    render(<EquipmentList />, { wrapper: MemoryRouter })

    await waitFor(() => {
      expect(screen.getByText('등록된 기자재가 없습니다.')).toBeInTheDocument()
    })
  })

  it('shows an error message when loading fails', async () => {
    vi.spyOn(api, 'getDepartments').mockRejectedValue(new Error('학과 목록을 불러오지 못했습니다'))

    render(<EquipmentList />, { wrapper: MemoryRouter })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('학과 목록을 불러오지 못했습니다')
    })
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL — `./EquipmentList` 모듈 없음

- [ ] **Step 3: EquipmentList.jsx 작성**

```jsx
// frontend/src/pages/EquipmentList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDepartments, getEquipment } from '../api'

export default function EquipmentList() {
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDepartments()
      .then((depts) => {
        setDepartments(depts)
        if (depts.length > 0) setSelectedDept(depts[0])
        else setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedDept) return
    setLoading(true)
    getEquipment(selectedDept)
      .then(setEquipment)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedDept])

  if (error) return <p role="alert">{error}</p>
  if (loading) return <p>불러오는 중...</p>

  return (
    <div>
      <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {equipment.length === 0 && <p>등록된 기자재가 없습니다.</p>}

      <ul>
        {equipment.map((item) => (
          <li key={item.id}>
            {item.name} — 대여 가능 {item.available_quantity}/{item.total_quantity}
            <Link to={`/rentals/new/${item.id}`}>대여 신청</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

`frontend/src/App.jsx`:

```jsx
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import EquipmentList from './pages/EquipmentList'

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">기자재 목록</Link>
      </nav>
      <Routes>
        <Route path="/" element={<EquipmentList />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/pages/EquipmentList.jsx frontend/src/pages/EquipmentList.test.jsx frontend/src/App.jsx
git commit -m "[추가] 학과 선택 + 기자재 목록 화면"
git push
```

---

### Task 3: 대여 신청 폼

**Files:**
- Create: `frontend/src/pages/RentalForm.jsx`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/pages/RentalForm.test.jsx`

**Interfaces:**
- Consumes: `createRental(payload)` (Task 1), `/rentals/new/:equipmentId` 경로 (Task 2에서 링크로 이미 참조됨)
- Produces: `RentalForm` 컴포넌트, `App.jsx`의 `/rentals/new/:equipmentId` 라우트

- [ ] **Step 1: 실패하는 테스트 작성**

```jsx
// frontend/src/pages/RentalForm.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RentalForm from './RentalForm'
import * as api from '../api'

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/rentals/new/1']}>
      <Routes>
        <Route path="/rentals/new/:equipmentId" element={<RentalForm />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RentalForm', () => {
  it('submits rental and shows confirmation', async () => {
    vi.spyOn(api, 'createRental').mockResolvedValue({ id: 1, status: '신청됨' })
    renderWithRoute()

    fireEvent.change(screen.getByPlaceholderText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByPlaceholderText('학번'), { target: { value: '20231234' } })
    fireEvent.change(screen.getByPlaceholderText('연락처'), { target: { value: '010-0000-0000' } })
    fireEvent.change(screen.getByPlaceholderText('대여 사유'), { target: { value: '캡스톤 프로젝트' } })
    fireEvent.click(screen.getByText('신청'))

    await waitFor(() => {
      expect(screen.getByText('신청이 접수되었습니다.')).toBeInTheDocument()
    })
    expect(api.createRental).toHaveBeenCalledWith({
      equipment_id: 1,
      student_name: '홍길동',
      student_number: '20231234',
      contact: '010-0000-0000',
      reason: '캡스톤 프로젝트',
    })
  })

  it('shows error message when submission fails', async () => {
    vi.spyOn(api, 'createRental').mockRejectedValue(new Error('대여 신청에 실패했습니다'))
    renderWithRoute()

    fireEvent.change(screen.getByPlaceholderText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByPlaceholderText('학번'), { target: { value: '20231234' } })
    fireEvent.change(screen.getByPlaceholderText('연락처'), { target: { value: '010-0000-0000' } })
    fireEvent.change(screen.getByPlaceholderText('대여 사유'), { target: { value: '캡스톤 프로젝트' } })
    fireEvent.click(screen.getByText('신청'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('대여 신청에 실패했습니다')
    })
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL — `./RentalForm` 모듈 없음

- [ ] **Step 3: RentalForm.jsx 작성**

```jsx
// frontend/src/pages/RentalForm.jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createRental } from '../api'

export default function RentalForm() {
  const { equipmentId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    student_name: '',
    student_number: '',
    contact: '',
    reason: '',
  })
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await createRental({ equipment_id: Number(equipmentId), ...form })
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    }
  }

  if (submitted) {
    return (
      <div>
        <p>신청이 접수되었습니다.</p>
        <button onClick={() => navigate('/')}>목록으로</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p role="alert">{error}</p>}
      <input name="student_name" placeholder="이름" value={form.student_name} onChange={handleChange} required />
      <input name="student_number" placeholder="학번" value={form.student_number} onChange={handleChange} required />
      <input name="contact" placeholder="연락처" value={form.contact} onChange={handleChange} required />
      <textarea name="reason" placeholder="대여 사유" value={form.reason} onChange={handleChange} required />
      <button type="submit">신청</button>
    </form>
  )
}
```

`frontend/src/App.jsx`에 라우트 추가:

```jsx
import RentalForm from './pages/RentalForm'
// ...
<Route path="/rentals/new/:equipmentId" element={<RentalForm />} />
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/pages/RentalForm.jsx frontend/src/pages/RentalForm.test.jsx frontend/src/App.jsx
git commit -m "[추가] 대여 신청 폼"
git push
```

---

### Task 4: 조교 대시보드

**Files:**
- Create: `frontend/src/pages/AdminDashboard.jsx`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/pages/AdminDashboard.test.jsx`

**Interfaces:**
- Consumes: `getRentals(status)`, `approveRental(id)`, `rejectRental(id)`, `returnRental(id)` (Task 1)
- Produces: `AdminDashboard` 컴포넌트, `App.jsx`의 `/admin` 라우트 + 네비 링크

- [ ] **Step 1: 실패하는 테스트 작성**

```jsx
// frontend/src/pages/AdminDashboard.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminDashboard from './AdminDashboard'
import * as api from '../api'

describe('AdminDashboard', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('approves a pending rental and refreshes the list', async () => {
    vi.spyOn(api, 'getRentals')
      .mockResolvedValueOnce([
        { id: 1, student_name: '홍길동', student_number: '20231234', status: '신청됨' },
      ])
      .mockResolvedValueOnce([
        { id: 1, student_name: '홍길동', student_number: '20231234', status: '대여중' },
      ])
    vi.spyOn(api, 'approveRental').mockResolvedValue({ id: 1, status: '대여중' })

    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getByText('승인')).toBeInTheDocument())
    fireEvent.click(screen.getByText('승인'))

    await waitFor(() => expect(screen.getByText(/대여중/)).toBeInTheDocument())
    expect(api.approveRental).toHaveBeenCalledWith(1)
  })

  it('shows empty state when there are no rentals', async () => {
    vi.spyOn(api, 'getRentals').mockResolvedValue([])

    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getByText('대여 신청이 없습니다.')).toBeInTheDocument())
  })

  it('shows an error message when loading fails', async () => {
    vi.spyOn(api, 'getRentals').mockRejectedValue(new Error('신청 목록을 불러오지 못했습니다'))

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('신청 목록을 불러오지 못했습니다')
    })
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL — `./AdminDashboard` 모듈 없음

- [ ] **Step 3: AdminDashboard.jsx 작성**

```jsx
// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { getRentals, approveRental, rejectRental, returnRental } from '../api'

export default function AdminDashboard() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function reload() {
    setLoading(true)
    getRentals()
      .then(setRentals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  async function handleAction(action, id) {
    try {
      await action(id)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>불러오는 중...</p>
  if (error) return <p role="alert">{error}</p>
  if (rentals.length === 0) return <p>대여 신청이 없습니다.</p>

  return (
    <ul>
      {rentals.map((r) => (
        <li key={r.id}>
          {r.student_name} ({r.student_number}) — {r.status}
          {r.status === '신청됨' && (
            <>
              <button onClick={() => handleAction(approveRental, r.id)}>승인</button>
              <button onClick={() => handleAction(rejectRental, r.id)}>반려</button>
            </>
          )}
          {r.status === '대여중' && (
            <button onClick={() => handleAction(returnRental, r.id)}>반납 처리</button>
          )}
        </li>
      ))}
    </ul>
  )
}
```

`frontend/src/App.jsx` 최종 형태:

```jsx
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import EquipmentList from './pages/EquipmentList'
import RentalForm from './pages/RentalForm'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">기자재 목록</Link>
        <Link to="/admin">조교 대시보드</Link>
      </nav>
      <Routes>
        <Route path="/" element={<EquipmentList />} />
        <Route path="/rentals/new/:equipmentId" element={<RentalForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: PASS (전체)

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/pages/AdminDashboard.jsx frontend/src/pages/AdminDashboard.test.jsx frontend/src/App.jsx
git commit -m "[추가] 조교 대시보드 (승인/반려/반납)"
git push
```

---

### Task 5: 프로덕션 빌드로 시연 준비 (배포 없음)

**Files:**
- Create: `frontend/.env.example`

**Interfaces:**
- Consumes: 전체 App (Task 1~4), 백엔드의 Tailscale IP (`2026-08-06-backend-api-plan.md` Task 5)
- Produces: 로컬에서 서빙되는 프로덕션 빌드 (`npm run preview`)

- [ ] **Step 1: 빌드 확인**

```bash
cd frontend
npm run build
```
Expected: `dist/` 폴더 생성, 에러 없음. 시연은 `npm run dev`보다 `npm run preview`(빌드된 정적 파일 서빙)가 더 안정적이라 이쪽을 권장한다.

- [ ] **Step 2: .env.example 작성**

```
# frontend/.env.example
# 팀원 컴퓨터에서 로컬로 백엔드를 돌릴 때 그 컴퓨터의 Tailscale IP를 넣는다.
VITE_API_BASE=http://<백엔드 담당자 Tailscale IP>:8000
```

`.env`는 `.gitignore`에 이미 포함되어 있어 커밋되지 않는다. 각자 자기 `.env`에 실제 IP를 넣어 쓴다.

- [ ] **Step 3: 로컬 프로덕션 서버로 확인**

```bash
npm run preview
```

접속해 학과 목록이 실제로 뜨는지 확인 — 로컬 프론트가 백엔드 담당자 컴퓨터의 API와 Tailscale로 통신하는지가 핵심 검증 지점.

- [ ] **Step 4: 커밋**

```bash
git add frontend/.env.example
git commit -m "[설정] 환경변수 예시 (Tailscale 기반, 배포 없음)"
git push
```

- [ ] **Step 5: 시연 당일 체크리스트에 반영**

시연 직전 `npm run build && npm run preview`로 새로 빌드해 최신 코드가 반영됐는지 확인한다. **백업:** Tailscale 연결이 불안정하면 프론트와 백엔드를 한 노트북에 합쳐 `VITE_API_BASE=http://localhost:8000`으로 전환할 수 있게 미리 확인해둔다.
