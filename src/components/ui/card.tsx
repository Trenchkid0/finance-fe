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

/**
 * Card primitives — shadcn pattern, AGENTS.md §4.5 (border-only, no shadows).
 *
 * Supports two card types via Settings → Card Styles:
 * - **default**: Rounded corners, glassmorphism, themed via CSS vars.
 * - **blueprint**: Sharp corners, corner bracket marks, accent hover glow.
 *
 * Layout matches shadcn dashboard-01: `CardHeader` is a 3-column grid
 * where `CardDescription` (label) and `CardTitle` (big number) stack
 * on the left while `CardAction` floats to the right.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, children, ...props }, ref) => {
    const cardType = useCardType();
    const isBlueprint = cardType === "blueprint";

    if (isBlueprint) {
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

    return (
      <div
        ref={ref}
        data-slot="card"
        data-card-type="default"
        className={cn(
          "border border-border text-card-foreground transition-all duration-200 hover:border-hover-border flex flex-col gap-4",
          className,
        )}
        style={{
          borderRadius: "var(--card-radius)",
          borderWidth: "var(--card-border-width)",
          borderColor: "var(--border)",
          backdropFilter: "blur(var(--card-backdrop-blur))",
          WebkitBackdropFilter: "blur(var(--card-backdrop-blur))",
          backgroundColor:
            "color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)",
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
