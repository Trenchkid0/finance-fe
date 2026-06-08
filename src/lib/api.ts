const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (url) {
    // Auto-prepend protocol if missing (e.g. "localhost:8081" -> "http://localhost:8081")
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }
    console.log('Using VITE_API_URL:', url);
    return url;
  }
  // Dynamic fallback: matches the accessing device's IP (e.g. 192.168.18.5) on port 8081
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const fallbackUrl = `${protocol}//${host}:8081`;
  console.log('Using fallback API URL:', fallbackUrl);
  return fallbackUrl;
};

const API_BASE_URL = getApiBaseUrl();
console.log('Final API_BASE_URL:', API_BASE_URL);


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
  delete: <T>(path: string, body?: any, headers?: HeadersInit) => request<T>("DELETE", path, body, headers),
};

/**
 * Cached API helpers
 * Automatically handles caching for GET requests
 */
import { cache, CacheKeys, CacheTTL, invalidateCache } from './cache';

export const cachedApi = {
  /**
   * Get with automatic caching
   * @param cacheKey - Cache key
   * @param path - API path
   * @param ttl - Cache TTL (default: 5 minutes)
   */
  async get<T>(cacheKey: string, path: string, ttl: number = CacheTTL.MEDIUM): Promise<T> {
    // Try cache first
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch from API
    const data = await api.get<T>(path);
    
    // Store in cache
    cache.set(cacheKey, data, ttl);
    
    return data;
  },

  /**
   * POST with automatic cache invalidation
   */
  async post<T>(path: string, body: any, invalidatePatterns: string[] = []): Promise<T> {
    const result = await api.post<T>(path, body);
    
    // Invalidate related caches
    invalidatePatterns.forEach(pattern => cache.deletePattern(pattern));
    
    return result;
  },

  /**
   * PUT with automatic cache invalidation
   */
  async put<T>(path: string, body: any, invalidatePatterns: string[] = []): Promise<T> {
    const result = await api.put<T>(path, body);
    
    // Invalidate related caches
    invalidatePatterns.forEach(pattern => cache.deletePattern(pattern));
    
    return result;
  },

  /**
   * DELETE with automatic cache invalidation
   */
  async delete<T>(path: string, invalidatePatterns: string[] = []): Promise<T> {
    const result = await api.delete<T>(path);
    
    // Invalidate related caches
    invalidatePatterns.forEach(pattern => cache.deletePattern(pattern));
    
    return result;
  },
};

// Export cache utilities for manual usage
export { cache, CacheKeys, CacheTTL, invalidateCache };
