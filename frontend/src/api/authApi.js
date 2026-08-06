import { request } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function login(studentId, password) {
  if (USE_MOCK) {
    if (!studentId || !password) {
      throw new Error("학번과 비밀번호를 입력해주세요.");
    }
    return {
      token: "mock-token",
      userId: studentId,
      userName: "홍길동",
    };
  }

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
