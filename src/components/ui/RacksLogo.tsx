import React from "react";
import { cn } from "@/lib/utils/cn";

interface RacksLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  wordmarkClassName?: string;
}

const SIZE_PX: Record<NonNullable<RacksLogoProps["size"]>, number> = {
  xs: 28,
  sm: 34,
  md: 40,
  lg: 48,
  xl: 60,
};

/**
 * RacksLogo — Pure SVG resolution-independent brand identity for Racks Finance.
 *
 * Metaphor: "The Sovereign Flow"
 * Three fluid, interlocking silk ribbons forming an organic 'R' and ascending
 * wealth waves wrapping around a protected emerald core.
 */
export const RacksLogo: React.FC<RacksLogoProps> = ({
  size = "md",
  showWordmark = false,
  subtitle,
  className,
  wordmarkClassName,
}) => {
  const uid = React.useId().replace(/:/g, "");
  const dim = SIZE_PX[size] || SIZE_PX.md;

  const bgGradId = `racksBg-${uid}`;
  const rimGradId = `racksRim-${uid}`;
  const ribbonPrimaryId = `racksRibbonPrimary-${uid}`;
  const ribbonSecondaryId = `racksRibbonSecondary-${uid}`;
  const ribbonAccentId = `racksRibbonAccent-${uid}`;
  const coreGlowId = `racksCore-${uid}`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 select-none group/racks-logo",
        className
      )}
    >
      {/* Pure Vector SVG Mark */}
      <div
        className="relative shrink-0 transition-transform duration-300 ease-out group-hover/racks-logo:scale-[1.04] group-hover/racks-logo:-rotate-2"
        style={{ width: dim, height: dim }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
          shapeRendering="geometricPrecision"
          aria-label="Racks Finance Logo"
        >
          <defs>
            {/* Deep Obsidian-Slate Squircle Surface */}
            <linearGradient
              id={bgGradId}
              x1="8"
              y1="4"
              x2="56"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#131926" />
              <stop offset="55%" stopColor="#0B0F19" />
              <stop offset="100%" stopColor="#06080E" />
            </linearGradient>

            {/* Luminous Outer Squircle Rim */}
            <linearGradient
              id={rimGradId}
              x1="6"
              y1="4"
              x2="58"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.45" />
            </linearGradient>

            {/* Ribbon 1 (Upper Cresting Wave / R-Loop): Electric Accent to Ice White */}
            <linearGradient
              id={ribbonPrimaryId}
              x1="14"
              y1="48"
              x2="48"
              y2="14"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="55%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>

            {/* Ribbon 2 (Ascending Wealth Tail): Emerald to Cyan */}
            <linearGradient
              id={ribbonSecondaryId}
              x1="22"
              y1="34"
              x2="52"
              y2="46"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>

            {/* Ribbon 3 (Inner Depth Fold): Deep Accent Shadow */}
            <linearGradient
              id={ribbonAccentId}
              x1="16"
              y1="18"
              x2="32"
              y2="52"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.25" />
            </linearGradient>

            {/* Sovereign Core Orb Gradient */}
            <radialGradient
              id={coreGlowId}
              cx="50%"
              cy="40%"
              r="60%"
              fx="35%"
              fy="35%"
            >
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#10b981" />
            </radialGradient>
          </defs>

          {/* 1. Organic Superellipse (Continuous-Curvature Squircle) Base */}
          <path
            d="M 32 3
               C 51 3, 61 13, 61 32
               C 61 51, 51 61, 32 61
               C 13 61, 3 51, 3 32
               C 3 13, 13 3, 32 3 Z"
            fill={`url(#${bgGradId})`}
            stroke={`url(#${rimGradId})`}
            strokeWidth="1.6"
          />

          {/* 2. Subtle Inner Top-Left Specular Arc */}
          <path
            d="M 14 10 C 22 6.5, 42 6.5, 50 10"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* 3. Lower-Left Ascending Stem Fold (Creates 3D Ribbon Twist) */}
          <path
            d="M 17 48
               C 15.5 39, 16.5 25, 22 18.5
               C 25.5 14.5, 29.5 14, 31 18
               C 25 22, 23.5 34, 24.5 45
               C 25 49, 18.5 51.5, 17 48 Z"
            fill={`url(#${ribbonAccentId})`}
          />

          {/* 4. Secondary Interlocking Stream (Fluid Upward-Sweeping Tail of the 'R') */}
          <path
            d="M 25.5 33.5
               C 31 32, 36.5 34.5, 40.5 40
               C 43.5 44, 46.5 45.5, 50.5 41.5
               C 52 40, 53.5 41.5, 52.5 44
               C 49.5 50.5, 41.5 51.5, 35.5 45.5
               C 31.5 41.5, 28.5 38.5, 24 38
               C 21.5 37.7, 22.5 34.3, 25.5 33.5 Z"
            fill={`url(#${ribbonSecondaryId})`}
          />

          {/* 5. Primary Sweeping Silk Ribbon (Organic Arch & Loop of the 'R') */}
          <path
            d="M 17.5 47.5
               C 16.5 35, 19.5 19.5, 29.5 14.5
               C 38.5 10, 49.5 14.5, 49.5 24
               C 49.5 32.5, 41 37.5, 29.5 36.5
               C 25.5 36.1, 25.5 31.5, 29.5 31.5
               C 37 31.5, 42.5 28.5, 42.5 23.8
               C 42.5 18.5, 36.5 16.5, 31 19.5
               C 24.5 23, 23.5 35, 24.2 46.5
               C 24.5 50.5, 18 51, 17.5 47.5 Z"
            fill={`url(#${ribbonPrimaryId})`}
          />

          {/* 6. Sovereign Emerald Core (Floating Seed of Wealth inside the Loop) */}
          <circle
            cx="33.5"
            cy="25.2"
            r="3.6"
            fill={`url(#${coreGlowId})`}
          />

          {/* 7. Rising Spark Dot (Top-Right Momentum Accent) */}
          <circle
            cx="49.5"
            cy="13.5"
            r="1.8"
            fill="#6ee7b7"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Optional Wordmark */}
      {showWordmark && (
        <div className={cn("flex flex-col", wordmarkClassName)}>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[17px] font-extrabold tracking-tight text-foreground">
              Racks
            </span>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
              FINANCE
            </span>
          </div>
          {subtitle && (
            <span className="text-[10.5px] text-muted-foreground font-medium tracking-wide mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
