const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}