import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { moneySafeLottieData } from "./moneySafeLottieData";
import { cn } from "@/lib/utils/cn";

interface MoneySafeLoaderProps {
  /** Label shown beneath the vector safe animation */
  label?: string;
  /** Render full-viewport loading screen (true) or inline/page fallback (false) */
  fullScreen?: boolean;
  /** Optional className override for the outer wrapper */
  className?: string;
  /** Optional className for the vector SVG container (scales freely without pixel rasterization) */
  vectorClassName?: string;
}

/**
 * Pure-vector, resolution-independent Lottie loading animation ("Money coming into safe").
 *
 * Strictly enforces vector rendering:
 * - Uses `renderer: "svg"` exclusively (never canvas or html/bitmap)
 * - Uses `viewBoxOnly: true` + `preserveAspectRatio: "xMidYMid meet"` so the SVG has no fixed pixel attributes
 * - Applies `shape-rendering="geometricPrecision"` and `setSubframe(true)` for continuous vector curves at any zoom/DPI
 */
export function MoneySafeLoader({
  label = "Loading...",
  fullScreen = false,
  className,
  vectorClassName,
}: MoneySafeLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const anim: AnimationItem = lottie.loadAnimation<"svg">({
      container,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: moneySafeLottieData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
        viewBoxOnly: true,
        progressiveLoad: false,
        hideOnTransparent: true,
        focusable: false,
        title: "Money entering safe animation",
      },
    });

    // Enable floating-point subframe interpolation for ultra-smooth vector motion
    anim.setSubframe(true);

    const applyGeometricPrecision = () => {
      const svgEl = container.querySelector("svg");
      if (svgEl) {
        svgEl.setAttribute("shape-rendering", "geometricPrecision");
        svgEl.setAttribute("text-rendering", "geometricPrecision");
        svgEl.style.width = "100%";
        svgEl.style.height = "100%";
        svgEl.style.display = "block";
        svgEl.style.overflow = "visible";
      }
    };

    applyGeometricPrecision();
    anim.addEventListener("DOMLoaded", applyGeometricPrecision);

    return () => {
      anim.removeEventListener("DOMLoaded", applyGeometricPrecision);
      anim.destroy();
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        fullScreen
          ? "flex h-screen w-screen items-center justify-center bg-background text-foreground font-mono"
          : "flex h-[60vh] w-full items-center justify-center font-mono",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          ref={containerRef}
          className={cn(
            fullScreen ? "size-28 sm:size-32" : "size-24",
            "[&_svg]:h-full [&_svg]:w-full",
            vectorClassName
          )}
          aria-hidden="true"
        />
        {label && (
          <span className="text-xs sm:text-sm text-muted-foreground tracking-wide animate-pulse">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
