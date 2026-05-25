const base =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? ""
    : process.env.NEXT_PUBLIC_API_URL ?? "";

export function getApiBaseUrl(): string {
  return base.replace(/\/$/, "");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }

    let errorMessage = `API ${res.status}: ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Falldown para texto genérico se a resposta não for JSON
    }
    throw new Error(errorMessage);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
