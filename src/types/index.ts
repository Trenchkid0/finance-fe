/**
 * Global type definitions.
 * AGENTS.md §6.
 *
 * All shared domain types live here. Import from this file
 * instead of re-declaring in individual components.
 */

// --- Pagination & Action Results -----------------------------------------

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// --- Domain Types (shared across the app) --------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Account {
  id: string;
  name: string;
  type: "bank" | "wallet" | "cash" | "investment";
  balance: number;
  isActive: boolean;
  transactionCount?: number;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  isDefault?: boolean;
}

// --- API Response Types --------------------------------------------------

/** Shape returned by `GET /api/transactions` */
export interface TransactionsApiResponse {
  transactions: TransactionApiItem[];
  total: number;
  income: number;
  expense: number;
}

export interface TransactionApiItem {
  id: number;
  type: "income" | "expense" | "transfer";
  accountId: string;
  account?: { id: string; name: string };
  categoryId: string | null;
  category?: { id: string; name: string; icon: string | null } | null;
  transferToId: string | null;
  transferTo?: { id: string; name: string } | null;
  amount: number;
  date: string;
  description: string | null;
  note: string | null;
  receiptImageUrl: string | null;
}

/** Shape returned by `GET /api/budgets` */
export interface BudgetApiItem {
  id: string;
  categoryId: string;
  limit: number;
}

/** Shape returned by `GET /api/investments` */
export interface AssetHolding {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  account?: { id: string; name: string; type: string };
  createdAt: string;
}

/** Shape returned by `GET /api/summary` */
export interface SummaryApiResponse {
  netWorthCurrent: number;
  netWorthPrevious: number;
  netWorthSeries: { date: string; value: number }[];
  cashflow: {
    inflow: { amount: number; name: string; color?: string }[];
    outflow: { amount: number; name: string; color?: string }[];
    total: number;
    surplus: number;
  };
  recent: TransactionApiItem[];
}

/** Shape returned by `GET /api/api-keys` */
export interface ApiKeyValue {
  id: string;
  name: string;
  keyPrefix: string;
  plainKey?: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

/** Shape returned by `POST /api/ai/scan` */
export interface AIScanApiRes {
  ok: boolean;
  error?: string;
  candidate?: {
    type: "income" | "expense" | "transfer";
    amount: number;
    date: string | null;
    description: string | null;
    note: string | null;
    accountId: string | null;
    transferToId: string | null;
    categoryId: string | null;
    confidence: number;
    reasoning: string | null;
  };
}

/** Valid time period for charts/filters */
export type Period = "1d" | "7d" | "30d" | "90d" | "ytd" | "365d" | "5y";

/** Asset group for dashboard display */
export interface AssetGroupAccount {
  id: string;
  name: string;
  value: number;
  percent: number;
  initial: string;
}

export interface AssetGroup {
  name: string;
  color: string;
  total: number;
  percent: number;
  accounts: AssetGroupAccount[];
}

// --- Error Utility ----------------------------------------------------------

/** Safely extract a message string from an unknown error value. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  return fallback;
}
