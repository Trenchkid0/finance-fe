/**
 * Simple In-Memory Cache for API responses
 * Zero dependencies, lightweight, and effective
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private listeners = new Set<() => void>();

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache with TTL (Time To Live)
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });

    // Notify listeners (for React re-renders)
    this.notifyListeners();
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.notifyListeners();
  }

  /**
   * Delete all cache entries matching a pattern
   * @param pattern - String to match in cache keys
   */
  deletePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    this.notifyListeners();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.notifyListeners();
  }

  /**
   * Get all cached keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Subscribe to cache changes (for React hooks)
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Clean up expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new SimpleCache();

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Cache TTL presets (in milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - default
  LONG: 15 * 60 * 1000,      // 15 minutes - for rarely changing data
  VERY_LONG: 60 * 60 * 1000, // 1 hour - for static/reference data
} as const;

// Cache key builders (standardized naming)
export const CacheKeys = {
  summary: () => 'summary',
  accounts: () => 'accounts:list',
  account: (id: string) => `accounts:detail:${id}`,
  transactions: (filters?: Record<string, string>) => {
    let key = 'transactions:list';
    if (filters) {
      if (filters.type) key += `:type:${filters.type}`;
      if (filters.accountId) key += `:account:${filters.accountId}`;
      if (filters.categoryId) key += `:category:${filters.categoryId}`;
    }
    return key;
  },
  transaction: (id: string) => `transactions:detail:${id}`,
  categories: () => 'categories:list',
  budgets: (year?: number, month?: number) => {
    let key = 'budgets:list';
    if (year) key += `:${year}`;
    if (month) key += `:${month}`;
    return key;
  },
  goals: () => 'goals:list',
  recurring: () => 'recurring:list',
} as const;

// Invalidation helpers
export const invalidateCache = {
  /** Invalidate all cache */
  all: () => cache.clear(),
  
  /** Invalidate dashboard/summary data */
  summary: () => cache.delete(CacheKeys.summary()),
  
  /** Invalidate all accounts */
  accounts: () => cache.deletePattern('accounts:'),
  
  /** Invalidate all transactions */
  transactions: () => cache.deletePattern('transactions:'),
  
  /** Invalidate categories */
  categories: () => cache.delete(CacheKeys.categories()),
  
  /** Invalidate budgets */
  budgets: () => cache.deletePattern('budgets:'),
  
  /** Invalidate goals */
  goals: () => cache.delete(CacheKeys.goals()),
  
  /** Invalidate recurring */
  recurring: () => cache.delete(CacheKeys.recurring()),
  
  /** 
   * Invalidate after transaction changes 
   * (affects: transactions, accounts, summary)
   */
  afterTransactionChange: () => {
    invalidateCache.transactions();
    invalidateCache.accounts();
    invalidateCache.summary();
  },
  
  /** 
   * Invalidate after account changes 
   * (affects: accounts, summary)
   */
  afterAccountChange: () => {
    invalidateCache.accounts();
    invalidateCache.summary();
  },
} as const;

// Debug helper (development only)
export const cacheDebug = {
  log: () => {
    console.group('🗄️ Cache Status');
    console.log('Size:', cache.size());
    console.log('Keys:', cache.keys());
    console.groupEnd();
  },
  clear: () => {
    cache.clear();
    console.log('✅ Cache cleared');
  },
};

// Expose to window for debugging (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).cache = cacheDebug;
}
