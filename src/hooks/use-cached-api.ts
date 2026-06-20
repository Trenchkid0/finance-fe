import { useEffect, useState, useCallback, useRef } from 'react';
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
  /** Loading state (true only when no data available at all) */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch (bypass cache) */
  refetch: () => Promise<void>;
  /** Check if data is from cache */
  isCached: boolean;
  /** True when stale data is shown and a background revalidation is in flight */
  isStale: boolean;
  /** True while a background revalidation fetch is in progress */
  isValidating: boolean;
}

// ── In-flight request deduplication ────────────────────────────────────────
const inflightRequests = new Map<string, Promise<unknown>>();

/**
 * React hook for cached API calls with SWR (Stale-While-Revalidate) pattern.
 *
 * On mount the hook immediately returns stale cached data (if any) while
 * triggering a background revalidation. This means the user always sees
 * something instantly, and fresh data replaces it as soon as the fetch resolves.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isStale, isValidating, refetch } = useCachedApi({
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
  // Initialise from stale cache so we can show data instantly
  const [data, setData] = useState<T | null>(() => {
    if (skipCache) return null;
    const stale = cache.getStale<T>(cacheKey);
    return stale ? stale.data : null;
  });

  const initialStale = (() => {
    if (skipCache) return false;
    const stale = cache.getStale<T>(cacheKey);
    return stale ? stale.isStale : false;
  })();

  const [isLoading, setIsLoading] = useState<boolean>(!data && refetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState<boolean>(!!data && !initialStale);
  const [isStale, setIsStale] = useState<boolean>(initialStale);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Track mounted state to avoid setState on unmounted component
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (force = false) => {
    // Check fresh cache first (unless forced or skipCache)
    if (!force && !skipCache) {
      const cached = cache.get<T>(cacheKey);
      if (cached) {
        setData(cached);
        setIsCached(true);
        setIsStale(false);
        setIsLoading(false);
        setIsValidating(false);
        return;
      }
    }

    // If we already have data (stale), don't show loading spinner
    const hasExistingData = !!data;
    if (!hasExistingData) {
      setIsLoading(true);
    }

    // Show revalidation indicator when we have stale data
    if (hasExistingData) {
      setIsValidating(true);
    }

    setIsCached(false);
    setError(null);

    try {
      // Deduplicate: if an identical request is already in-flight, await it
      let requestPromise: Promise<T>;
      const inflight = inflightRequests.get(cacheKey) as Promise<T> | undefined;
      if (inflight && !force) {
        requestPromise = inflight;
      } else {
        requestPromise = fetcher();
        if (!force) {
          inflightRequests.set(cacheKey, requestPromise);
          requestPromise.finally(() => {
            inflightRequests.delete(cacheKey);
          });
        }
      }

      const result = await requestPromise;

      if (!mountedRef.current) return;

      // Store in cache
      if (!skipCache) {
        cache.set(cacheKey, result, ttl);
      }

      setData(result);
      setIsCached(true);
      setIsStale(false);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      const error = err instanceof Error ? err : new Error('Failed to fetch');
      setError(error);
      console.error(`[useCachedApi] Error fetching ${cacheKey}:`, error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [cacheKey, fetcher, ttl, skipCache, data]);

  // Refetch function (bypass cache)
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch on mount — triggers SWR when stale data is available
  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, refetchOnMount]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isCached,
    isStale,
    isValidating,
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
