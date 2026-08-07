import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginRequest } from "../api/authApi";

function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const userData = await loginRequest(studentId, password);
      login(userData);
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (err) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-surface-container-lowest md:flex-row">
      <div className="flex w-full flex-col items-center justify-center bg-primary-container p-xl text-on-primary md:w-1/2">
        <div className="mb-lg flex h-24 w-24 items-center justify-center rounded-xl bg-white/10">
          <span className="material-symbols-outlined text-5xl">build</span>
        </div>
        <h1 className="mb-sm text-headline-lg font-headline-lg">
          MJC 기자재 대여 시스템
        </h1>
        <p className="text-body-md font-body-md opacity-90">
          대학 구성원을 위한 통합 대여 서비스
        </p>
      </div>
      <div className="flex w-full items-center justify-center bg-surface-container-lowest p-xl md:w-1/2">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-[360px] flex-col gap-md"
        >
          <h2 className="mb-sm text-headline-md font-headline-md text-on-surface">
            로그인
          </h2>
          <div className="flex w-full flex-col gap-sm">
            <label
              className="text-label-lg font-label-lg text-on-surface"
              htmlFor="student_id"
            >
              아이디
            </label>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">
                badge
              </span>
              <input
                id="student_id"
                name="student_id"
                type="text"
                required
                placeholder="아이디를 입력하세요"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                className="h-12 w-full rounded border border-outline-variant bg-surface-container-lowest pr-sm pl-[40px] text-body-md font-body-md text-on-surface transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed focus:outline-none"
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-sm">
            <label
              className="text-label-lg font-label-lg text-on-surface"
              htmlFor="password"
            >
              비밀번호
            </label>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">
                lock
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded border border-outline-variant bg-surface-container-lowest pr-sm pl-[40px] text-body-md font-body-md text-on-surface transition-all focus:border-primary focus:ring-2 focus:ring-primary-fixed focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-sm flex h-12 w-full items-center justify-center gap-xs rounded bg-primary-container text-label-lg font-label-lg text-on-primary transition-colors duration-200 hover:bg-primary cursor-pointer"
          >
            로그인
          </button>
          {error && (
            <p className="text-label-sm font-label-sm text-error">{error}</p>
          )}
        </form>
      </div>
    </main>
  );
}

export default Login;
