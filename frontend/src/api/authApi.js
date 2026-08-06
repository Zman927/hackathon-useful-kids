import { request } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function login(studentId, password) {
  if (USE_MOCK) {
    if (!studentId || !password) {
      throw new Error("학번과 비밀번호를 입력해주세요.");
    }
    const lowerId = studentId.toLowerCase();
    const isTA =
      lowerId.includes("admin") ||
      lowerId.includes("ta") ||
      studentId === "99999999";

    return {
      token: "mock-token",
      userId: studentId,
      userName: isTA ? "김조교 (조교)" : "홍길동",
      role: isTA ? "admin" : "student",
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
    role: data.role ?? "student",
  };
}
