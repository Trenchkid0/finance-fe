/**
 * User Preferences Service
 *
 * Manages user UI/UX preferences with:
 * 1. Database as the source of truth (fetched on login/app init)
 * 2. localStorage as a fast local cache
 * 3. Optimistic updates — write to localStorage immediately, sync to backend in background
 * 4. Debounced saves to avoid hammering the API during rapid changes (e.g. color picker)
 */

import { api } from "@/lib/api";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";
import {
  applyTheme,
  applyFont,
  applyCardStyles,
  applyButtonStyles,
  applyTypographyStyles,
  type CardStyles,
  type ButtonStyles,
  type TypographyStyles,
} from "@/lib/utils/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationSettings {
  position: string;
  theme: string;
  duration: number;
  expand: boolean;
}

export type DashboardLayout = "default" | "analytics" | "compact" | "hero";

export interface UserPreferences {
  themeId: string;
  customThemeVars: Record<string, string>;
  fontId: string;
  cardStyles: CardStyles;
  buttonStyles: ButtonStyles;
  typographyStyles: TypographyStyles;
  notificationSettings: NotificationSettings;
  language: string;
  dashboardLayout: DashboardLayout;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  themeId: "github-dark",
  customThemeVars: {},
  fontId: "jakarta",
  cardStyles: {
    radius: "16px",
    borderWidth: "1px",
    blur: "12px",
    opacity: "0.75",
    dropdownRadius: "9999px",
    cardType: "default",
  },
  buttonStyles: {
    radius: "12px",
    size: "default",
    weight: "semibold",
  },
  typographyStyles: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  notificationSettings: {
    position: "top-right",
    theme: "dark",
    duration: 4000,
    expand: false,
  },
  language: "id",
  dashboardLayout: "default",
};

// ─── Local Storage Keys (match existing keys used by theme.ts / LanguageContext)

const LS_KEYS = {
  themeId: "racks-theme-id",
  customThemeVars: "racks-custom-theme-vars",
  fontId: "racks-font-family",
  cardStyles: "racks-card-styles",
  buttonStyles: "racks-button-styles",
  typographyStyles: "racks-typography-styles",
  notificationSettings: "racks-notification-settings",
  language: "app-language",
  dashboardLayout: "racks-dashboard-layout",
} as const;

// ─── Local Storage Helpers ────────────────────────────────────────────────────

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

/** Read all preferences from localStorage (used as fallback when API is unavailable). */
function readFromLocalStorage(): UserPreferences {
  return {
    themeId: localStorage.getItem(LS_KEYS.themeId) || DEFAULT_PREFERENCES.themeId,
    customThemeVars: safeParseJSON<Record<string, string>>(
      localStorage.getItem(LS_KEYS.customThemeVars),
      {}
    ),
    fontId: localStorage.getItem(LS_KEYS.fontId) || DEFAULT_PREFERENCES.fontId,
    cardStyles: safeParseJSON<CardStyles>(
      localStorage.getItem(LS_KEYS.cardStyles),
      DEFAULT_PREFERENCES.cardStyles
    ),
    buttonStyles: safeParseJSON<ButtonStyles>(
      localStorage.getItem(LS_KEYS.buttonStyles),
      DEFAULT_PREFERENCES.buttonStyles
    ),
    typographyStyles: safeParseJSON<TypographyStyles>(
      localStorage.getItem(LS_KEYS.typographyStyles),
      DEFAULT_PREFERENCES.typographyStyles
    ),
    notificationSettings: safeParseJSON<NotificationSettings>(
      localStorage.getItem(LS_KEYS.notificationSettings),
      DEFAULT_PREFERENCES.notificationSettings
    ),
    language: localStorage.getItem(LS_KEYS.language) || DEFAULT_PREFERENCES.language,
    dashboardLayout: (localStorage.getItem(LS_KEYS.dashboardLayout) || DEFAULT_PREFERENCES.dashboardLayout) as DashboardLayout,
  };
}

/** Write all preferences to localStorage. */
function writeToLocalStorage(prefs: UserPreferences): void {
  localStorage.setItem(LS_KEYS.themeId, prefs.themeId);
  if (Object.keys(prefs.customThemeVars).length > 0) {
    localStorage.setItem(LS_KEYS.customThemeVars, JSON.stringify(prefs.customThemeVars));
  } else {
    localStorage.removeItem(LS_KEYS.customThemeVars);
  }
  localStorage.setItem(LS_KEYS.fontId, prefs.fontId);
  localStorage.setItem(LS_KEYS.cardStyles, JSON.stringify(prefs.cardStyles));
  localStorage.setItem(LS_KEYS.buttonStyles, JSON.stringify(prefs.buttonStyles));
  localStorage.setItem(LS_KEYS.typographyStyles, JSON.stringify(prefs.typographyStyles));
  localStorage.setItem(LS_KEYS.notificationSettings, JSON.stringify(prefs.notificationSettings));
  localStorage.setItem(LS_KEYS.language, prefs.language);
  localStorage.setItem(LS_KEYS.dashboardLayout, prefs.dashboardLayout);
}

// ─── Apply to UI ──────────────────────────────────────────────────────────────

/** Apply all preferences to the DOM (CSS variables, classes, etc.). */
export function applyPreferences(prefs: UserPreferences): void {
  applyTheme(prefs.themeId, prefs.customThemeVars);
  applyFont(prefs.fontId);
  applyCardStyles(prefs.cardStyles);
  applyButtonStyles(prefs.buttonStyles);
  applyTypographyStyles(prefs.typographyStyles);
  // Notify about notification settings change (for Toaster in App.tsx)
  window.dispatchEvent(new Event("notification-settings-changed"));
  // Notify components that depend on preferences (e.g. Dashboard layout)
  window.dispatchEvent(new Event("preferences-changed"));
}

// ─── In-memory state ──────────────────────────────────────────────────────────

let _currentPrefs: UserPreferences | null = null;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _isAuthenticated = false;

/** Returns the current in-memory preferences (or defaults if not loaded yet). */
export function getCurrentPreferences(): UserPreferences {
  return _currentPrefs ?? { ...DEFAULT_PREFERENCES };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load preferences from the backend and apply them.
 * Called once after login / on app init.
 * Falls back to localStorage if the API call fails.
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const cachedRaw = cache.get<UserPreferences>(CacheKeys.preferences());
    if (cachedRaw) {
      const cached = { ...DEFAULT_PREFERENCES, ...cachedRaw };
      _currentPrefs = cached;
      applyPreferences(cached);
      writeToLocalStorage(cached);
      return cached;
    }

    const prefs = { ...DEFAULT_PREFERENCES, ...(await api.get<UserPreferences>("/api/preferences")) };
    _currentPrefs = prefs;
    _isAuthenticated = true;

    // Cache for 15 minutes (preferences rarely change)
    cache.set(CacheKeys.preferences(), prefs, CacheTTL.LONG);

    // Write to localStorage + apply to DOM
    writeToLocalStorage(prefs);
    applyPreferences(prefs);

    return prefs;
  } catch {
    // API failed (offline, not logged in, etc.) — fall back to localStorage
    const fallback = readFromLocalStorage();
    _currentPrefs = fallback;
    applyPreferences(fallback);
    return fallback;
  }
}

/**
 * Save preferences optimistically:
 * 1. Write to localStorage + apply to DOM immediately
 * 2. Debounce the backend PUT (500ms) to batch rapid changes
 */
export function savePreferences(prefs: UserPreferences): void {
  _currentPrefs = prefs;

  // Optimistic: write to localStorage + apply immediately
  writeToLocalStorage(prefs);
  applyPreferences(prefs);

  // Invalidate local cache
  cache.delete(CacheKeys.preferences());

  // Debounce the API call (500ms)
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    _performSave(prefs);
  }, 500);
}

/**
 * Force-save preferences immediately (no debounce).
 * Use for explicit "Save" button clicks.
 */
export async function savePreferencesNow(prefs: UserPreferences): Promise<void> {
  _currentPrefs = prefs;
  writeToLocalStorage(prefs);
  applyPreferences(prefs);
  cache.delete(CacheKeys.preferences());

  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }

  await _performSave(prefs);
}

/**
 * Update a single preference field and save.
 * Convenience wrapper around savePreferences.
 */
export function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  const current = getCurrentPreferences();
  savePreferences({ ...current, [key]: value });
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function _performSave(prefs: UserPreferences): Promise<void> {
  if (!_isAuthenticated) return;

  try {
    const result = await api.put<UserPreferences>("/api/preferences", prefs);
    // Merge: defaults → API response → locally-set fields (preserves new fields backend doesn't echo)
    const merged = { ...DEFAULT_PREFERENCES, ...result, ...prefs };
    cache.set(CacheKeys.preferences(), merged, CacheTTL.LONG);
    _currentPrefs = merged;
  } catch (err) {
    console.error("[preferences] Failed to sync preferences to backend:", err);
    // Silent fail — localStorage already has the data, will retry on next change
  }
}

/**
 * Mark the user as authenticated (called after successful login).
 * This enables backend sync on savePreferences calls.
 */
export function setPreferencesAuthenticated(authenticated: boolean): void {
  _isAuthenticated = authenticated;
}
