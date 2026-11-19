import * as React from "react";
import { useState, useEffect, useContext } from "react";
import { cn } from "@/lib/utils/cn";
import { normalizeCardType, type CardType } from "@/lib/utils/theme";

/* ─── Helpers ────────────────────────────────────────────────── */

/** Read card type from localStorage (written synchronously by applyCardStyles). */
function readCardType(): CardType {
  try {
    const raw = localStorage.getItem("racks-card-styles");
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeCardType(parsed.cardType);
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

export function BlueprintCorners({
  size = 12,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden !m-0"
      style={{ margin: 0 }}
    >
      {/* Top Left */}
      <svg
        className={cn(
          "absolute left-0 top-0 text-accent/60 transition-colors duration-200 group-hover:text-accent !m-0",
          className,
        )}
        style={{ width: size, height: size, margin: 0 }}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M 1 12 V 1 H 12" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter" />
      </svg>
      {/* Top Right */}
      <svg
        className={cn(
          "absolute right-0 top-0 text-accent/60 transition-colors duration-200 group-hover:text-accent !m-0",
          className,
        )}
        style={{ width: size, height: size, margin: 0 }}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M 11 12 V 1 H 0" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter" />
      </svg>
      {/* Bottom Left */}
      <svg
        className={cn(
          "absolute bottom-0 left-0 text-accent/60 transition-colors duration-200 group-hover:text-accent !m-0",
          className,
        )}
        style={{ width: size, height: size, margin: 0 }}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M 1 0 V 11 H 12" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter" />
      </svg>
      {/* Bottom Right */}
      <svg
        className={cn(
          "absolute bottom-0 right-0 text-accent/60 transition-colors duration-200 group-hover:text-accent !m-0",
          className,
        )}
        style={{ width: size, height: size, margin: 0 }}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M 11 0 V 11 H 0" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter" />
      </svg>
    </div>
  );
}

/* ─── Sovereign Horology Accents ───────────────────────────── */

export function SovereignAccents({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden !m-0"
      style={{ margin: 0 }}
    >
      {/* Theme-adaptive brushed metallic satin sheen */}
      <div
        className="absolute inset-0 !m-0"
        style={{
          margin: 0,
          backgroundImage:
            "linear-gradient(135deg, var(--sov-sheen-1) 0%, transparent 44%, var(--sov-sheen-2) 100%)",
        }}
      />
      {/* Top specular hairline */}
      <div
        className="absolute inset-x-4 top-0 h-px opacity-80 transition-opacity duration-300 group-hover:opacity-100 !m-0"
        style={{
          margin: 0,
          backgroundImage: "linear-gradient(90deg, transparent, var(--sov-ink), transparent)",
        }}
      />
      {/* 12-o'clock micro diamond index pip */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 rotate-45 transition-transform duration-300 group-hover:scale-125 !m-0",
          compact ? "top-[2px] h-1 w-1" : "top-[3px] h-1.5 w-1.5",
        )}
        style={{
          margin: 0,
          backgroundColor: "var(--sov-ink)",
          boxShadow: "0 0 6px var(--sov-shadow)",
        }}
      />
      {/* Recessed inner watch-bezel frame */}
      <div
        className={cn(
          "sov-bezel absolute border transition-colors duration-300 !m-0",
          compact ? "inset-[3px] rounded-[5px]" : "inset-[5px] rounded-[6px]",
        )}
        style={{ margin: 0 }}
      />
      {/* Left chamfered corner hairline ticks */}
      <div
        className={cn(
          "absolute border-l border-t transition-colors duration-300 !m-0",
          compact ? "left-[3px] top-[3px] h-1.5 w-1.5 rounded-tl-[2px]" : "left-[5px] top-[5px] h-2.5 w-2.5 rounded-tl-[3px]",
        )}
        style={{ margin: 0, borderColor: "var(--sov-tick)" }}
      />
      <div
        className={cn(
          "absolute border-b border-l transition-colors duration-300 !m-0",
          compact ? "bottom-[3px] left-[3px] h-1.5 w-1.5 rounded-bl-[2px]" : "bottom-[5px] left-[5px] h-2.5 w-2.5 rounded-bl-[3px]",
        )}
        style={{ margin: 0, borderColor: "var(--sov-tick)" }}
      />
      {/* Swiss guilloché chronograph corner arc */}
      <svg
        className={cn(
          "sov-dial absolute bottom-0 right-0 transition-colors duration-300 !m-0",
          compact ? "h-12 w-12" : "h-20 w-20",
        )}
        style={{ margin: 0 }}
        viewBox="0 0 80 80"
        fill="none"
      >
        <path d="M 16 80 A 64 64 0 0 1 80 16" stroke="currentColor" strokeWidth="0.9" />
        <path d="M 32 80 A 48 48 0 0 1 80 32" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2 3" />
        <path d="M 48 80 A 32 32 0 0 1 80 48" stroke="currentColor" strokeWidth="0.7" />
        <line x1="20.1" y1="63.9" x2="27.8" y2="66.0" stroke="currentColor" strokeWidth="1" />
        <line x1="26.3" y1="49.0" x2="33.2" y2="53.0" stroke="currentColor" strokeWidth="1" />
        <line x1="36.2" y1="36.2" x2="41.8" y2="41.8" stroke="currentColor" strokeWidth="1.2" />
        <line x1="49.0" y1="26.3" x2="53.0" y2="33.2" stroke="currentColor" strokeWidth="1" />
        <line x1="63.9" y1="20.1" x2="66.0" y2="27.8" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ─── Girly Sakura & Pearl Couture Accents ─────────────────── */

export function GirlyAccents({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden !m-0"
      style={{ margin: 0 }}
    >
      {/* Theme-adaptive silky rose & lilac satin wash */}
      <div
        className="absolute inset-0 !m-0"
        style={{
          margin: 0,
          backgroundImage:
            "linear-gradient(135deg, var(--girly-wash-1) 0%, transparent 48%, var(--girly-wash-2) 100%)",
        }}
      />
      {/* Soft pastel rose & lilac corner glows (zero GPU blur cost) */}
      <div
        className="absolute -right-6 -top-6 h-28 w-28 rounded-full !m-0"
        style={{
          margin: 0,
          backgroundImage: "radial-gradient(circle, var(--girly-glow-1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -left-6 -bottom-6 h-28 w-28 rounded-full !m-0"
        style={{
          margin: 0,
          backgroundImage: "radial-gradient(circle, var(--girly-glow-2) 0%, transparent 70%)",
        }}
      />
      {/* Silky top shimmer */}
      <div
        className="absolute inset-x-8 top-0 h-[1.5px] opacity-80 transition-opacity duration-300 group-hover:opacity-100 !m-0"
        style={{
          margin: 0,
          backgroundImage: "linear-gradient(90deg, transparent, var(--girly-shimmer), transparent)",
        }}
      />
      {/* Delicate inner pearl hairline frame */}
      <div
        className={cn(
          "girly-frame absolute border transition-colors duration-300 !m-0",
          compact ? "inset-[3px] rounded-[14px]" : "inset-[5px] rounded-[21px]",
        )}
        style={{ margin: 0 }}
      />
      {/* Tiny luminous pearl micro-dots */}
      {!compact && (
        <>
          <div
            className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full !m-0"
            style={{
              margin: 0,
              backgroundColor: "var(--girly-pearl)",
              boxShadow: "0 0 0 2px var(--girly-frame)",
            }}
          />
          <div
            className="absolute bottom-3 left-3 h-1 w-1 rounded-full !m-0"
            style={{
              margin: 0,
              backgroundColor: "var(--girly-pearl)",
              boxShadow: "0 0 0 1px var(--girly-frame)",
            }}
          />
        </>
      )}
      {/* Dainty starlet sparkles in top right */}
      <div
        className={cn(
          "absolute transition-transform duration-300 group-hover:scale-110 !m-0",
          compact ? "right-2.5 top-2" : "right-3.5 top-3",
        )}
        style={{ margin: 0, color: "var(--girly-ink)", opacity: 0.72 }}
      >
        <svg width={compact ? 10 : 12} height={compact ? 10 : 12} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
      <div
        className={cn(
          "absolute transition-opacity duration-300 group-hover:opacity-90 !m-0",
          compact ? "right-5 top-3.5" : "right-7 top-5",
        )}
        style={{ margin: 0, color: "var(--girly-ink)", opacity: 0.45 }}
      >
        <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
      {/* Bespoke 5-petal Sakura Blossom + floating petal in bottom-right */}
      <svg
        className={cn(
          "girly-petal absolute bottom-0.5 right-1 transition-all duration-300 group-hover:scale-105 !m-0",
          compact ? "h-10 w-10" : "h-16 w-16",
        )}
        style={{ margin: 0 }}
        viewBox="0 0 64 64"
        fill="none"
      >
        <g transform="rotate(0 38 38)">
          <path d="M 38 38 C 32 30 31 20 35.5 16.5 L 38 19 L 40.5 16.5 C 45 20 44 30 38 38 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
        </g>
        <g transform="rotate(72 38 38)">
          <path d="M 38 38 C 32 30 31 20 35.5 16.5 L 38 19 L 40.5 16.5 C 45 20 44 30 38 38 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
        </g>
        <g transform="rotate(144 38 38)">
          <path d="M 38 38 C 32 30 31 20 35.5 16.5 L 38 19 L 40.5 16.5 C 45 20 44 30 38 38 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
        </g>
        <g transform="rotate(216 38 38)">
          <path d="M 38 38 C 32 30 31 20 35.5 16.5 L 38 19 L 40.5 16.5 C 45 20 44 30 38 38 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
        </g>
        <g transform="rotate(288 38 38)">
          <path d="M 38 38 C 32 30 31 20 35.5 16.5 L 38 19 L 40.5 16.5 C 45 20 44 30 38 38 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
        </g>
        {/* Blossom stamen center */}
        <circle cx="38" cy="38" r="2.2" fill="var(--girly-ink)" opacity="0.55" />
        {/* Floating loose petal */}
        <path d="M 14 48 C 10 44 12 37 17 36 C 19 41 18 46 14 48 Z" fill="currentColor" opacity="0.65" />
      </svg>
    </div>
  );
}

/**
 * Card primitives — shadcn pattern, AGENTS.md §4.5 (border-only, no shadows).
 *
 * Supports card types via Settings → Card Styles:
 * - **default**: Rounded corners, glassmorphism, themed via CSS vars.
 * - **blueprint**: Sharp corners, corner bracket marks, accent hover glow.
 * - **sovereign**: Swiss horology double-bezel frame, guilloché corner arc, champagne gold gleam.
 * - **girly**: Soft 26px pillowy curves, pearl inner frame, sakura petal flourish, rose-pastel glow.
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
            "!rounded-none !bg-background",
          )}
          style={{
            borderRadius: "0px",
            borderWidth: "1px",
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            ...style,
          }}
          {...props}
        >
          {children}
          {/* Blueprint Accents Overlay (placed after children with margin:0 so space-y-* never shifts it) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 select-none !m-0"
            style={{ margin: 0 }}
          >
            <BlueprintCorners />
            {/* Left accent bar on hover */}
            <div className="absolute left-0 top-0 h-full w-0.5 bg-transparent transition-colors duration-200 group-hover:bg-accent/40 !m-0" style={{ margin: 0 }} />
            {/* Top glow gradient on hover */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 !m-0" style={{ margin: 0 }} />
          </div>
        </div>
      );
    }

    if (cardType === "sovereign") {
      return (
        <div
          ref={ref}
          data-slot="card"
          data-card-type="sovereign"
          className={cn(
            "card-sovereign group relative overflow-hidden bg-background text-card-foreground border",
            "flex flex-col gap-4",
            className,
            "!rounded-[10px] !bg-background",
          )}
          style={{
            borderRadius: "10px",
            borderWidth: "1px",
            backgroundColor: "var(--background)",
            ...style,
          }}
          {...props}
        >
          {children}
          <SovereignAccents />
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
            "card-girly group relative overflow-hidden bg-background text-card-foreground border",
            "flex flex-col gap-4",
            className,
            "!rounded-[26px] !bg-background",
          )}
          style={{
            borderRadius: "26px",
            borderWidth: "1.5px",
            backgroundColor: "var(--background)",
            ...style,
          }}
          {...props}
        >
          {children}
          <GirlyAccents />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-slot="card"
        data-card-type="default"
        className={cn(
          "border border-border bg-background text-card-foreground transition-colors duration-200 hover:border-hover-border flex flex-col gap-4",
          className,
          "!bg-background",
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
