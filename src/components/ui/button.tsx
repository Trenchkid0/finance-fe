import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * Button — shadcn-style with variants tuned to AGENTS.md §4.5.
 *
 * Variants:
 *   - default     primary CTA  (bg-accent with dynamic color support)
 *   - secondary   neutral      (bg-elevated + border)
 *   - destructive expense tone (translucent red)
 *   - outline     same as secondary but transparent at rest
 *   - ghost       icon buttons / nav items
 *   - link        inline link styled as text
 *
 * Sizes match shadcn defaults; `icon` is square 36×36 for consistency.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-white shadow-sm hover:opacity-90 hover:shadow-md hover:shadow-accent/20 active:scale-[0.97]",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 hover:border-destructive/40 active:scale-[0.97]",
        outline:
          "border border-border/50 bg-transparent text-foreground hover:bg-white/[0.04] hover:border-border active:scale-[0.97]",
        secondary:
          "bg-white/[0.04] border border-border/50 text-foreground hover:bg-white/[0.07] hover:border-border active:scale-[0.97]",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/[0.05] active:scale-[0.97]",
        link:
          "text-accent underline-offset-4 hover:underline hover:text-accent/80",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "h-9 px-3.5 text-xs",
        lg: "px-7 text-base",
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
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Apply dynamic styles from CSS variables
    const buttonStyle: React.CSSProperties = {
      borderRadius: 'var(--button-radius, 12px)',
      height: size === "icon" ? undefined : 'var(--button-height, 44px)',
      fontWeight: 'var(--button-font-weight, 600)',
      ...style
    };
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={buttonStyle}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
