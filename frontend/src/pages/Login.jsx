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
