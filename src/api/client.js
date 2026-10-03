import { API_BASE_URL } from "../config";

export async function apiRequest(path, { token, method = "GET", body, formData } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!formData) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData ? body : body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}`);
  }

  return payload;
}

export function unwrap(payload) {
  return payload?.data || payload || {};
}

export function getToken(payload) {
  return payload?.token || payload?.access_token || payload?.data?.token || payload?.data?.access_token;
}
