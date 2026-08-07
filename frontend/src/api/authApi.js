import { request } from "./apiClient";

const AUTH_STORAGE_KEY = "auth_user";

export async function login(studentId, password) {
  if (!studentId || !password) {
    throw new Error("학번과 비밀번호를 입력해주세요.");
  }

  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, password }),
  });

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ token: data.access_token }),
  );

  const me = await request("/auth/me");

  return {
    token: data.access_token,
    userId: data.user_id,
    userName: me.name ?? data.user_name,
    role: data.role,
    departmentName: me.department,
  };
}
