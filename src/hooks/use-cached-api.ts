import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { cache, CacheTTL } from '@/lib/cache';

interface UseCachedApiOptions<T> {
  /** Cache key - should be unique per endpoint/params */
  cacheKey: string;
  /** API fetcher function */
  fetcher: () => Promise<T>;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Disable cache and always fetch fresh (default: false) */
  skipCache?: boolean;
  /** Auto-refetch on mount if cache is empty (default: true) */
  refetchOnMount?: boolean;
}

interface UseCachedApiReturn<T> {
  /** The cached/fetched data */
  data: T | null;
  /** Loading state */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch (bypass cache) */
  refetch: () => Promise<void>;
  /** Check if data is from cache */
  isCached: boolean;
}

/**
 * React hook for cached API calls
 * 
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useCachedApi({
 *   cacheKey: 'summary',
 *   fetcher: () => api.get('/api/summary'),
 *   ttl: CacheTTL.MEDIUM,
 * });
 * ```
 */
export function useCachedApi<T>({
  cacheKey,
  fetcher,
  ttl = CacheTTL.MEDIUM,
  skipCache = false,
  refetchOnMount = true,
}: UseCachedApiOptions<T>): UseCachedApiReturn<T> {
  const [data, setData] = useState<T | null>(() => {
    if (skipCache) return null;
    return cache.get<T>(cacheKey);
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(!data && refetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState<boolean>(!!data);

  // Subscribe to cache changes for this key
  const cacheSnapshot = useSyncExternalStore(
    cache.subscribe.bind(cache),
    () => cache.get<T>(cacheKey),
    () => null
  );

  const fetchData = useCallback(async (force = false) => {
    // Check cache first (unless forced or skipCache)
    if (!force && !skipCache) {
      const cached = cache.get<T>(cacheKey);
      if (cached) {
        setData(cached);
        setIsCached(true);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setIsCached(false);
    setError(null);

    try {
      const result = await fetcher();
      
      // Store in cache
      if (!skipCache) {
        cache.set(cacheKey, result, ttl);
      }
      
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch');
      setError(error);
      console.error(`[useCachedApi] Error fetching ${cacheKey}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetcher, ttl, skipCache]);

  // Refetch function (bypass cache)
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  // Update data when cache changes externally
  useEffect(() => {
    if (cacheSnapshot !== null && cacheSnapshot !== undefined) {
      setData(cacheSnapshot);
      setIsCached(true);
    }
  }, [cacheSnapshot]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isCached,
  };
}

/**
 * Simpler hook for one-time cached fetch (no auto-refetch)
 * Good for static/reference data
 */
export function useCachedData<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl?: number
) {
  return useCachedApi({
    cacheKey,
    fetcher,
    ttl,
    refetchOnMount: false,
  });
}
