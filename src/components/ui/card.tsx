import * as React from "react";
import { useState, useEffect, useContext } from "react";
import { cn } from "@/lib/utils/cn";
import type { CardType } from "@/lib/utils/theme";

/* ─── Helpers ────────────────────────────────────────────────── */

/** Read card type from localStorage (written synchronously by applyCardStyles). */
function readCardType(): CardType {
  try {
    const raw = localStorage.getItem("racks-card-styles");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.cardType === "blueprint") return "blueprint";
      if (parsed.cardType === "manly") return "manly";
      if (parsed.cardType === "girly") return "girly";
    }
  } catch { /* ignore */ }
  return "default";
}

/* ─── Card Type Context (single listener for all cards) ────── */

const CardTypeContext = React.createContext<CardType>("default");

/**
 * Provides the current card type to all Card descendants.
 * Only ONE event listener is created regardless of how many Cards exist.
 * Reads from localStorage (written synchronously by applyCardStyles) for
 * instant reactivity — no dependency on async API or module-level state.
 */
export function CardTypeProvider({ children }: { children: React.ReactNode }) {
  const [cardType, setCardType] = useState<CardType>(readCardType);

  useEffect(() => {
    const onPrefsChanged = () => setCardType(readCardType());
    window.addEventListener("preferences-changed", onPrefsChanged);
    return () => window.removeEventListener("preferences-changed", onPrefsChanged);
  }, []);

  return (
    <CardTypeContext.Provider value={cardType}>
      {children}
    </CardTypeContext.Provider>
  );
}

function useCardType(): CardType {
  return useContext(CardTypeContext);
}

/* ─── Corner Marks (blueprint decoration) ──────────────────── */

function BlueprintCorners() {
  return (
    <>
      <div className="absolute -left-px -top-px z-10 h-2 w-2 border-l-2 border-t-2 border-text-muted/20" />
      <div className="absolute -right-px -top-px z-10 h-2 w-2 border-r-2 border-t-2 border-text-muted/20" />
      <div className="absolute -bottom-px -left-px z-10 h-2 w-2 border-b-2 border-l-2 border-text-muted/20" />
      <div className="absolute -bottom-px -right-px z-10 h-2 w-2 border-b-2 border-r-2 border-text-muted/20" />
    </>
  );
}

/* ─── Manly Tactical Accents ───────────────────────────────── */

function ManlyAccents() {
  return (
    <>
      {/* Corner micro-rivets */}
      <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
      <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
      {/* Top titanium/amber tactical accent stripe */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-zinc-600/40 via-amber-500/50 to-zinc-600/40 opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
      {/* Stealth corner hash on top-right */}
      <div className="pointer-events-none absolute right-0 top-0 h-8 w-8 bg-gradient-to-bl from-zinc-600/10 to-transparent" />
    </>
  );
}

/* ─── Girly Pastel Accents ─────────────────────────────────── */

function GirlyAccents() {
  return (
    <>
      {/* Soft dreamy pastel blurs in corners */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-pink-400/15 via-rose-300/10 to-transparent blur-xl" />
      <div className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-gradient-to-tr from-purple-400/10 via-pink-300/10 to-transparent blur-xl" />
      {/* Delicate floating star sparkle in top right */}
      <div className="pointer-events-none absolute right-3.5 top-3 z-10 text-pink-400/70 transition-all duration-300 group-hover:scale-110 group-hover:text-pink-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
      <div className="pointer-events-none absolute right-7 top-5 z-10 text-rose-300/40 transition-all duration-300 group-hover:text-rose-300/80">
        <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
    </>
  );
}

/**
 * Card primitives — shadcn pattern, AGENTS.md §4.5 (border-only, no shadows).
 *
 * Supports card types via Settings → Card Styles:
 * - **default**: Rounded corners, glassmorphism, themed via CSS vars.
 * - **blueprint**: Sharp corners, corner bracket marks, accent hover glow.
 * - **manly**: Solid 6px corners, tactical rivets, titanium/amber stripe, rugged aesthetic.
 * - **girly**: Soft 22px pillowy curves, dreamy pastel glow, delicate star sparkles.
 *
 * Layout matches shadcn dashboard-01: `CardHeader` is a 3-column grid
 * where `CardDescription` (label) and `CardTitle` (big number) stack
 * on the left while `CardAction` floats to the right.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, children, ...props }, ref) => {
    const cardType = useCardType();

    if (cardType === "blueprint") {
      return (
        <div
          ref={ref}
          data-slot="card"
          data-card-type="blueprint"
          className={cn(
            "group relative overflow-hidden border border-border bg-background text-card-foreground",
            "transition-colors duration-200 hover:border-accent/40",
            "flex flex-col gap-4",
            className,
            "rounded-none",
          )}
          {...props}
        >
          <BlueprintCorners />
          {/* Left accent bar on hover */}
          <div className="absolute left-0 top-0 h-full w-0.5 bg-transparent transition-colors duration-200 group-hover:bg-accent/40" />
          {/* Top glow gradient on hover */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {children}
        </div>
      );
    }

    if (cardType === "manly") {
      return (
        <div
          ref={ref}
          data-slot="card"
          data-card-type="manly"
          className={cn(
            "group relative overflow-hidden bg-background text-card-foreground",
            "border border-zinc-700/60 dark:border-zinc-700/80",
            "transition-all duration-200 hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/25",
            "flex flex-col gap-4 rounded-md",
            className,
          )}
          style={{
            borderRadius: "6px",
            borderWidth: "1px",
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            ...style,
          }}
          {...props}
        >
          <ManlyAccents />
          {children}
        </div>
      );
    }

    if (cardType === "girly") {
      return (
        <div
          ref={ref}
          data-slot="card"
          data-card-type="girly"
          className={cn(
            "group relative overflow-hidden bg-background text-card-foreground",
            "border border-pink-300/40 dark:border-pink-500/30",
            "transition-all duration-300 hover:border-pink-400/70 hover:shadow-[0_8px_30px_rgba(244,114,182,0.18)] dark:hover:shadow-[0_8px_30px_rgba(236,72,153,0.22)]",
            "flex flex-col gap-4 rounded-[22px]",
            className,
          )}
          style={{
            borderRadius: "22px",
            borderWidth: "1.5px",
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            ...style,
          }}
          {...props}
        >
          <GirlyAccents />
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-slot="card"
        data-card-type="default"
        className={cn(
          "border border-border bg-background text-card-foreground transition-all duration-200 hover:border-hover-border flex flex-col gap-4",
          className,
        )}
        style={{
          borderRadius: "var(--card-radius)",
          borderWidth: "var(--card-border-width)",
          borderColor: "var(--border)",
          backgroundColor: "var(--background)",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-[[data-slot=card-action]]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-base font-medium text-foreground", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

/**
 * `CardAction` — floats to the top-right of `CardHeader`. Used for
 * delta badges, time-range selectors, overflow menus.
 */
const CardAction = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  ),
);
CardAction.displayName = "CardAction";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center px-6 pb-6", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
};
