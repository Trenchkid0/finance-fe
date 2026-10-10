import React from "react";
import { cn } from "@/lib/utils/cn";

export type GhostMood = "idle" | "happy" | "thinking" | "spooky";

interface GhostAvatarProps {
  mood?: GhostMood;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  isFloating?: boolean;
  withAura?: boolean;
}

const SIZE_MAP = {
  xs: { width: 24, height: 26 },
  sm: { width: 32, height: 35 },
  md: { width: 44, height: 48 },
  lg: { width: 64, height: 70 },
  xl: { width: 88, height: 96 },
};

export const GhostAvatar: React.FC<GhostAvatarProps> = ({
  mood = "idle",
  size = "md",
  className,
  isFloating = false,
  withAura = true,
}) => {
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center select-none shrink-0",
        isFloating && "animate-ghost-float",
        className
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      {/* Spectral Aura Glow behind the ghost */}
      {withAura && (
        <div
          className={cn(
            "absolute -inset-1.5 rounded-full blur-md opacity-70 transition-all duration-500 pointer-events-none",
            mood === "happy" && "bg-gradient-to-tr from-cyan-500/40 via-purple-500/40 to-pink-500/50 animate-pulse",
            mood === "thinking" && "bg-gradient-to-tr from-indigo-500/40 via-purple-500/50 to-cyan-400/40",
            mood === "spooky" && "bg-gradient-to-tr from-purple-600/50 via-pink-500/50 to-amber-400/30",
            mood === "idle" && "bg-gradient-to-tr from-purple-500/30 via-indigo-500/30 to-cyan-500/35"
          )}
        />
      )}

      {/* SVG Ghost Vector Character (Kiro Editor inspired) */}
      <svg
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(168,85,247,0.35)] relative z-10 transition-transform duration-300"
      >
        <defs>
          {/* Body linear gradient: Spectral Pearl to Cosmic Purple */}
          <linearGradient id="kiroGhostBodyGrad" x1="20" y1="10" x2="80" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#f1f5f9" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#c084fc" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.92" />
          </linearGradient>

          {/* Inner body sheen */}
          <linearGradient id="ghostSheen" x1="50" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Neon eye glow */}
          <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Blush glow */}
          <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Floating shadow beneath ghost */}
        <ellipse cx="50" cy="106" rx="28" ry="4" fill="#000000" fillOpacity="0.18" className="blur-[1px]" />

        {/* Ghost Main Body Shape */}
        <path
          d="M 50 12
             C 24 12, 14 34, 14 56
             C 14 74, 15 90, 18 97
             C 21 104, 27 101, 31 96
             C 35 91, 40 92, 44 97
             C 48 102, 54 102, 58 97
             C 62 92, 67 91, 71 96
             C 75 101, 81 103, 84 97
             C 87 90, 86 74, 86 56
             C 86 34, 76 12, 50 12 Z"
          fill="url(#kiroGhostBodyGrad)"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.5"
        />

        {/* Highlight sheen curve on forehead */}
        <path
          d="M 32 20 C 42 16, 58 16, 68 20 C 72 22, 65 24, 50 24 C 35 24, 28 22, 32 20 Z"
          fill="url(#ghostSheen)"
        />

        {/* Ghost floating cute arms / hands */}
        {/* Left arm */}
        <path
          d="M 18 54 C 10 57, 10 65, 17 64 C 21 63, 23 58, 20 54 Z"
          fill="#f8fafc"
          opacity="0.9"
        />
        {/* Right arm */}
        <path
          d="M 82 54 C 90 57, 90 65, 83 64 C 79 63, 77 58, 80 54 Z"
          fill="#e2e8f0"
          opacity="0.9"
        />

        {/* Cute blush cheeks */}
        <circle cx="28" cy="56" r="6" fill="url(#blushGrad)" />
        <circle cx="72" cy="56" r="6" fill="url(#blushGrad)" />

        {/* Eyes according to mood */}
        {mood === "idle" && (
          <g filter="url(#eyeGlow)">
            {/* Left Eye */}
            <ellipse cx="36" cy="46" rx="5.5" ry="7.5" fill="#0f172a" />
            <circle cx="38" cy="43.5" r="2.6" fill="#38bdf8" />
            <circle cx="34.5" cy="48" r="1.2" fill="#ffffff" />

            {/* Right Eye */}
            <ellipse cx="64" cy="46" rx="5.5" ry="7.5" fill="#0f172a" />
            <circle cx="66" cy="43.5" r="2.6" fill="#38bdf8" />
            <circle cx="62.5" cy="48" r="1.2" fill="#ffffff" />

            {/* Cute Little Mouth */}
            <path
              d="M 47 55 Q 50 58 53 55"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {mood === "happy" && (
          <g filter="url(#eyeGlow)">
            {/* Happy Curved Eyes (^ ^) */}
            <path
              d="M 31 48 Q 36 39 41 48"
              stroke="#a855f7"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 59 48 Q 64 39 69 48"
              stroke="#a855f7"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Open Happy Mouth */}
            <path
              d="M 45 54 Q 50 63 55 54 Z"
              fill="#ec4899"
              stroke="#831843"
              strokeWidth="1.2"
            />
            {/* Little tongue */}
            <ellipse cx="50" cy="58" rx="2.2" ry="1.4" fill="#fbcfe8" />
          </g>
        )}

        {mood === "thinking" && (
          <g filter="url(#eyeGlow)">
            {/* Curious / Scanning Eyes */}
            <circle cx="36" cy="46" r="6" fill="#0f172a" />
            <circle cx="36" cy="46" r="3.2" fill="#818cf8" />
            <circle cx="37.5" cy="44.5" r="1.4" fill="#ffffff" />

            <circle cx="64" cy="44" r="6" fill="#0f172a" />
            <circle cx="64" cy="44" r="3.2" fill="#818cf8" />
            <circle cx="65.5" cy="42.5" r="1.4" fill="#ffffff" />

            {/* Little 'o' mouth */}
            <circle cx="50" cy="56" r="2.5" fill="#0f172a" />

            {/* Floating thought dot */}
            <circle cx="75" cy="24" r="2.2" fill="#c084fc" className="animate-ping" />
          </g>
        )}

        {mood === "spooky" && (
          <g filter="url(#eyeGlow)">
            {/* Spooky / Alert Glowing Eyes */}
            <ellipse cx="36" cy="46" rx="6.5" ry="8.5" fill="#450a0a" />
            <circle cx="36" cy="46" r="3.8" fill="#f43f5e" />
            <circle cx="38" cy="44" r="1.5" fill="#fef08a" />

            <ellipse cx="64" cy="46" rx="6.5" ry="8.5" fill="#450a0a" />
            <circle cx="64" cy="46" r="3.8" fill="#f43f5e" />
            <circle cx="66" cy="44" r="1.5" fill="#fef08a" />

            {/* Wavy Spooky Smile */}
            <path
              d="M 43 56 Q 47 52 50 56 Q 53 60 57 56"
              stroke="#e11d48"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
