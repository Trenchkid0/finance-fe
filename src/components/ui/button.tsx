import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * Button — shadcn-style with variants tuned to AGENTS.md §4.5.
 *
 * Variants:
 *   - default     primary CTA  (bg-primary)
 *   - secondary   neutral      (bg-elevated + border)
 *   - destructive expense tone (translucent red)
 *   - outline     same as secondary but transparent at rest
 *   - ghost       icon buttons / nav items
 *   - link        inline link styled as text
 *
 * Sizes match shadcn defaults; `icon` is square 36×36 for consistency.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:opacity-90 active:scale-[0.97]",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 active:scale-[0.97]",
        outline:
          "border border-border/50 bg-transparent text-foreground hover:bg-white/[0.04] hover:border-border active:scale-[0.97]",
        secondary:
          "bg-white/[0.04] border border-border/50 text-foreground hover:bg-white/[0.07] active:scale-[0.97]",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/[0.05] active:scale-[0.97]",
        link:
          "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
