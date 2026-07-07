const API_BASE_URL = import.meta.env.https://skillcanvas-1-bb20.onrender.com || "http://localhost:4000";

async function parseError(res: Response): Promise<never> {
  let detail = `${res.status} ${res.statusText}`;
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) detail = `${res.status}: ${data.error}`;
  } catch {
    // ignore json parse errors
  }
  throw new Error(`API ${detail}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) return parseError(res);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) return parseError(res);
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) return parseError(res);
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) return parseError(res);
  return res.json() as Promise<T>;
}
