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
    const errText =
      typeof detail === "string"
        ? detail
        : `API request failed: ${response.status} ${response.statusText}`;
    const err = new Error(errText);
    err.status = response.status;

    // A 401 on a request that carried a token means the session (JWT) has
    // expired or been invalidated server-side, not that this one request's
    // credentials were wrong (that's what /auth/login's 401 means, and it
    // never sends a token). Clear the stale session so the UI stops
    // pretending to be logged in.
    if (response.status === 401 && token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new Event("auth:expired"));
    }

    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
