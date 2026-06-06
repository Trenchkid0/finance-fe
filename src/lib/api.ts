const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function request<T>(
  method: string,
  path: string,
  body?: any,
  customHeaders: HeadersInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(customHeaders);
  if (body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include", // Essential for cookie-based authentication
  };

  if (body) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMessage = errJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 or logout)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  // Handle CSV/text downloads
  if (contentType && contentType.includes("text/csv")) {
    const text = await response.text();
    return text as unknown as T;
  }

  return response.text() as unknown as Promise<T>;
}

export const api = {
  get: <T>(path: string, headers?: HeadersInit) => request<T>("GET", path, undefined, headers),
  post: <T>(path: string, body: any, headers?: HeadersInit) => request<T>("POST", path, body, headers),
  put: <T>(path: string, body: any, headers?: HeadersInit) => request<T>("PUT", path, body, headers),
  delete: <T>(path: string, headers?: HeadersInit) => request<T>("DELETE", path, undefined, headers),
};
