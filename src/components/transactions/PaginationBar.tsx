import { useTransition } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { withParams } from "./TransactionFilters";
import type { TransactionPagination } from "./TransactionsClient";

interface PaginationBarProps {
  pagination: TransactionPagination;
}

export function PaginationBar({
  pagination,
}: PaginationBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { t, language } = useLanguage();

  const { page, pageSize, pageSizeOptions, total, totalPages } = pagination;

  function go(targetPage: number) {
    const qs = withParams(searchParams, { page: String(targetPage) });
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  function setSize(newSize: string) {
    const qs = withParams(searchParams, {
      pageSize: newSize === String(25) ? null : newSize,
      page: null,
    });
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
      <p className="tabular-nums">
        {language === "id" ? "Menampilkan" : "Showing"}{" "}
        <span className="text-foreground font-medium">{start}</span>–
        <span className="text-foreground font-medium">{end}</span> {language === "id" ? "dari" : "of"}{" "}
        <span className="text-foreground font-medium">{total}</span> {t("transactionCount")}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">{language === "id" ? "Per halaman" : "Per page"}</span>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 w-20 flex items-center justify-between px-2.5 text-xs font-semibold text-foreground hover:bg-hover-elevated bg-surface/30 border border-border/50 transition-colors"
                style={{ borderRadius: 'var(--dropdown-radius, 8px)' }}
              >
                <span>{pageSize}</span>
                <ChevronDown size={12} className="opacity-60 shrink-0 ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[80px] rounded-xl border-border bg-popover/95 backdrop-blur-xl z-50">
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem
                  key={size}
                  className="text-xs font-semibold cursor-pointer"
                  onClick={() => setSize(String(size))}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(1)}
            disabled={pending || page <= 1}
            aria-label="Halaman pertama"
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(page - 1)}
            disabled={pending || page <= 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="px-2 text-foreground tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(page + 1)}
            disabled={pending || page >= totalPages}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => go(totalPages)}
            disabled={pending || page >= totalPages}
            aria-label="Halaman terakhir"
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
