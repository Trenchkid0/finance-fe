import { useEffect, useRef, useState } from "react";
import { getCurrentPreferences, type CursorSettings, type CursorColor, type CursorSize } from "@/lib/preferences";

function resolveCursorColor(color: CursorColor): string {
  switch (color) {
    case "white":
      return "#FFFFFF";
    case "cyan":
      return "#00F2FE";
    case "purple":
      return "#A855F7";
    case "amber":
      return "#F59E0B";
    case "progress":
      return "var(--progress, #A855F7)";
    case "income":
      return "var(--income, #10B981)";
    case "accent":
    default:
      return "var(--accent, #388BFD)";
  }
}

function resolveCursorScale(size: CursorSize): number {
  switch (size) {
    case "small":
      return 0.85;
    case "large":
      return 1.25;
    case "default":
    default:
      return 1;
  }
}

export function CustomCursor() {
  const [settings, setSettings] = useState<CursorSettings>(
    () => getCurrentPreferences().cursorSettings || { type: "macos-pointer", color: "accent", size: "default" }
  );

  const [, setTick] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: -100, y: -100 });

  // Sync settings when updated via preferences or theme changes
  useEffect(() => {
    const handleUpdate = () => {
      const prefs = getCurrentPreferences();
      setSettings(prefs.cursorSettings || { type: "macos-pointer", color: "accent", size: "default" });
      setTick((t) => t + 1);
    };

    window.addEventListener("cursor-settings-changed", handleUpdate);
    window.addEventListener("preferences-changed", handleUpdate);
    window.addEventListener("theme-changed", handleUpdate);
    return () => {
      window.removeEventListener("cursor-settings-changed", handleUpdate);
      window.removeEventListener("preferences-changed", handleUpdate);
      window.removeEventListener("theme-changed", handleUpdate);
    };
  }, []);

  const isActive = settings.type !== "default";

  // Toggle body custom-cursor-active class
  useEffect(() => {
    const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isActive && !isTouch) {
      document.body.classList.add("custom-cursor-active");
    } else {
      document.body.classList.remove("custom-cursor-active");
    }

    return () => {
      document.body.classList.remove("custom-cursor-active");
    };
  }, [isActive]);

  // Main cursor event loop with zero-latency hardware sync
  useEffect(() => {
    if (!isActive) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      mousePos.current = { x, y };

      if (!isVisible) setIsVisible(true);

      // Instant direct hardware positioning — Zero float, Zero lag
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      // Spotlight tracking
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      // Detect interactive target hover
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest("button, a, [role='button'], select, [data-account-id], .cursor-pointer, [data-cursor='interactive'], [data-cursor='grab']")
        );
        setIsHovered(isInteractive);

        const isGrabbing = Boolean(target.closest("[data-dragging='true'], .cursor-grabbing"));
        setIsDragging(isGrabbing);
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);

    const onMouseLeave = () => {
      setIsVisible(false);
      setIsMouseDown(false);
      setIsHovered(false);
      setIsDragging(false);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onDragStart = () => setIsDragging(true);
    const onDragEnd = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("dragstart", onDragStart);
    window.addEventListener("dragend", onDragEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      window.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, [isActive, isVisible]);

  if (!isActive) return null;

  const colorVal = resolveCursorColor(settings.color);
  const scale = resolveCursorScale(settings.size);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden transition-opacity duration-150"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* ── Ambient Spotlight Layer (Clean Luxury Flashlight, No Fuzzy Blobs) ── */}
      {settings.type === "ambient-spotlight" && (
        <div
          ref={spotlightRef}
          className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            width: isHovered ? "220px" : "180px",
            height: isHovered ? "220px" : "180px",
            background: `radial-gradient(circle closest-side, color-mix(in srgb, ${colorVal} 9%, transparent), transparent 90%)`,
            opacity: isMouseDown ? 0.35 : 0.85,
          }}
        />
      )}

      {/* ── Primary Precision Arrow Cursor (Tip at exact 0,0) ─────────────── */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 will-change-transform pointer-events-none"
      >
        <div
          className="relative transition-transform duration-100 ease-out origin-top-left"
          style={{
            transform: `scale(${scale}) ${isMouseDown ? "scale(0.92)" : isHovered ? "scale(1.08) rotate(-4deg)" : "none"}`,
          }}
        >
          {/* ════ 1. Apple macOS Ventura / Sonoma Obsidian Pointer ════ */}
          {(settings.type === "macos-pointer" || (settings.type as string) === "modern-arrow") && (
            <div className="relative">
              <svg
                width="22"
                height="24"
                viewBox="0 0 22 24"
                fill="none"
                className="overflow-visible transition-all duration-150"
                style={{
                  filter: isHovered
                    ? `drop-shadow(0 3px 6px rgba(0,0,0,0.65)) drop-shadow(0 0 6px ${colorVal})`
                    : `drop-shadow(0 2.5px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 2.5px color-mix(in srgb, ${colorVal} 35%, transparent))`,
                }}
              >
                {/* Authentic Apple Proportions */}
                <path
                  d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
                  fill="#000000"
                  stroke={isHovered ? colorVal : "rgba(255, 255, 255, 0.95)"}
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Theme Main Accent Highlight Spine — always reflects the active theme! */}
                <path
                  d="M1.5 2.5 L1.5 13.5 L4.2 11.2"
                  stroke={colorVal}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity={isHovered ? 1 : 0.85}
                />
              </svg>
            </div>
          )}

          {/* ════ 2. Apple VisionOS Translucent Glass Pointer ════ */}
          {(settings.type === "vision-glass" || (settings.type as string) === "neon-pointer" || (settings.type as string) === "ghost-arrow") && (
            <div className="relative">
              <svg
                width="22"
                height="24"
                viewBox="0 0 22 24"
                fill="none"
                className="overflow-visible transition-all duration-150"
                style={{
                  filter: `drop-shadow(0 3px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 5px color-mix(in srgb, ${colorVal} 30%, transparent))`,
                }}
              >
                {/* Frosted Acrylic Glass Body Refracting Theme Accent */}
                <path
                  d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
                  fill={`color-mix(in srgb, ${colorVal} 18%, var(--card-bg, #161B22))`}
                  stroke={colorVal}
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Crystalline Bevel Accent Streak */}
                <path
                  d="M1.8 3 L1.8 13.5 L4.5 11"
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* ════ 3. Raycast / Linear Precision Tech Arrow ════ */}
          {(settings.type === "raycast-tech" || (settings.type as string) === "smart-pointer") && (
            <div className="relative">
              <svg
                width="22"
                height="24"
                viewBox="0 0 22 24"
                fill="none"
                className="overflow-visible transition-all duration-150"
                style={{
                  filter: isHovered
                    ? `drop-shadow(0 2.5px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 6px ${colorVal})`
                    : `drop-shadow(0 2.5px 6px rgba(0,0,0,0.6))`,
                }}
              >
                {/* Geometric Dart Pointer */}
                <path
                  d="M0 0 L0 17 L4.5 13 L8 20.5 L10.5 19.5 L7 12 L12.5 12 Z"
                  fill="#0B0E14"
                  stroke={isHovered ? colorVal : "rgba(255, 255, 255, 0.9)"}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Tech Core Blade infused with Theme Color */}
                <path
                  d="M1.8 2.8 L1.8 13.5 L4.2 11.5 L6.8 17 L7.8 16.5 L5.5 11 L10 11 Z"
                  fill={`color-mix(in srgb, ${colorVal} 40%, #0B0E14)`}
                  stroke={colorVal}
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          )}

          {/* ════ 4. Ambient Spotlight Arrow (Arrow on top of light beam) ════ */}
          {settings.type === "ambient-spotlight" && (
            <div className="relative">
              <svg
                width="22"
                height="24"
                viewBox="0 0 22 24"
                fill="none"
                className="overflow-visible transition-all duration-150"
                style={{
                  filter: `drop-shadow(0 2.5px 5px rgba(0,0,0,0.6)) drop-shadow(0 0 5px color-mix(in srgb, ${colorVal} 40%, transparent))`,
                }}
              >
                <path
                  d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
                  fill="#000000"
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <path
                  d="M1.5 2.5 L1.5 13.5 L4.2 11.2"
                  stroke={colorVal}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity={0.9}
                />
              </svg>
            </div>
          )}

          {/* Floating Dragging Indicator Badge */}
          {isDragging && (
            <div
              className="absolute left-5 top-5 px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold tracking-wider bg-accent text-white shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-1 border border-white/20 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              DRAGGING
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
