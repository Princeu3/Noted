const API_URL = import.meta.env.VITE_API_URL || "";

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    const err = new Error(error || res.statusText);
    (err as any).status = res.status;
    throw err;
  }

  return res.json();
}
