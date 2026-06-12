"use client";

import * as React from "react";
import { useState, useEffect, useLayoutEffect, useContext, createContext, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

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
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
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
      {children}
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
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
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
  const { open, triggerRef, contentRef } = context;
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  const internalRef = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    portalContainerRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  // Calculate position after portal content is painted
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    
    // Try synchronous positioning first
    const el = portalContainerRef.current;
    if (el && el.offsetHeight > 0) {
      calcPosition(el, triggerRef.current, align, side, sideOffset, setPosition);
      return;
    }

    // Fallback if element is not rendered or height is 0
    let attempts = 0;
    const tryPosition = () => {
      const currentEl = portalContainerRef.current;
      if (currentEl && currentEl.offsetHeight > 0 && triggerRef.current) {
        calcPosition(currentEl, triggerRef.current, align, side, sideOffset, setPosition);
      } else if (attempts < 10) {
        attempts++;
        requestAnimationFrame(tryPosition);
      }
    };
    requestAnimationFrame(tryPosition);
  }, [open, align, side, sideOffset]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (triggerRef.current && portalContainerRef.current) {
        calcPosition(portalContainerRef.current, triggerRef.current, align, side, sideOffset, setPosition);
      }
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align, side, sideOffset]);

  if (!open) return null;

  return createPortal(
    <div
      ref={internalRef}
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? undefined : "hidden",
        borderRadius: "var(--dropdown-menu-radius, 12px)",
        ...props.style
      }}
      className={cn(
        "min-w-[8rem] border border-white/[0.08] bg-popover/95 backdrop-blur-xl p-1 text-popover-foreground shadow-2xl shadow-black/50 z-[99999]",
        position && "animate-in fade-in-0 zoom-in-95 duration-100",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

function calcPosition(
  contentEl: HTMLElement,
  triggerEl: HTMLElement,
  align: "start" | "end" | "center",
  side: "top" | "bottom" | "left" | "right",
  sideOffset: number,
  setPosition: React.Dispatch<React.SetStateAction<{ top: number; left: number } | null>>
) {
  const triggerRect = triggerEl.getBoundingClientRect();
  const contentRect = contentEl.getBoundingClientRect();
  const contentWidth = contentRect.width || 200;
  const contentHeight = contentRect.height || 200;
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;

  let top = 0;
  let left = 0;

  if (side === "top" || side === "bottom") {
    // Vertical positioning
    if (side === "bottom") {
      top = triggerRect.bottom + sideOffset;
      if (top + contentHeight > viewportH && triggerRect.top - contentHeight - sideOffset > 0) {
        top = triggerRect.top - contentHeight - sideOffset;
      }
    } else {
      top = triggerRect.top - contentHeight - sideOffset;
      if (top < 0 && triggerRect.bottom + contentHeight + sideOffset < viewportH) {
        top = triggerRect.bottom + sideOffset;
      }
    }

    // Horizontal alignment
    if (align === "end") {
      left = triggerRect.right - contentWidth;
    } else if (align === "start") {
      left = triggerRect.left;
    } else {
      left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2;
    }
  } else if (side === "left" || side === "right") {
    // Horizontal positioning
    if (side === "right") {
      left = triggerRect.right + sideOffset;
      if (left + contentWidth > viewportW && triggerRect.left - contentWidth - sideOffset > 0) {
        left = triggerRect.left - contentWidth - sideOffset;
      }
    } else {
      left = triggerRect.left - contentWidth - sideOffset;
      if (left < 0 && triggerRect.right + contentWidth + sideOffset < viewportW) {
        left = triggerRect.right + sideOffset;
      }
    }

    // Vertical alignment
    if (align === "end") {
      top = triggerRect.bottom - contentHeight;
    } else if (align === "start") {
      top = triggerRect.top;
    } else {
      top = triggerRect.top + triggerRect.height / 2 - contentHeight / 2;
    }
  }

  // Clamp to viewport boundaries
  if (left < 8) left = 8;
  if (left + contentWidth > viewportW - 8) left = viewportW - contentWidth - 8;
  if (top < 8) top = 8;
  if (top + contentHeight > viewportH - 8) top = viewportH - contentHeight - 8;

  setPosition({ top, left });
}

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
