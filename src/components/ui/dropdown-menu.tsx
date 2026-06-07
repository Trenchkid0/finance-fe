"use client";

import * as React from "react";
import { useState, useEffect, useContext, createContext, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

// Context to share open state and trigger reference
interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLElement | null>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

export function DropdownMenu({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClose = (e: MouseEvent) => {
      // Don't close if clicking the trigger or inside the active trigger
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      // Don't close if clicking inside the dropdown content
      if (contentRef.current && contentRef.current.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export const DropdownMenuTrigger = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean; disabled?: boolean }
>(({ children, asChild, disabled, ...props }, ref) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used inside DropdownMenu");
  const { open, setOpen, triggerRef } = context;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    setOpen(!open);
  };

  const internalRef = (node: HTMLElement | null) => {
    triggerRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ref: internalRef,
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        if (child.props.onClick) child.props.onClick(e);
      },
      disabled,
      "data-state": open ? "open" : "closed",
      ...props,
    });
  }

  return (
    <button
      ref={internalRef as any}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end" | "center";
    side?: "top" | "bottom" | "left" | "right";
    sideOffset?: number;
  }
>(({ className, align = "end", side = "bottom", sideOffset = 4, children, ...props }, ref) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuContent must be used inside DropdownMenu");
  const { open, contentRef } = context;

  if (!open) return null;

  const style: React.CSSProperties = {
    marginTop: side === "bottom" ? sideOffset : undefined,
    marginBottom: side === "top" ? sideOffset : undefined,
    marginLeft: side === "right" ? sideOffset : undefined,
    marginRight: side === "left" ? sideOffset : undefined,
  };

  const sideAlignClasses = cn(
    "absolute z-50",
    side === "bottom" && "top-full",
    side === "top" && "bottom-full",
    side === "left" && "right-full",
    side === "right" && "left-full",
    side === "bottom" || side === "top"
      ? align === "end"
        ? "right-0"
        : align === "start"
        ? "left-0"
        : "left-1/2 -translate-x-1/2"
      : align === "end"
      ? "bottom-0"
      : align === "start"
      ? "top-0"
      : "top-1/2 -translate-y-1/2",
    className
  );

  const internalRef = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <div
      ref={internalRef}
      style={style}
      className={cn(
        "min-w-[8rem] overflow-hidden rounded-xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl p-1 text-popover-foreground shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-100",
        sideAlignClasses
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    inset?: boolean;
    variant?: "default" | "destructive";
    onSelect?: (event: Event) => void;
  }
>(({ className, asChild, inset, variant = "default", onClick, onSelect, children, ...props }, ref) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuItem must be used inside DropdownMenu");
  const { setOpen } = context;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    if (onSelect) onSelect(e as unknown as Event);
    setOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      className: cn(
        "w-full text-left relative flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors duration-150",
        "text-text-primary hover:bg-white/[0.06] hover:cursor-pointer focus:bg-white/[0.06] focus:text-foreground",
        variant === "destructive" && "text-destructive hover:bg-destructive/15 focus:bg-destructive/15 focus:text-destructive",
        inset && "pl-8",
        className,
        child.props.className
      ),
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e);
        if (child.props.onClick) child.props.onClick(e);
      },
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left relative flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors duration-150",
        "text-text-primary hover:bg-white/[0.06] hover:cursor-pointer focus:bg-white/[0.06] focus:text-foreground",
        variant === "destructive" && "text-destructive hover:bg-destructive/15 focus:bg-destructive/15 focus:text-destructive",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-white/[0.06]", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2.5 py-1.5 text-xs text-muted-foreground", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-0.5", className)} {...props} />
);
DropdownMenuGroup.displayName = "DropdownMenuGroup";

export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
DropdownMenuPortal.displayName = "DropdownMenuPortal";

export const DropdownMenuSub = DropdownMenu as React.FC<{ children: React.ReactNode; modal?: boolean }>;
DropdownMenuSub.displayName = "DropdownMenuSub";

export const DropdownMenuSubTrigger = DropdownMenuTrigger;
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuSubContent = DropdownMenuContent;
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export const DropdownMenuRadioGroup = ({ children, ...props }: any) => <div {...props}>{children}</div>;
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup";

export const DropdownMenuCheckboxItem = DropdownMenuItem;
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export const DropdownMenuRadioItem = DropdownMenuItem;
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

export const DropdownMenuShortcut = ({ className, ...props }: any) => (
  <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
