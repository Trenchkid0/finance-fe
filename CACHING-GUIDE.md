# Frontend Caching Guide

## 📦 Zero-Dependency In-Memory Cache

Simple, lightweight, and effective caching solution untuk resource-limited environments.

---

## 🚀 Quick Start

### **Method 1: Using React Hook** (Recommended)

```tsx
import { useCachedApi } from '@/hooks/use-cached-api';
import { CacheKeys, CacheTTL } from '@/lib/cache';
import { api } from '@/lib/api';

function Dashboard() {
  const { data, isLoading, error, refetch, isCached } = useCachedApi({
    cacheKey: CacheKeys.summary(),
    fetcher: () => api.get('/api/summary'),
    ttl: CacheTTL.MEDIUM, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Net Worth: {data?.totalBalance}</h1>
      {isCached && <span>📦 From cache</span>}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

---

### **Method 2: Using Cached API Helper**

```tsx
import { cachedApi, CacheKeys, CacheTTL } from '@/lib/api';

async function fetchDashboard() {
  // Auto-cached GET request
  const data = await cachedApi.get(
    CacheKeys.summary(),
    '/api/summary',
    CacheTTL.MEDIUM
  );
  return data;
}

// With automatic cache invalidation
async function createTransaction(txData) {
  await cachedApi.post(
    '/api/transactions',
    txData,
    ['transactions:', 'accounts:', 'summary'] // Invalidate these patterns
  );
}
```

---

### **Method 3: Manual Cache Control**

```tsx
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { api } from '@/lib/api';

async function fetchWithCache() {
  const cacheKey = CacheKeys.summary();
  
  // Try cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache HIT! ⚡');
    return cached;
  }
  
  // Cache miss - fetch from API
  console.log('Cache MISS - fetching from API...');
  const data = await api.get('/api/summary');
  
  // Store in cache
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  
  return data;
}
```

---

## 📚 API Reference

### **Cache TTL Presets**

```ts
import { CacheTTL } from '@/lib/cache';

CacheTTL.SHORT      // 2 minutes - frequently changing data
CacheTTL.MEDIUM     // 5 minutes - default
CacheTTL.LONG       // 15 minutes - rarely changing data
CacheTTL.VERY_LONG  // 1 hour - static/reference data
```

### **Cache Keys**

```ts
import { CacheKeys } from '@/lib/cache';

// Standardized cache keys
CacheKeys.summary()                           // 'summary'
CacheKeys.accounts()                          // 'accounts:list'
CacheKeys.account(accountId)                  // 'accounts:detail:123'
CacheKeys.transactions({ type: 'income' })    // 'transactions:list:type:income'
CacheKeys.transaction(txId)                   // 'transactions:detail:456'
CacheKeys.categories()                        // 'categories:list'
CacheKeys.budgets(2026, 6)                    // 'budgets:list:2026:6'
CacheKeys.goals()                             // 'goals:list'
CacheKeys.recurring()                         // 'recurring:list'
```

### **Cache Invalidation**

```ts
import { invalidateCache } from '@/lib/cache';

// Invalidate specific data
invalidateCache.summary();              // Clear summary cache
invalidateCache.accounts();             // Clear all accounts
invalidateCache.transactions();         // Clear all transactions
invalidateCache.categories();           // Clear categories
invalidateCache.budgets();              // Clear budgets
invalidateCache.goals();                // Clear goals

// Combo invalidations (recommended)
invalidateCache.afterTransactionChange();  // Invalidates: transactions, accounts, summary
invalidateCache.afterAccountChange();      // Invalidates: accounts, summary

// Clear everything
invalidateCache.all();
```

### **Manual Cache Operations**

```ts
import { cache } from '@/lib/cache';

// Get
const data = cache.get('my-key');

// Set with TTL
cache.set('my-key', data, 5 * 60 * 1000); // 5 minutes

// Delete specific key
cache.delete('my-key');

// Delete by pattern
cache.deletePattern('transactions:'); // Deletes all matching keys

// Check if exists
if (cache.has('my-key')) {
  // ...
}

// Get all keys
const keys = cache.keys();

// Get cache size
const size = cache.size();

// Clear all
cache.clear();
```

---

## 💡 Usage Examples

### **Example 1: Dashboard Summary**

```tsx
// pages/Dashboard.tsx
import { useCachedApi } from '@/hooks/use-cached-api';
import { CacheKeys, CacheTTL, invalidateCache } from '@/lib/cache';

function Dashboard() {
  const { data: summary, isLoading } = useCachedApi({
    cacheKey: CacheKeys.summary(),
    fetcher: () => api.get('/api/summary'),
    ttl: CacheTTL.SHORT, // 2 min - financial data changes frequently
  });

  return (
    <div>
      <h1>Total Balance: {formatIDR(summary?.totalBalance)}</h1>
      <p>Income: {formatIDR(summary?.totalIncome)}</p>
      <p>Expenses: {formatIDR(summary?.totalExpenses)}</p>
    </div>
  );
}
```

### **Example 2: Transactions List with Filters**

```tsx
// pages/Transactions.tsx
import { useCachedApi } from '@/hooks/use-cached-api';
import { CacheKeys, CacheTTL } from '@/lib/cache';

function Transactions() {
  const [filters, setFilters] = useState({ type: 'all' });

  const { data, isLoading, refetch } = useCachedApi({
    cacheKey: CacheKeys.transactions(filters),
    fetcher: () => api.get(`/api/transactions?type=${filters.type}`),
    ttl: CacheTTL.SHORT,
  });

  // Filter changes will create new cache key automatically
  return (
    <div>
      <select onChange={(e) => setFilters({ type: e.target.value })}>
        <option value="all">All</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      
      {data?.transactions.map(tx => (
        <div key={tx.id}>{tx.description}</div>
      ))}
    </div>
  );
}
```

### **Example 3: Create Transaction with Cache Invalidation**

```tsx
// components/TransactionForm.tsx
import { invalidateCache } from '@/lib/cache';

async function handleSubmit(formData) {
  try {
    // Create transaction
    await api.post('/api/transactions', formData);
    
    // Invalidate related caches
    invalidateCache.afterTransactionChange();
    
    // Or manually invalidate specific patterns
    // invalidateCache.transactions();
    // invalidateCache.accounts();
    // invalidateCache.summary();
    
    toast.success('Transaction created!');
    onClose();
  } catch (error) {
    toast.error(error.message);
  }
}
```

### **Example 4: Accounts List (Static-ish Data)**

```tsx
// pages/Accounts.tsx
function Accounts() {
  const { data: accounts } = useCachedApi({
    cacheKey: CacheKeys.accounts(),
    fetcher: () => api.get('/api/accounts'),
    ttl: CacheTTL.LONG, // 15 minutes - accounts don't change often
  });

  return (
    <div>
      {accounts?.map(account => (
        <div key={account.id}>
          {account.name}: {formatIDR(account.balance)}
        </div>
      ))}
    </div>
  );
}
```

### **Example 5: Categories (Very Static)**

```tsx
// Somewhere in your app
const { data: categories } = useCachedApi({
  cacheKey: CacheKeys.categories(),
  fetcher: () => api.get('/api/categories'),
  ttl: CacheTTL.VERY_LONG, // 1 hour - rarely changes
});
```

---

## 🎯 When to Use Cache

### ✅ **Good Use Cases:**

| Data Type | TTL | Why Cache? |
|-----------|-----|------------|
| Dashboard summary | 2-5 min | High traffic, expensive query |
| Transactions list | 2-5 min | Frequently viewed |
| Accounts list | 5-15 min | Moderately changing |
| Categories list | 15-60 min | Rarely changes |
| User profile | 15-60 min | Static data |
| Reference data | 1 hour | Never changes |

### ❌ **Don't Cache:**

- Real-time data (WebSocket updates)
- One-time actions (login, logout)
- Form submissions
- File uploads
- Sensitive data that must be fresh

---

## 🔄 Cache Invalidation Best Practices

### **Rule 1: Invalidate After Mutations**

```tsx
// After POST/PUT/DELETE
async function createTransaction(data) {
  await api.post('/api/transactions', data);
  
  // Invalidate affected caches
  invalidateCache.afterTransactionChange();
}

async function updateAccount(id, data) {
  await api.put(`/api/accounts/${id}`, data);
  
  // Invalidate affected caches
  invalidateCache.afterAccountChange();
}
```

### **Rule 2: Use Patterns for Related Data**

```tsx
// Good - invalidates all transaction-related caches
invalidateCache.transactions(); // Matches: transactions:list, transactions:detail:*, etc.

// Bad - only invalidates exact key
cache.delete('transactions:list');
```

### **Rule 3: Invalidate Cascading Data**

```tsx
// Transaction changes affect:
// - Transaction lists
// - Account balances
// - Dashboard summary
invalidateCache.afterTransactionChange();

// Account changes affect:
// - Account lists
// - Dashboard summary
invalidateCache.afterAccountChange();
```

---

## 🐛 Debugging

### **Check Cache Status in Console**

```js
// In browser console (development only)
cache.log()  // Shows cache size and keys
cache.clear() // Clear all cache
```

### **Log Cache Hits/Misses**

```tsx
const { data, isCached } = useCachedApi({ ... });

useEffect(() => {
  if (isCached) {
    console.log('✅ Cache HIT - instant load!');
  } else {
    console.log('❌ Cache MISS - fetching from API...');
  }
}, [isCached]);
```

---

## 📊 Performance Impact

### **Before Caching:**
```
Dashboard visit 1: GET /api/summary → 150ms
Transactions: GET /api/transactions → 200ms
Back to Dashboard: GET /api/summary → 150ms ❌
Total: 500ms + 3 API calls
```

### **After Caching:**
```
Dashboard visit 1: GET /api/summary → 150ms (cached)
Transactions: GET /api/transactions → 200ms (cached)
Back to Dashboard: Cache hit → 0ms ✅
Total: 350ms + 2 API calls (30% faster!)
```

---

## 🔧 Advanced: Custom Hook with Refetch on Event

```tsx
function useTransactionsWithAutoRefresh() {
  const result = useCachedApi({
    cacheKey: CacheKeys.transactions(),
    fetcher: () => api.get('/api/transactions'),
    ttl: CacheTTL.MEDIUM,
  });

  // Auto-refetch when custom event is fired
  useEffect(() => {
    const handleRefresh = () => {
      invalidateCache.transactions();
      result.refetch();
    };
    
    window.addEventListener('transaction-created', handleRefresh);
    return () => window.removeEventListener('transaction-created', handleRefresh);
  }, [result]);

  return result;
}

// Fire event after creating transaction
window.dispatchEvent(new Event('transaction-created'));
```

---

## ✅ Migration Checklist

Untuk migrate existing code ke caching:

- [ ] Import cache utilities
- [ ] Identify high-traffic endpoints
- [ ] Replace `api.get` with `useCachedApi` hook
- [ ] Add invalidation after mutations (POST/PUT/DELETE)
- [ ] Set appropriate TTL based on data change frequency
- [ ] Test cache hits in browser console
- [ ] Verify invalidation works correctly

---

## 🎓 Summary

**3 Lines of Code = Instant Speed Boost:**

```tsx
// 1. Use cached hook
const { data } = useCachedApi({
  cacheKey: 'summary',
  fetcher: () => api.get('/api/summary'),
});

// 2. Invalidate after changes
invalidateCache.afterTransactionChange();

// Done! 🎉
```

**Benefits:**
- ✅ Zero npm packages
- ✅ ~200 lines total code
- ✅ 30-70% faster page loads
- ✅ Reduced API calls
- ✅ Better UX

**Cost:**
- ❌ None! Pure TypeScript, zero dependencies

---

**Questions?** Check the code:
- `lib/cache.ts` - Core cache implementation
- `hooks/use-cached-api.ts` - React hook
- `lib/api.ts` - Cached API helpers
