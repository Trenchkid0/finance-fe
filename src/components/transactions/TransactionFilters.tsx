import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTransition, useRef } from "react";
import { Search, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomDateRangePicker, formatFriendlyDate } from "./CustomDateRangePicker";
import { FilterSelect } from "./FilterSelect";
import type { AccountOption, CategoryOption } from "./TransactionForm";
import type { TransactionFiltersState } from "./TransactionsClient";

export function isFilterActive(f: TransactionFiltersState): boolean {
  return (
    f.q.length > 0 ||
    f.type !== "all" ||
    f.accountId !== "all" ||
    f.categoryId !== "all" ||
    f.startDate !== "" ||
    f.endDate !== ""
  );
}

export function withParams(
  current: URLSearchParams,
  patch: Record<string, string | null | undefined>,
): string {
  const next = new URLSearchParams(current);
  let changedNonPage = false;

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "" || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== "page" && key !== "pageSize") changedNonPage = true;
  }
  // Reset page when filter changes unless caller explicitly set page.
  if (changedNonPage && !("page" in patch)) {
    next.delete("page");
  }
  return next.toString();
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function TransactionFilters({
  filters,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);

  function pushFilter(patch: Record<string, string | null | undefined>) {
    const fd = formRef.current ? new FormData(formRef.current) : null;
    const currentQ = fd ? (fd.get("q") as string) : filters.q;
    const currentStart = fd ? (fd.get("startDate") as string) : filters.startDate;
    const currentEnd = fd ? (fd.get("endDate") as string) : filters.endDate;

    const mergedPatch = {
      q: currentQ || null,
      startDate: currentStart || null,
      endDate: currentEnd || null,
      ...patch,
    };

    const qs = withParams(searchParams, mergedPatch);
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  const active = isFilterActive(filters);

  return (
    <Card className="p-0 overflow-visible">
      <form
        ref={formRef}
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          pushFilter({
            q: (fd.get("q") as string) ?? "",
            startDate: (fd.get("startDate") as string) || null,
            endDate: (fd.get("endDate") as string) || null,
          });
        }}
        className="flex flex-col gap-4 p-5 overflow-visible"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              name="q"
              defaultValue={filters.q}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              aria-label={t("searchPlaceholder")}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:flex lg:items-center lg:gap-3">
            <FilterSelect
              label="Tipe"
              value={filters.type}
              onChange={(v) => pushFilter({ type: v })}
              options={[
                { value: "all", label: t("allTypes") },
                { value: "income", label: t("incomeLabel") },
                { value: "expense", label: t("expenseLabel") },
                { value: "transfer", label: t("transferLabel") },
              ]}
            />
            <FilterSelect
              label="Akun"
              value={filters.accountId}
              onChange={(v) => pushFilter({ accountId: v })}
              options={[
                { value: "all", label: t("allAccounts") },
                ...accounts.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
            <FilterSelect
              label="Kategori"
              value={filters.categoryId}
              onChange={(v) => pushFilter({ categoryId: v })}
              options={[
                { value: "all", label: t("allCategories") },
                { value: "none", label: t("noCategory") },
                ...categories.map((c) => ({
                  value: c.id,
                  label: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
                })),
              ]}
            />                  
          </div>
        </div>

        {/* Date range + actions row */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-semibold text-text-muted shrink-0">{t("dateRangeLabel")}</span>
            <input type="hidden" name="startDate" value={filters.startDate || ""} />
            <input type="hidden" name="endDate" value={filters.endDate || ""} />
            <CustomDateRangePicker
              startDate={filters.startDate || ""}
              endDate={filters.endDate || ""}
              onPick={(range) =>
                pushFilter({
                  startDate: range.start || null,
                  endDate: range.end || null,
                })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            {active ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  pushFilter({
                    q: null,
                    type: null,
                    accountId: null,
                    categoryId: null,
                    startDate: null,
                    endDate: null,
                  })
                }
              >
                {t("resetFilter")}
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Card>
  );
}

export function FilterStatusIndicator({ filters }: { filters: TransactionFiltersState }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  if (!isFilterActive(filters)) return null;

  const handleRemoveFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('startDate');
    newParams.delete('endDate');
    newParams.delete('page');
    
    navigate(newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname);
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 animate-fade-in text-sm mb-4">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-accent" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-accent">
            {language === "id" ? "Filter Tanggal Aktif" : "Active Date Filter"}
          </span>
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono tabular-nums">
            {filters.startDate && (
              <span className="bg-elevated/60 px-1.5 py-0.5 rounded border border-border/50">
                Mulai: {formatFriendlyDate(filters.startDate)}
              </span>
            )}
            {filters.endDate && (
              <span className="bg-elevated/60 px-1.5 py-0.5 rounded border border-border/50">
                Sampai: {formatFriendlyDate(filters.endDate)}
              </span>
            )}
            {!filters.startDate && !filters.endDate && (
              <span>Semua tanggal</span>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemoveFilter}
        className="text-xs text-text-muted hover:text-text-primary h-7 px-2.5"
      >
        {language === "id" ? "Hapus Filter" : "Clear Filter"}
      </Button>
    </div>
  );
}
