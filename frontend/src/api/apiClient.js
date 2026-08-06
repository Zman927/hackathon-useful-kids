export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const AUTH_STORAGE_KEY = "auth_user";

function getAuthToken() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored).token ?? null;
  } catch {
    return null;
  }
}

export async function request(path, options = {}) {
  const token = getAuthToken();
  const { headers: customHeaders, body, ...restOptions } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    body,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders,
    },
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .then((data) => data.detail)
      .catch(() => null);
    throw new Error(detail || `API request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
