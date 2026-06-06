import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Input — shadcn pattern, tuned to AGENTS.md §4.5 form spec.
 * Background `elevated`, ring on focus uses our accent token.
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border/50 bg-white/[0.03] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60",
          "hover:border-border/80 hover:bg-white/[0.05]",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/[0.04]",
          "transition-all duration-300 ease-out",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus:ring-destructive/30",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
