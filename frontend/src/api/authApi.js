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
