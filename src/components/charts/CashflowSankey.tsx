import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyExtraProperties,
} from "d3-sankey";
import { formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
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
}

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

export const CashflowSankey = memo(function CashflowSankey({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { language } = useLanguage();
  const isId = language === "id";

  // Chart dimensions
  const chartHeight = Math.max(320, (data?.outflow || []).length * 40);

  // Resize observer — sankey butuh width fixed, jadi kita observe dan
  // re-render saat container berubah (mis. user collapse sidebar).
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setChartWidth(Math.max(300, w));
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const [chartWidth, setChartWidth] = useState<number>(940);

  const hasData = (data?.inflow || []).length > 0 || (data?.outflow || []).length > 0;

  return (
    <Card
      className="group p-5 space-y-4 hover:border-hover-border transition-colors duration-200"
      aria-label="Cash Flow Sankey Diagram"
      role="region"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-foreground transition-colors duration-200 group-hover:text-accent">
          {isId ? "Arus kas" : "Cash flow"}
        </h2>
      </div>

      {/* Scrollable wrapper for mobile */}
      <div className="overflow-x-auto -mx-5 px-5">
        <div className="min-w-[600px]">
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
          <SankeyChart data={data} width={chartWidth} height={chartHeight} />
        ) : (
          <div className="h-64 flex items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-foreground">
                {isId ? "Belum cukup data" : "Not enough data"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isId
                  ? "Tambahkan transaksi untuk melihat arus kas Anda."
                  : "Add transactions to see your cash flow."}
              </p>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </Card>
  );
});

const SankeyChart = memo(function SankeyChart({
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
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const svgRectRef = useRef<DOMRect | null>(null);

  const { graph, linkPath } = useMemo(() => {
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

    const computedGraph = gen({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    });

    return {
      graph: computedGraph,
      linkPath: sankeyLinkHorizontal<SankeyNode, SankeyLink>(),
    };
  }, [data, width, height]);

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

            return (
              <path
                key={`link-${i}`}
                d={linkPath(link) ?? ""}
                stroke={`url(#sankey-grad-${i})`}
                strokeWidth={strokeWidthVal}
                opacity={opacityVal}
                className="cursor-pointer transition-opacity duration-150"
                onMouseEnter={(e) => {
                  setHoveredLinkId(i);
                  const svgEl = e.currentTarget.ownerSVGElement;
                  const rect = svgEl ? svgEl.getBoundingClientRect() : null;
                  svgRectRef.current = rect;
                  const x = rect ? e.clientX - rect.left : e.clientX;
                  const y = rect ? e.clientY - rect.top : e.clientY;
                  setHoveredLink({
                    sourceName: srcName,
                    targetName: tgtName,
                    value: link.value,
                    percentText,
                  });
                  requestAnimationFrame(() => {
                    if (tooltipRef.current) {
                      tooltipRef.current.style.transform = `translate3d(${x + 15}px, ${y + 15}px, 0)`;
                    }
                  });
                }}
                onMouseMove={(e) => {
                  if (!tooltipRef.current) return;
                  const rect = svgRectRef.current;
                  const x = rect ? e.clientX - rect.left : e.clientX;
                  const y = rect ? e.clientY - rect.top : e.clientY;
                  tooltipRef.current.style.transform = `translate3d(${x + 15}px, ${y + 15}px, 0)`;
                }}
                onMouseLeave={() => {
                  setHoveredLinkId(null);
                  setHoveredLink(null);
                  svgRectRef.current = null;
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
                  className="transition-opacity duration-200 group-hover/node:opacity-90"
                >
                  <title>
                    {n.name}: {formatIDR(n.value ?? 0)}
                  </title>
                </rect>
                {/* Hover outline effect */}
                <rect
                  x={x0 - 2}
                  y={y0 - 2}
                  width={Math.max(2, w) + 4}
                  height={Math.max(2, h) + 4}
                  fill="none"
                  stroke={n.color}
                  strokeWidth="1.5"
                  rx={4}
                  opacity="0"
                  className="transition-opacity duration-200 group-hover/node:opacity-50"
                />
                <text
                  x={labelX}
                  y={(y0 + y1) / 2}
                  dy="-0.2em"
                  textAnchor={anchor}
                  className="fill-foreground transition-colors duration-200 group-hover/node:fill-accent"
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                  {n.name}
                </text>
                <text
                  x={labelX}
                  y={(y0 + y1) / 2}
                  dy="1em"
                  textAnchor={anchor}
                  className="fill-muted-foreground font-mono transition-colors duration-200 group-hover/node:fill-foreground"
                  style={{ fontSize: 10 }}
                >
                  {formatIDR(n.value ?? 0)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
 
      {/* Custom Floating Tooltip (Hardware-accelerated via ref transform, zero React re-renders on mousemove) */}
      {hoveredLink && (
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute top-0 left-0 z-50 rounded-xl border border-border/60 bg-popover/95 p-3.5 shadow-xl text-xs space-y-1.5 min-w-[200px] will-change-transform"
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
});
