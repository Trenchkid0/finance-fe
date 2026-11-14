import React, { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import type { NetWorthPoint } from "./NetWorthHero";

interface Props {
  series: NetWorthPoint[];
  hoverPoint: NetWorthPoint | null;
  setHoverPoint: (p: NetWorthPoint | null) => void;
  lineColor: string;
  yDomain: [number, number];
  isId: boolean;
  chartType?: "line" | "bar";
}

// Custom active dot component for a crisp vector indicator without continuous SVG ping repaint
const CustomActiveDot = (props: any) => {
  const { cx, cy, stroke } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      {/* 1. Soft outer halo ring */}
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill={stroke}
        fillOpacity={0.14}
      />
      {/* 2. Concentric accent stroke ring */}
      <circle
        cx={cx}
        cy={cy}
        r={7.5}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeOpacity={0.65}
      />
      {/* 3. Solid center white core */}
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={1.5}
      />
    </g>
  );
};

// Premium tooltip that dynamically adapts to Dark & Light theme
const CustomTooltip = ({ active, payload, hoverPoint, setHoverPoint }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as NetWorthPoint;
  
  if (hoverPoint?.date !== p.date) {
    queueMicrotask(() => setHoverPoint(p));
  }

  return (
    <div className="relative rounded-2xl border border-border/60 bg-card/95 dark:bg-[#0D1117]/95 px-4 py-3 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.7)]">
      {/* Horizontal glowing gradient line top-border decoration */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      
      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-sans">
        {formatDateShort(p.date)}
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        <p className="font-mono tabular-nums font-black text-foreground text-sm">
          {formatIDR(p.value)}
        </p>
      </div>
    </div>
  );
};

// Custom shape: 3D Isometric Column
// Three polygon faces (front, right-side, top diamond cap) with
// directional gradient shading to simulate depth and lighting
const CustomBarShape = (props: any) => {
  const { x, y, width, height, index, hoveredIndex } = props;
  if (height <= 0) return null;

  const fw = Math.max(8, Math.min(width * 0.5, 20)); // front face width
  const depth = fw * 0.45; // isometric depth offset
  const cx = x + width / 2;
  const isHovered = hoveredIndex === index;

  // Front face (left-facing parallelogram)
  const fTL = { x: cx - fw / 2, y: y };
  const fTR = { x: cx + fw / 2, y: y };
  const fBR = { x: cx + fw / 2, y: y + height };
  const fBL = { x: cx - fw / 2, y: y + height };

  // Right side face (right-facing parallelogram, offset by depth)
  const rTL = fTR;
  const rTR = { x: fTR.x + depth, y: fTR.y - depth * 0.6 };
  const rBR = { x: fBR.x + depth, y: fBR.y - depth * 0.6 };
  const rBL = fBR;

  // Top face (diamond/parallelogram cap)
  const tBL = fTL;
  const tBR = fTR;
  const tTR = rTR;
  const tTL = { x: fTL.x + depth, y: fTL.y - depth * 0.6 };

  const pts = (arr: { x: number; y: number }[]) =>
    arr.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <g>
      {/* 1. Ground shadow (subtle) */}
      <ellipse
        cx={cx + depth / 2}
        cy={y + height + 2}
        rx={fw / 2 + 2}
        ry={2}
        fill="var(--accent)"
        fillOpacity={isHovered ? 0.12 : 0.05}
      />

      {/* 2. Front face — brightest, primary gradient */}
      <polygon
        points={pts([fTL, fTR, fBR, fBL])}
        fill="url(#face3dFront)"
        stroke="var(--accent)"
        strokeWidth={0.6}
        strokeOpacity={isHovered ? 0.6 : 0.2}
        fillOpacity={isHovered ? 1 : 0.85}
        className="transition-opacity duration-150"
      />

      {/* 3. Right side face — darker, simulates shadow side */}
      <polygon
        points={pts([rTL, rTR, rBR, rBL])}
        fill="url(#face3dRight)"
        stroke="var(--accent)"
        strokeWidth={0.6}
        strokeOpacity={isHovered ? 0.5 : 0.15}
        fillOpacity={isHovered ? 1 : 0.85}
        className="transition-opacity duration-150"
      />

      {/* 4. Top cap face — brightest, simulates light hitting from above */}
      <polygon
        points={pts([tBL, tBR, tTR, tTL])}
        fill="var(--accent)"
        fillOpacity={isHovered ? 0.9 : 0.5}
        stroke={isHovered ? "#ffffff" : "var(--accent)"}
        strokeWidth={isHovered ? 1.2 : 0.6}
        strokeOpacity={isHovered ? 0.8 : 0.3}
        className="transition-opacity duration-150"
      />

      {/* 5. Front face vertical highlight edge (left) */}
      <line
        x1={fTL.x}
        y1={fTL.y}
        x2={fBL.x}
        y2={fBL.y}
        stroke="#ffffff"
        strokeWidth={1}
        strokeOpacity={isHovered ? 0.3 : 0.08}
      />

      {/* 6. Top cap leading edge on hover */}
      {isHovered && (
        <line
          x1={tTL.x}
          y1={tTL.y}
          x2={tTR.x}
          y2={tTR.y}
          stroke="#ffffff"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      )}
    </g>
  );
};

export const NetWorthHeroChart = React.memo(function NetWorthHeroChart({
  series,
  hoverPoint,
  setHoverPoint,
  lineColor,
  yDomain,
  isId,
  chartType = "line",
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (series.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        {isId
          ? "Belum cukup data untuk periode ini."
          : "Not enough data for this period."}
      </div>
    );
  }

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={series}
          margin={{ top: 18, right: 16, left: 16, bottom: 4 }}
          onMouseMove={(state: any) => {
            if (state?.activeTooltipIndex !== undefined) {
              setHoveredIndex(state.activeTooltipIndex);
              if (series[state.activeTooltipIndex]) {
                setHoverPoint(series[state.activeTooltipIndex]);
              }
            }
          }}
          onMouseLeave={() => {
            setHoveredIndex(null);
            setHoverPoint(null);
          }}
          accessibilityLayer
        >
          <defs>
            {/* Front face gradient: bright accent top → fades down */}
            <linearGradient id="face3dFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.7} />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.08} />
            </linearGradient>

            {/* Right side face gradient: darker to simulate shadow */}
            <linearGradient id="face3dRight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="2 8"
            stroke="var(--border)"
            vertical={true}
            horizontal={true}
            opacity={0.16}
          />

          <YAxis hide domain={yDomain} />
          
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(d) => formatDateShort(d as string)}
            fontSize={9}
            stroke="var(--foreground)"
            opacity={0.4}
            dy={4}
            interval="preserveStartEnd"
          />

          <Tooltip
            cursor={false}
            content={
              <CustomTooltip
                hoverPoint={hoverPoint}
                setHoverPoint={setHoverPoint}
                isId={isId}
              />
            }
          />

          <Bar
            dataKey="value"
            isAnimationActive={false}
            shape={<CustomBarShape hoveredIndex={hoveredIndex} />}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={series}
        margin={{ top: 12, right: 16, left: 16, bottom: 4 }}
        onMouseLeave={() => setHoverPoint(null)}
        accessibilityLayer
      >
        <defs>
          {/* Sci-fi laser cursor gradient (fades down) */}
          <linearGradient id="laserCursor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.8} />
            <stop offset="40%" stopColor="var(--accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>

          {/* Area under the chart smooth cyber gradient */}
          <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
            <stop offset="40%" stopColor="var(--accent)" stopOpacity={0.06} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.00} />
          </linearGradient>
        </defs>

        {/* 1. Precision grid intersections (dot matrix style) */}
        <CartesianGrid
          strokeDasharray="2 8"
          stroke="var(--border)"
          vertical={true}
          horizontal={true}
          opacity={0.16}
        />

        <YAxis hide domain={yDomain} />
        
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickFormatter={(d) => formatDateShort(d as string)}
          fontSize={9}
          stroke="var(--foreground)"
          opacity={0.4}
          dy={4}
          interval="preserveStartEnd"
        />

        <Tooltip
          cursor={{
            stroke: "url(#laserCursor)",
            strokeWidth: 1.5,
            strokeDasharray: "none",
          }}
          content={
            <CustomTooltip
              hoverPoint={hoverPoint}
              setHoverPoint={setHoverPoint}
              isId={isId}
            />
          }
        />

        {/* 2. Cyber Area Fill */}
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill="url(#netWorthFill)"
          isAnimationActive={false}
          connectNulls
        />

        {/* 3. Vector halo stroke path (zero feGaussianBlur cost) */}
        <Area
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={6}
          strokeOpacity={0.14}
          fill="none"
          isAnimationActive={false}
          connectNulls
        />

        {/* 4. Crisp high-contrast foreground line */}
        <Area
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          fill="none"
          isAnimationActive={false}
          activeDot={<CustomActiveDot />}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
