# Maybe Finance — Frontend Dashboard

A modern, premium personal finance management web application built with **React 19**, **TypeScript**, and **Vite**. Features a sleek dark-mode-first design system inspired by GitHub's dark palette and Linear's information density. Includes interactive charts (Sankey, Line, Bar, Pie), multi-theme support, internationalization, and a fully responsive layout.

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React | 19.0 |
| **Language** | TypeScript | 5.7+ (strict mode) |
| **Build Tool** | Vite | 8.x |
| **Router** | React Router DOM | v6 |
| **Styling** | Tailwind CSS | 3.4 |
| **UI Primitives** | Radix UI | Latest |
| **Component System** | shadcn/ui | Custom |
| **Icons** | Lucide React | Latest |
| **Charts** | Recharts + d3-sankey | 2.15+ |
| **Notifications** | Sonner | 1.7+ |
| **Form Validation** | Zod | 3.24+ |
| **Date Handling** | date-fns | 4.x |

---

## 📂 Project Structure

```
frontend/
├── public/                         # Static assets (favicon, icons, images)
├── src/
│   ├── app/
│   │   └── actions/                # API action modules (server-action-like pattern)
│   │       ├── auth.ts             # Login, register, logout actions
│   │       ├── accounts.ts         # Account CRUD actions
│   │       ├── transactions.ts     # Transaction CRUD actions
│   │       ├── transactions-quick.ts  # Quick-add transaction action
│   │       ├── categories.ts       # Category actions
│   │       ├── budgets.ts          # Budget actions
│   │       ├── ai.ts               # AI scan & insights actions
│   │       └── api-keys.ts         # API key management actions
│   ├── assets/                     # Local images and SVGs
│   ├── components/
│   │   ├── ui/                     # shadcn/ui base primitives
│   │   │   ├── button.tsx          # Button variants (primary, ghost, danger, outline)
│   │   │   ├── card.tsx            # Card container
│   │   │   ├── input.tsx           # Text input
│   │   │   ├── select.tsx          # Select dropdown
│   │   │   ├── dialog.tsx          # Modal dialog
│   │   │   ├── sheet.tsx           # Slide-over panel
│   │   │   ├── dropdown-menu.tsx   # Dropdown menu
│   │   │   ├── tabs.tsx            # Tab navigation
│   │   │   ├── tooltip.tsx         # Tooltip
│   │   │   ├── avatar.tsx          # User avatar
│   │   │   ├── badge.tsx           # Badge/chip
│   │   │   ├── sidebar.tsx         # Sidebar shell (collapsible)
│   │   │   ├── separator.tsx       # Horizontal/vertical divider
│   │   │   ├── collapsible.tsx     # Collapsible section
│   │   │   ├── command.tsx         # Command palette (Cmd+K)
│   │   │   ├── skeleton.tsx        # Skeleton loader primitive
│   │   │   ├── skeleton-loader.tsx # Full skeleton screens (table, cards)
│   │   │   ├── empty-state.tsx     # Empty state placeholder
│   │   │   ├── form-error.tsx      # Inline form error display
│   │   │   ├── label.tsx           # Form label
│   │   │   ├── textarea.tsx        # Textarea input
│   │   │   └── toggle-group.tsx    # Toggle button group
│   │   ├── layout/                 # App shell & navigation
│   │   │   ├── AppLayout.tsx       # Main layout wrapper (sidebar + content)
│   │   │   ├── AppSidebar.tsx      # Sidebar with navigation links
│   │   │   ├── SiteHeader.tsx      # Top header bar
│   │   │   ├── NavUser.tsx         # User profile dropdown
│   │   │   └── MobileBottomNav.tsx # Mobile bottom tab bar
│   │   ├── charts/
│   │   │   └── CashflowSankey.tsx  # Sankey diagram for cash flow visualization
│   │   ├── dashboard/              # Dashboard page widgets
│   │   │   ├── NetWorthHero.tsx    # Net worth hero card with trend
│   │   │   ├── StatCard.tsx        # KPI stat card (income, expenses, savings)
│   │   │   ├── BalanceSheet.tsx    # Assets vs liabilities breakdown
│   │   │   ├── RecentTransactions.tsx  # Latest transactions list
│   │   │   └── OnboardingHero.tsx  # First-time user onboarding card
│   │   ├── accounts/
│   │   │   ├── AccountsClient.tsx  # Accounts list with balance cards
│   │   │   └── AccountForm.tsx     # Add/edit account modal form
│   │   ├── transactions/
│   │   │   ├── TransactionsClient.tsx  # Transaction list with filters, search, sort
│   │   │   ├── TransactionForm.tsx     # Add/edit transaction form
│   │   │   ├── TransactionCalendar.tsx # Calendar view of transactions
│   │   │   ├── ImportCsvModal.tsx      # CSV import dialog
│   │   │   ├── InlineCategoryPicker.tsx # Inline category selector
│   │   │   ├── QuickAddDialog.tsx      # Quick-add transaction dialog
│   │   │   ├── QuickAddFab.tsx         # Floating action button for quick-add
│   │   │   └── QuickAddProvider.tsx    # Context for quick-add state
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Login form with validation
│   │   │   └── RegisterForm.tsx    # Registration form
│   │   ├── budget/
│   │   │   └── BudgetClient.tsx    # Budget tracker with progress bars
│   │   ├── goals/
│   │   │   └── GoalForm.tsx        # Savings goal creation/edit form
│   │   ├── expenses/
│   │   │   └── ExpensesClient.tsx  # Expense analytics with pie chart
│   │   ├── income/
│   │   │   └── IncomeClient.tsx    # Income analytics with bar chart
│   │   ├── recurring/
│   │   │   └── RecurringForm.tsx   # Recurring bill form
│   │   ├── settings/
│   │   │   ├── SettingsClient.tsx  # Settings page (profile, theme, language, data)
│   │   │   └── ApiKeysCard.tsx     # API key management card
│   │   └── command-palette/
│   │       └── CommandPalette.tsx  # Cmd+K command palette
│   ├── hooks/
│   │   ├── use-cached-api.ts       # SWR-like data fetching hook with caching
│   │   └── use-mobile.ts           # Mobile viewport detection hook
│   ├── lib/
│   │   ├── api.ts                  # Centralized HTTP client (fetch wrapper)
│   │   ├── cache.ts                # Client-side cache layer (localStorage + memory)
│   │   ├── contexts/
│   │   │   └── LanguageContext.tsx  # i18n language provider (ID/EN)
│   │   └── utils/
│   │       ├── cn.ts               # clsx + tailwind-merge helper
│   │       ├── constants.ts        # App-wide constants (routes, category colors)
│   │       ├── formatters.ts       # Currency (IDR), date, percentage formatters
│   │       ├── theme.ts            # Theme engine (8 presets, CSS variable injection)
│   │       └── validators.ts       # Zod validation schemas for all forms
│   ├── pages/                      # Route-level page components
│   │   ├── Dashboard.tsx           # Main dashboard overview
│   │   ├── Accounts.tsx            # Accounts list page
│   │   ├── AccountDetail.tsx       # Single account detail + history
│   │   ├── Transactions.tsx        # Transactions page
│   │   ├── Income.tsx              # Income analytics page
│   │   ├── Expenses.tsx            # Expense analytics page
│   │   ├── Budget.tsx              # Budget management page
│   │   ├── Goals.tsx               # Savings goals page
│   │   ├── Investments.tsx         # Investment portfolio page
│   │   ├── Recurring.tsx           # Recurring bills page
│   │   ├── Settings.tsx            # Settings page
│   │   ├── Profile.tsx             # User profile page
│   │   ├── Login.tsx               # Login page
│   │   └── Register.tsx            # Registration page
│   ├── types/
│   │   └── index.ts                # Global TypeScript type definitions
│   ├── App.tsx                     # Router configuration
│   ├── App.css                     # Global app styles
│   ├── index.css                   # Tailwind config + custom CSS utilities
│   └── main.tsx                    # React entry point
├── dist/                           # Production build output
├── Dockerfile                      # Nginx-based Docker image
├── nginx.conf                      # Nginx config for Docker
├── tailwind.config.ts              # Tailwind CSS configuration
├── eslint.config.js                # ESLint rules
├── tsconfig.json                   # TypeScript compiler settings
└── index.html                      # HTML entry template
```

---

## 🎨 Design System

### Color Palette

The app uses a modern dark theme by default with full theme customization:

| Role | Hex | Usage |
|------|-----|-------|
| Canvas (Background) | `#0D1117` | Page background |
| Surface | `#161B22` | Cards, panels, sidebar |
| Elevated Surface | `#1C2128` | Modals, dropdowns, tooltips |
| Borders | `#30363D` | All separators and outlines |
| Primary Text | `#F0F6FC` | Headings, key values |
| Muted Text | `#8B949E` | Labels, captions, secondary text |
| Income/Success | `#2EA043` | Positive amounts, gains |
| Expense/Danger | `#F85149` | Negative amounts, losses |
| Warning | `#D29922` | Pending, informational |
| Accent/Brand | `#388BFD` | CTAs, links, focus rings |

### Typography

**Font Stack:**
- **Sans:** Geist → Inter → system-ui (UI text, labels, headings)
- **Mono:** Geist Mono → JetBrains Mono (all numbers and currencies)

**Critical Rule:** All monetary values use `font-mono tabular-nums` to prevent layout shift during data updates.

```tsx
// Correct — stable number rendering
<span className="font-mono tabular-nums text-text-primary">
  {formatIDR(amount)}
</span>
```

### Custom CSS Utility Classes

Defined in `src/index.css` for consistent styling:

**Regular Text:**
- `.text-regular-primary` — Main text color
- `.text-regular-secondary` — Muted/secondary text

**Monetary Values:**
- `.text-money-primary` — Neutral money values
- `.text-money-secondary` — Past/reference values
- `.text-money-income` — Income/positive amounts (green)
- `.text-money-expense` — Expense/negative amounts (red)
- `.text-money-warning` — Pending/warning amounts (amber)

### Theme Engine

**8 Premium Theme Presets** accessible from **Settings**:

| Dark Themes | Light Themes |
|-------------|-------------|
| Default Dark | Minimalist Light |
| Emerald Depth | Swiss Banking |
| Cyberpunk Neon | Nordic Snow |
| Rosewood Forest | Sakura Blossom |

Themes are persisted in `localStorage` and apply instantly via CSS custom properties. Login/Register pages also inherit the active theme.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** ([Download Node.js](https://nodejs.org/))
- **Backend server running** on port 8080 (see [backend README](../backend/README.md))

### 1. Environment Configuration

Create a `.env` file in the `frontend/` directory (optional):

```env
VITE_API_URL=http://localhost:8080    # Backend API URL
```

> If not set, the frontend auto-detects the backend on `localhost:8080`.

### 2. Install & Run

```bash
cd maybe-finance/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production

```bash
# Type-check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

Output is saved to `dist/`.

### 4. Linting

```bash
npm run lint
```

### 🐳 Docker Deployment

The Dockerfile wraps the static build in a high-performance **Nginx** server:

```bash
# Build image (optionally pass VITE_API_URL)
docker build -t maybe-finance-frontend \
  --build-arg VITE_API_URL=http://localhost:8080 .

# Run container
docker run -d -p 3000:80 --name maybe-frontend maybe-finance-frontend
```

Access at [http://localhost:3000](http://localhost:3000).

---

## 📡 API Integration

The frontend communicates with the backend via a centralized HTTP client in `src/lib/api.ts`:

- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Authentication**: JWT tokens stored in cookies (httpOnly) + Authorization header
- **Error Handling**: Consistent toast notifications via Sonner
- **Caching**: Client-side SWR-like cache with `use-cached-api` hook

### Data Fetching Pattern

```tsx
// Custom hook with automatic caching, revalidation, and loading states
import { useCachedAPI } from "@/hooks/use-cached-api";

function AccountList() {
  const { data, loading, error, mutate } = useCachedAPI<Account[]>(
    "/api/accounts",
    { revalidateOnFocus: true }
  );
  // ...
}
```

### Action Pattern (Server-Action-like)

```tsx
// src/app/actions/transactions.ts
export async function createTransaction(data: TransactionInput) {
  const res = await apiFetch("/api/transactions", { method: "POST", body: data });
  // Cache is automatically invalidated
  return res;
}
```

---

## 🌐 Internationalization (i18n)

The app supports **Indonesian (ID)** and **English (EN)** via `LanguageContext`:

```tsx
import { useLanguage } from "@/lib/contexts/LanguageContext";

function MyComponent() {
  const { t, locale, setLocale } = useLanguage();
  return <h1>{t("dashboard.title")}</h1>;
}
```

Language preference is persisted in `localStorage` and can be changed from **Settings**.

---

## 📊 Data Visualization

### Charts

Powered by **Recharts** with custom color palette:

```ts
const CHART_COLORS = {
  income:     '#2EA043',
  expense:    '#F85149',
  savings:    '#388BFD',
  investment: '#D29922',
  categories: ['#388BFD', '#2EA043', '#D29922', '#F85149', '#A371F7', '#39D353'],
};
```

**Chart Types Used:**
- **Sankey Diagram** — Cash flow visualization (income → categories → expenses)
- **Area/Line Charts** — Trends over time (net worth, monthly cash flow)
- **Bar Charts** — Income vs expense comparison
- **Pie Charts** — Category distribution

**Chart UX Rules:**
- Always zero-baseline on bar/line charts
- Y-axis formatted in abbreviated IDR: `Rp 48,2 jt`
- Tooltips show: value, label, percentage
- All charts are responsive (`ResponsiveContainer`)

---

## 🧩 Key Features

### Dashboard
- Net worth hero card with trend percentage
- Stat cards: total income, expenses, savings rate
- Balance sheet: assets vs liabilities
- Recent transactions widget
- Cash flow Sankey diagram

### Accounts
- Multiple account types: Bank, Wallet, Cash, Investment
- Real-time balance tracking
- Account detail page with transaction history

### Transactions
- Full CRUD with search, filters (date, category, type, account)
- Calendar view
- CSV import/export
- Quick-add floating action button
- Receipt image attachments
- Inline category editing

### Budget
- Monthly spending limits per category
- Visual progress bars with over-budget warnings

### Goals
- Savings goals with target amount and deadline
- Visual progress tracking
- Optional account linking

### Investments
- Portfolio overview with total P&L
- Buy/sell asset tracking
- Symbol, quantity, buy price, current price

### Recurring Bills
- Weekly/monthly/yearly frequency
- Auto-pay toggle with background processing
- Telegram notifications

### Settings
- Profile management (name, currency)
- 8 premium theme presets
- Language switching (ID/EN)
- API key management
- Data export

### Command Palette
- `Cmd+K` / `Ctrl+K` keyboard shortcut
- Quick navigation and actions

---

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Type-check and build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all source files |

---

## 🗂️ Routing Structure

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | User authentication |
| `/register` | Register | New user registration |
| `/` | Dashboard | Main overview page |
| `/accounts` | Accounts | Account list |
| `/accounts/:id` | Account Detail | Single account + history |
| `/transactions` | Transactions | Transaction log |
| `/income` | Income | Income analytics |
| `/expenses` | Expenses | Expense analytics |
| `/budget` | Budget | Budget management |
| `/goals` | Goals | Savings goals |
| `/investments` | Investments | Investment portfolio |
| `/recurring` | Recurring | Recurring bills |
| `/settings` | Settings | App settings |
| `/profile` | Profile | User profile |

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Tailwind theme extension (custom colors, fonts) |
| `tsconfig.json` | TypeScript strict mode, path aliases |
| `eslint.config.js` | ESLint with React + TypeScript rules |
| `vite.config.ts` | Vite build config with React plugin |
| `nginx.conf` | Nginx reverse proxy config for Docker |
| `Dockerfile` | Multi-stage Docker build (build → Nginx) |

---

## 🐛 Troubleshooting

**White screen / blank page:**
- Check browser console for errors
- Ensure backend is running at the configured `VITE_API_URL`
- Clear `localStorage` to reset cached state

**CORS errors:**
- Verify backend `ALLOWED_ORIGIN` includes your frontend URL
- Check that both frontend and backend are on the same network

**Theme not applying:**
- Clear `localStorage` and reload
- Check browser DevTools → Computed CSS variables

---

## 🤝 Related Projects

- **[Backend API](../backend/)** — Go REST API server
- **[Telegram Bot](../../bot-keuangan/)** — Telegram bot for transaction input

---

**Built with React 19, TypeScript, Vite, and Tailwind CSS**
