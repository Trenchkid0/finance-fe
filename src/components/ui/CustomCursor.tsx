import { useEffect, useRef, useState } from "react";
import { getCurrentPreferences, type CursorSettings, type CursorColor, type CursorSize } from "@/lib/preferences";

export type CursorKind = "default" | "text" | "pointer" | "grab" | "grabbing" | "not-allowed";

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

function renderPointerArrow(type: string, colorVal: string, isHovered: boolean) {
  if (type === "vision-glass" || type === "neon-pointer" || type === "ghost-arrow") {
    return (
      <svg
        width="22"
        height="24"
        viewBox="0 0 22 24"
        fill="none"
        className="overflow-visible transition-all duration-150"
        style={{
          filter: isHovered
            ? `drop-shadow(0 3px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 7px ${colorVal})`
            : `drop-shadow(0 3px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 5px color-mix(in srgb, ${colorVal} 30%, transparent))`,
        }}
      >
        <path
          d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
          fill={`color-mix(in srgb, ${colorVal} 18%, var(--card-bg, #161B22))`}
          stroke={colorVal}
          strokeWidth="1.3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M1.8 3 L1.8 13.5 L4.5 11"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "raycast-tech" || type === "smart-pointer") {
    return (
      <svg
        width="22"
        height="24"
        viewBox="0 0 22 24"
        fill="none"
        className="overflow-visible transition-all duration-150"
        style={{
          filter: isHovered
            ? `drop-shadow(0 2.5px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 7px ${colorVal})`
            : `drop-shadow(0 2.5px 6px rgba(0,0,0,0.6))`,
        }}
      >
        <path
          d="M0 0 L0 17 L4.5 13 L8 20.5 L10.5 19.5 L7 12 L12.5 12 Z"
          fill="#0B0E14"
          stroke={isHovered ? colorVal : "rgba(255, 255, 255, 0.9)"}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M1.8 2.8 L1.8 13.5 L4.2 11.5 L6.8 17 L7.8 16.5 L5.5 11 L10 11 Z"
          fill={`color-mix(in srgb, ${colorVal} 40%, #0B0E14)`}
          stroke={colorVal}
          strokeWidth="0.5"
        />
      </svg>
    );
  }

  // Default: macos-pointer and ambient-spotlight
  return (
    <svg
      width="22"
      height="24"
      viewBox="0 0 22 24"
      fill="none"
      className="overflow-visible transition-all duration-150"
      style={{
        filter: isHovered
          ? `drop-shadow(0 3px 6px rgba(0,0,0,0.65)) drop-shadow(0 0 7px ${colorVal})`
          : `drop-shadow(0 2.5px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 2.5px color-mix(in srgb, ${colorVal} 35%, transparent))`,
      }}
    >
      <path
        d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
        fill="#000000"
        stroke={isHovered ? colorVal : "rgba(255, 255, 255, 0.95)"}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M1.5 2.5 L1.5 13.5 L4.2 11.2"
        stroke={colorVal}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity={isHovered ? 1 : 0.85}
      />
    </svg>
  );
}

function getInitialCursorSettings(): CursorSettings {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("racks-cursor-settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.type) return parsed;
      }
    } catch { /* ignore */ }
  }
  return getCurrentPreferences().cursorSettings || { type: "macos-pointer", color: "accent", size: "default" };
}

export function CustomCursor() {
  const [settings, setSettings] = useState<CursorSettings>(getInitialCursorSettings);

  const [, setTick] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorKind, setCursorKind] = useState<CursorKind>("default");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const isVisibleRef = useRef(false);
  const lastTargetRef = useRef<EventTarget | null>(null);
  const cursorKindRef = useRef<CursorKind>("default");
  const isDraggingRef = useRef(false);

  // Sync settings when updated via preferences or theme changes
  useEffect(() => {
    const handleUpdate = () => {
      let next = getCurrentPreferences().cursorSettings;
      if (!next || !next.type) {
        try {
          const raw = localStorage.getItem("racks-cursor-settings");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.type) next = parsed;
          }
        } catch { /* ignore */ }
      }
      setSettings(next || { type: "macos-pointer", color: "accent", size: "default" });
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

  // Main cursor event loop with zero-latency hardware sync & smart element adaptation
  useEffect(() => {
    if (!isActive) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      mousePos.current = { x, y };

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      // Instant direct hardware positioning via GPU compositor thread
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      // High-performance target caching: inspect DOM tree when crossing element boundary
      const target = e.target;
      if (target && target !== lastTargetRef.current) {
        lastTargetRef.current = target;
        const el = target as HTMLElement;

        // 1. Check Disabled state
        const isNotAllowed = Boolean(
          el.closest?.(":disabled, [aria-disabled='true'], .disabled, .cursor-not-allowed, [data-disabled='true']")
        );

        // 2. Check Text Input state (text inputs, search, textareas, contenteditable)
        const isTextInput = !isNotAllowed && Boolean(
          el.closest?.(
            'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="color"]):not([type="range"]):not([type="image"]), textarea, [contenteditable="true"], [contenteditable=""], [data-cursor="text"], .cmdk-input'
          )
        );

        // 3. Check Interactive / Clickable state
        const isInteractive = !isNotAllowed && !isTextInput && Boolean(
          el.closest?.(
            "button, a, [role='button'], [role='menuitem'], [role='tab'], [role='option'], [role='switch'], [role='checkbox'], [role='radio'], select, label, [data-account-id], .cursor-pointer, [data-cursor='interactive'], summary, input[type='checkbox'], input[type='radio'], input[type='button'], input[type='submit']"
          )
        );

        // 4. Check Drag / Grab state
        const isGrab = !isNotAllowed && Boolean(
          el.closest?.("[data-cursor='grab'], .cursor-grab, [draggable='true']")
        );

        const isGrabbingNow = isDraggingRef.current || Boolean(el.closest?.("[data-dragging='true'], .cursor-grabbing"));

        let nextKind: CursorKind = "default";
        if (isGrabbingNow) {
          nextKind = "grabbing";
        } else if (isNotAllowed) {
          nextKind = "not-allowed";
        } else if (isTextInput) {
          nextKind = "text";
        } else if (isGrab) {
          nextKind = "grab";
        } else if (isInteractive) {
          nextKind = "pointer";
        }

        if (nextKind !== cursorKindRef.current) {
          cursorKindRef.current = nextKind;
          setCursorKind(nextKind);
        }
      }
    };

    const onMouseDown = () => {
      setIsMouseDown(true);
      if (cursorKindRef.current === "grab") {
        cursorKindRef.current = "grabbing";
        setCursorKind("grabbing");
      }
    };

    const onMouseUp = () => {
      setIsMouseDown(false);
      if (cursorKindRef.current === "grabbing" && !isDraggingRef.current) {
        cursorKindRef.current = "grab";
        setCursorKind("grab");
      }
    };

    const onMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
      setIsMouseDown(false);
      setIsDragging(false);
      isDraggingRef.current = false;
      cursorKindRef.current = "default";
      setCursorKind("default");
      lastTargetRef.current = null;
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };

    const onDragStart = () => {
      isDraggingRef.current = true;
      setIsDragging(true);
      cursorKindRef.current = "grabbing";
      setCursorKind("grabbing");
    };

    const onDragEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      cursorKindRef.current = "grab";
      setCursorKind("grab");
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
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
      lastTargetRef.current = null;
    };
  }, [isActive]);

  if (!isActive) return null;

  const colorVal = resolveCursorColor(settings.color);
  const scale = resolveCursorScale(settings.size);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden transition-opacity duration-150 transform-gpu"
      style={{
        opacity: isVisible ? 1 : 0,
        contain: "layout style paint",
      }}
      aria-hidden="true"
    >
      {/* ── Ambient Spotlight Layer (Clean Luxury Flashlight, No Fuzzy Blobs) ── */}
      {settings.type === "ambient-spotlight" && (
        <div
          ref={spotlightRef}
          className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-200"
          style={{
            width: cursorKind === "text" ? "130px" : cursorKind === "pointer" ? "220px" : "180px",
            height: cursorKind === "text" ? "130px" : cursorKind === "pointer" ? "220px" : "180px",
            background: `radial-gradient(circle closest-side, color-mix(in srgb, ${colorVal} ${cursorKind === "text" ? "6%" : "9%"}, transparent), transparent 90%)`,
            opacity: isMouseDown ? 0.35 : 0.85,
          }}
        />
      )}

      {/* ── Main Adaptive Hardware-Synced Cursor Container ─────────────────── */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 will-change-transform pointer-events-none"
      >
        {/* ════ 1. TEXT INPUT VARIANT (Custom Glowing I-Beam) ════ */}
        {cursorKind === "text" && (
          <div
            className="relative transition-transform duration-75 ease-out origin-center"
            style={{
              transform: `translate(-7px, -11px) scale(${scale}) ${isMouseDown ? "scale(0.92)" : "scale(1)"}`,
            }}
          >
            <svg
              width="14"
              height="22"
              viewBox="0 0 14 22"
              fill="none"
              className="overflow-visible"
              style={{
                filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.85)) drop-shadow(0 0 4.5px ${colorVal})`,
              }}
            >
              {/* Outer high-contrast black boundary for light/dark surfaces */}
              <path
                d="M2.5 2.5 L11.5 2.5 M7 2.5 L7 19.5 M2.5 19.5 L11.5 19.5"
                stroke="#000000"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Clean white inner structure */}
              <path
                d="M2.5 2.5 L11.5 2.5 M7 2.5 L7 19.5 M2.5 19.5 L11.5 19.5"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              {/* Theme Accent Core Bar */}
              <path
                d="M7 3.5 L7 18.5"
                stroke={colorVal}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Subtle theme accent endpoints */}
              <circle cx="2.5" cy="2.5" r="0.8" fill={colorVal} />
              <circle cx="11.5" cy="2.5" r="0.8" fill={colorVal} />
              <circle cx="2.5" cy="19.5" r="0.8" fill={colorVal} />
              <circle cx="11.5" cy="19.5" r="0.8" fill={colorVal} />
            </svg>
          </div>
        )}

        {/* ════ 2. DISABLED / NOT-ALLOWED VARIANT ════ */}
        {cursorKind === "not-allowed" && (
          <div
            className="relative transition-transform duration-100 ease-out origin-top-left"
            style={{
              transform: `scale(${scale * 0.95})`,
            }}
          >
            <div className="filter grayscale opacity-65">
              {renderPointerArrow(settings.type, colorVal, false)}
            </div>
            <div className="absolute left-3.5 top-3.5 pointer-events-none">
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                }}
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  fill="#18181B"
                  stroke="#EF4444"
                  strokeWidth="1.5"
                />
                <line
                  x1="3.5"
                  y1="3.5"
                  x2="12.5"
                  y2="12.5"
                  stroke="#EF4444"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* ════ 3. GRAB / GRABBING VARIANT ════ */}
        {(cursorKind === "grab" || cursorKind === "grabbing") && (
          <div
            className="relative transition-transform duration-100 ease-out origin-center"
            style={{
              transform: `translate(-11px, -11px) scale(${scale}) ${cursorKind === "grabbing" || isMouseDown ? "scale(0.92)" : "scale(1.04)"}`,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="overflow-visible"
              style={{
                filter: `drop-shadow(0 2.5px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 5px ${colorVal})`,
              }}
            >
              {cursorKind === "grabbing" || isMouseDown ? (
                <>
                  <path
                    d="M10 11V8.5a1.5 1.5 0 0 1 3 0V11m-3 0a1.5 1.5 0 0 0-3 0v1m6-1a1.5 1.5 0 0 1 3 0v1m-9 0a1.5 1.5 0 0 0-1.5 1.5v1.5a5.5 5.5 0 0 0 11 0V12"
                    stroke="#000000"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 11V8.5a1.5 1.5 0 0 1 3 0V11m-3 0a1.5 1.5 0 0 0-3 0v1m6-1a1.5 1.5 0 0 1 3 0v1m-9 0a1.5 1.5 0 0 0-1.5 1.5v1.5a5.5 5.5 0 0 0 11 0V12"
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="11.5" cy="14" r="1.5" fill={colorVal} />
                </>
              ) : (
                <>
                  <path
                    d="M18 11V6a2 2 0 0 0-4 0v4 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M10 14a2 2 0 0 0 4 0v-4 M6 13v-1a2 2 0 0 0-4 0v7a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6v-4a2 2 0 0 0-4 0"
                    stroke="#000000"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 11V6a2 2 0 0 0-4 0v4 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M10 14a2 2 0 0 0 4 0v-4 M6 13v-1a2 2 0 0 0-4 0v7a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6v-4a2 2 0 0 0-4 0"
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="11.5" cy="15" r="1.5" fill={colorVal} opacity="0.9" />
                </>
              )}
            </svg>
            {isDragging && (
              <div className="absolute left-6 top-3 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider bg-accent text-white shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-1 border border-white/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                DRAGGING
              </div>
            )}
          </div>
        )}

        {/* ════ 4. INTERACTIVE POINTER & DEFAULT ARROW VARIANT ════ */}
        {(cursorKind === "default" || cursorKind === "pointer") && (
          <div
            className="relative transition-transform duration-100 ease-out origin-top-left"
            style={{
              transform: `scale(${scale}) ${
                isMouseDown
                  ? "scale(0.92)"
                  : cursorKind === "pointer"
                  ? "scale(1.08) rotate(-5deg)"
                  : "none"
              }`,
            }}
          >
            {renderPointerArrow(settings.type, colorVal, cursorKind === "pointer")}
          </div>
        )}
      </div>
    </div>
  );
}
