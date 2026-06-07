"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyExtraProperties,
} from "d3-sankey";
import { formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/contexts/LanguageContext";

/**
 * Cashflow sankey — pola Maybe Finance asli.
 *
 *   Income ────┐
 *               ╲
 *   Salary ────  Cash Flow ──── Food
 *               ╱             └── Shopping
 *   Bonus  ────              └── Surplus
 *
 * Source flow (kiri) = pemasukan per kategori → Cash Flow node tengah →
 * outflow per kategori (kanan) + Surplus.
 *
 * Pakai d3-sankey karena Recharts tidak punya layout sankey out of the
 * box. Dependency kecil (~15KB gzip).
 */

export interface SankeyDatum {
  /** Node label (mis. "Gaji", "Makanan & Minuman"). */
  name: string;
  /** Sumbu mana node ini muncul. */
  side: "source" | "target";
  /** Total IDR yang mengalir lewat node ini. */
  value: number;
  /** Hex color untuk node + link yang berasal/menuju ke sini. */
  color: string;
}

export interface CashflowData {
  /** Total uang yang lewat (= total inflow = total outflow + surplus). */
  total: number;
  inflow: SankeyDatum[];
  outflow: SankeyDatum[];
  /** Sisa positif setelah outflow; ditampilkan sebagai node hijau. */
  surplus: number;
}

interface Props {
  data: CashflowData;
  /** Periode aktif (sinkron dengan NetWorthHero), URL param `cashflow_period`. */
  period: "1d" | "7d" | "30d" | "90d" | "ytd" | "365d" | "5y";
}

const PERIOD_OPTIONS: { value: Props["period"]; label: string }[] = [
  { value: "1d", label: "1H" },
  { value: "7d", label: "7H" },
  { value: "30d", label: "30H" },
  { value: "90d", label: "90H" },
  { value: "ytd", label: "YTD" },
  { value: "365d", label: "365H" },
  { value: "5y", label: "5T" },
];

const SUCCESS_COLOR = "var(--income)";
const PRIMARY_BLUE = "var(--accent)";

/**
 * Palette bertingkat untuk node sankey yang dibangun secara dinamis dari warna aksen tema.
 * Diatur dari paling terang ke paling redup supaya visual flow terasa konsisten dan reaktif.
 */
const BLUE_PALETTE = [
  "var(--accent)",
  "color-mix(in srgb, var(--accent) 85%, #000000)",
  "color-mix(in srgb, var(--accent) 70%, #000000)",
  "color-mix(in srgb, var(--accent) 55%, #000000)",
  "color-mix(in srgb, var(--accent) 40%, #000000)",
  "color-mix(in srgb, var(--accent) 75%, #ffffff)",
  "color-mix(in srgb, var(--accent) 60%, #ffffff)",
  "color-mix(in srgb, var(--accent) 45%, #ffffff)",
];

interface SankeyNode extends SankeyExtraProperties {
  name: string;
  color: string;
  value: number;
}

interface SankeyLink extends SankeyExtraProperties {
  source: number;
  target: number;
  value: number;
  color: string;
}

export function CashflowSankey({ data, period }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(940);

  // Resize observer — sankey butuh width fixed, jadi kita observe dan
  // re-render saat container berubah (mis. user collapse sidebar).
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setWidth(w);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  function setPeriod(next: Props["period"]) {
    const params = new URLSearchParams(searchParams);
    if (next === "30d") params.delete("cashflow_period");
    else params.set("cashflow_period", next);
    const qs = params.toString();
    startTransition(() => navigate(qs ? `${pathname}?${qs}` : pathname));
  }

  const hasData = (data?.inflow || []).length > 0 || (data?.outflow || []).length > 0;

  return (
    <section
      className="group rounded-xl border border-border bg-card p-5 space-y-4 hover:border-white/[0.12] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300"
      aria-label="Cash Flow Sankey Diagram"
      role="region"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-foreground transition-colors duration-300 group-hover:text-accent">Arus kas</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              disabled={pending}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-text-primary hover:bg-white/[0.04] bg-white/[0.03] border border-white/[0.08] transition-all"
            >
              <span>{PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px] rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
            {PERIOD_OPTIONS.map((o) => (
              <DropdownMenuItem
                key={o.value}
                className="text-xs font-semibold cursor-pointer"
                onSelect={() => setPeriod(o.value)}
              >
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={containerRef}
        className="w-full"
        role="img"
        aria-label={hasData
          ? `Cash flow diagram showing ${formatIDR(data.total)} total flow with ${(data.inflow || []).length} income sources and ${(data.outflow || []).length} expense categories`
          : "No cash flow data available for this period"
        }
      >
        {hasData ? (
          <SankeyChart data={data} width={width} height={Math.max(320, (data.outflow || []).length * 40)} />
        ) : (
          <div className="h-64 flex items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-foreground">
                Belum cukup data
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tambahkan transaksi untuk melihat arus kas Anda.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SankeyChart({
  data,
  width,
  height,
}: {
  data: CashflowData;
  width: number;
  height: number;
}) {
  const { language } = useLanguage();
  const [hoveredLinkId, setHoveredLinkId] = useState<number | null>(null);
  const [hoveredLink, setHoveredLink] = useState<{
    sourceName: string;
    targetName: string;
    value: number;
    percentText: string;
    x: number;
    y: number;
  } | null>(null);

  // Susun nodes & links dengan index numerik supaya d3-sankey happy.
  // Layout:
  //   inflow nodes (kiri) → "Arus Kas" (tengah) → outflow nodes (kanan)
  //   ditambah "Surplus" node di kanan kalau positif.
  //
  // Color strategy: pakai shade biru dari BLUE_PALETTE secara siklik
  // berdasarkan urutan biggest-first, sehingga node terbesar dapat warna
  // paling kuat. Cash Flow node tengah & Surplus pakai brand blue.

  const inflowColored = (data.inflow || []).map((n, i) => ({
    ...n,
    color: BLUE_PALETTE[i % BLUE_PALETTE.length],
  }));
  const outflowColored = (data.outflow || []).map((n, i) => ({
    ...n,
    color: BLUE_PALETTE[i % BLUE_PALETTE.length],
  }));

  const nodes: SankeyNode[] = [
    { name: "Arus Kas", color: PRIMARY_BLUE, value: data.total },
    ...inflowColored.map((n) => ({ name: n.name, color: n.color, value: n.value })),
    ...outflowColored.map((n) => ({ name: n.name, color: n.color, value: n.value })),
  ];

  if (data.surplus > 0) {
    nodes.push({ name: "Surplus", color: SUCCESS_COLOR, value: data.surplus });
  }

  const links: SankeyLink[] = [];
  let idx = 1;
  // Inflow → Cash Flow (source kiri)
  for (const n of inflowColored) {
    links.push({ source: idx, target: 0, value: n.value, color: n.color });
    idx++;
  }
  // Cash Flow → Outflow (target kanan)
  for (const n of outflowColored) {
    links.push({ source: 0, target: idx, value: n.value, color: n.color });
    idx++;
  }
  // Cash Flow → Surplus (kalau ada)
  if (data.surplus > 0) {
    links.push({
      source: 0,
      target: idx,
      value: data.surplus,
      color: SUCCESS_COLOR,
    });
  }

  const gen = sankey<SankeyNode, SankeyLink>()
    .nodeWidth(14)
    .nodePadding(20)
    .extent([
      [120, 8],
      [Math.max(width, 600) - 120, height - 8],
    ]);

  const graph = gen({
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({ ...l })),
  });

  const linkPath = sankeyLinkHorizontal<SankeyNode, SankeyLink>();

  return (
    <div className="relative w-full overflow-visible">
      <svg width="100%" height={height} viewBox={`0 0 ${Math.max(width, 600)} ${height}`}>
        <defs>
          {graph.links.map((link, i) => {
            const src = link.source as SankeyNode & { x1?: number };
            const tgt = link.target as SankeyNode & { x0?: number };
            return (
              <linearGradient
                key={`grad-${i}`}
                id={`sankey-grad-${i}`}
                gradientUnits="userSpaceOnUse"
                x1={src.x1 ?? 0}
                x2={tgt.x0 ?? 0}
              >
                <stop
                  offset="0%"
                  stopColor={(link.source as SankeyNode).color}
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor={(link.target as SankeyNode).color}
                  stopOpacity={0.35}
                />
              </linearGradient>
            );
          })}
        </defs>

        {/* Links */}
        <g fill="none">
          {graph.links.map((link, i) => {
            const srcName = (link.source as SankeyNode).name;
            const tgtName = (link.target as SankeyNode).name;
            const isIncoming = srcName !== "Arus Kas";
            const percent = data.total > 0 ? (link.value / data.total) * 100 : 0;
            const percentText = isIncoming
              ? (language === "id" ? `${percent.toFixed(1)}% dari Total Pemasukan` : `${percent.toFixed(1)}% of Total Income`)
              : (language === "id" ? `${percent.toFixed(1)}% dari Total Alokasi` : `${percent.toFixed(1)}% of Total Allocation`);

            const isHovered = hoveredLinkId === i;
            const isAnyHovered = hoveredLinkId !== null;
            const opacityVal = isHovered ? 0.95 : isAnyHovered ? 0.15 : 0.65;
            const strokeWidthVal = isHovered ? Math.max(2, (link.width ?? 1) + 2) : Math.max(1, link.width ?? 1);
            const glowColor = (link.target as SankeyNode).color;

            return (
              <path
                key={`link-${i}`}
                d={linkPath(link) ?? ""}
                stroke={`url(#sankey-grad-${i})`}
                strokeWidth={strokeWidthVal}
                opacity={opacityVal}
                className="cursor-pointer transition-all duration-300"
                style={{
                  filter: isHovered
                    ? `drop-shadow(0 0 6px ${glowColor}cc)`
                    : 'drop-shadow(0 0 1px rgba(0,0,0,0.15))',
                }}
                onMouseEnter={(e) => {
                  setHoveredLinkId(i);
                  const svgEl = e.currentTarget.ownerSVGElement;
                  const rect = svgEl ? svgEl.getBoundingClientRect() : null;
                  const x = rect ? e.clientX - rect.left : e.clientX;
                  const y = rect ? e.clientY - rect.top : e.clientY;
                  setHoveredLink({
                    sourceName: srcName,
                    targetName: tgtName,
                    value: link.value,
                    percentText,
                    x,
                    y,
                  });
                }}
                onMouseMove={(e) => {
                  const svgEl = e.currentTarget.ownerSVGElement;
                  const rect = svgEl ? svgEl.getBoundingClientRect() : null;
                  const x = rect ? e.clientX - rect.left : e.clientX;
                  const y = rect ? e.clientY - rect.top : e.clientY;
                  setHoveredLink((prev) =>
                    prev ? { ...prev, x, y } : null
                  );
                }}
                onMouseLeave={() => {
                  setHoveredLinkId(null);
                  setHoveredLink(null);
                }}
              />
            );
          })}
        </g>
 
        {/* Nodes */}
        <g>
          {graph.nodes.map((n, i) => {
            const x0 = n.x0 ?? 0;
            const x1 = n.x1 ?? 0;
            const y0 = n.y0 ?? 0;
            const y1 = n.y1 ?? 0;
            const w = x1 - x0;
            const h = y1 - y0;
            const isLeft = x0 < width / 2;
            const labelX = isLeft ? x1 + 8 : x0 - 8;
            const anchor = isLeft ? "start" : "end";
 
            return (
              <g key={`node-${i}`} className="group/node cursor-pointer">
                <rect
                  x={x0}
                  y={y0}
                  width={Math.max(2, w)}
                  height={Math.max(2, h)}
                  fill={n.color}
                  rx={3}
                  className="transition-all duration-300"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  }}
                >
                  <title>
                    {n.name}: {formatIDR(n.value ?? 0)}
                  </title>
                  <animate
                    attributeName="opacity"
                    values="1;0.85;1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </rect>
                {/* Hover glow effect */}
                <rect
                  x={x0 - 2}
                  y={y0 - 2}
                  width={Math.max(2, w) + 4}
                  height={Math.max(2, h) + 4}
                  fill="none"
                  stroke={n.color}
                  strokeWidth="2"
                  rx={4}
                  opacity="0"
                  className="transition-opacity duration-300 group-hover/node:opacity-50"
                />
                <text
                  x={labelX}
                  y={(y0 + y1) / 2}
                  dy="-0.2em"
                  textAnchor={anchor}
                  className="fill-foreground transition-all duration-300 group-hover/node:fill-accent group-hover/node:font-bold"
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                  {n.name}
                </text>
                <text
                  x={labelX}
                  y={(y0 + y1) / 2}
                  dy="1em"
                  textAnchor={anchor}
                  className="fill-muted-foreground font-mono transition-all duration-300 group-hover/node:fill-foreground group-hover/node:font-bold"
                  style={{ fontSize: 10 }}
                >
                  {formatIDR(n.value ?? 0)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
 
      {/* Custom Floating Tooltip */}
      {hoveredLink && (
        <div
          className="pointer-events-none absolute z-50 rounded-xl border border-white/[0.08] bg-[#1C2128]/95 backdrop-blur-xl p-3.5 shadow-2xl shadow-black/80 text-xs space-y-1.5 min-w-[200px]"
          style={{
            left: `${hoveredLink.x + 15}px`,
            top: `${hoveredLink.y + 15}px`,
          }}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[9px] font-bold uppercase tracking-wider">
            <span>{hoveredLink.sourceName}</span>
            <span className="text-accent">→</span>
            <span>{hoveredLink.targetName}</span>
          </div>
          <div className="font-mono font-bold text-foreground text-sm">
            {formatIDR(hoveredLink.value)}
          </div>
          <div className="text-[10px] text-accent font-semibold font-mono">
            {hoveredLink.percentText}
          </div>
        </div>
      )}
    </div>
  );
}
