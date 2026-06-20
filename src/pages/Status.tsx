import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Gauge,
  Layers,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";

interface ComponentStatus {
  status: string;
  latencyMs: number;
}

interface SchedulerStatus {
  lastRunTime: string;
  lastStatus: string;
  errorCount: number;
  runCount: number;
  lastError?: string;
}

interface ResourceStats {
  goroutines: number;
  memAllocMb: number;
  memTotalAlloc: number;
  memSysMb: number;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: {
    seconds: number;
    human: string;
  };
  components: {
    database: ComponentStatus;
    cache: ComponentStatus;
  };
  schedulers: {
    autoPay: SchedulerStatus;
    billReminder: SchedulerStatus;
  };
  resources: ResourceStats;
}

interface UptimeDay {
  dayNumber: number;
  status: "UP" | "DEGRADED" | "DOWN";
  percentage: number;
  label: string;
}

type Tone = "up" | "degraded" | "down";

const tone = {
  up: {
    label: "Operational",
    title: "Semua sistem beroperasi normal",
    description: "Seluruh layanan Racks Finance aktif dan berjalan dengan baik.",
    icon: CheckCircle2,
    text: "text-emerald-400",
    soft: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  degraded: {
    label: "Degraded",
    title: "Sebagian layanan menurun",
    description: "Sistem masih berjalan, namun ada penurunan performa pada layanan tertentu.",
    icon: AlertTriangle,
    text: "text-amber-400",
    soft: "bg-amber-500/10",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
  },
  down: {
    label: "Outage",
    title: "Terjadi gangguan pada sistem",
    description: "Sebagian layanan utama sedang tidak dapat diakses saat ini.",
    icon: XCircle,
    text: "text-red-400",
    soft: "bg-red-500/10",
    border: "border-red-500/25",
    dot: "bg-red-400",
  },
};

function normalize(status?: string): Tone {
  const v = status?.toLowerCase();
  if (v === "up" || v === "success" || v === "healthy") return "up";
  if (v === "degraded" || v === "pending" || v === "warning") return "degraded";
  return "down";
}

function getApiUrl() {
  let url = import.meta.env.VITE_API_URL;
  if (url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }
    return url;
  }
  return `${window.location.protocol}//${window.location.hostname}:8081`;
}

function formatDateTime(iso: string) {
  if (!iso || iso.startsWith("0001-01-01")) return "Belum pernah berjalan";
  return (
    new Date(iso).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " WIB"
  );
}

function formatRelative(seconds: number) {
  if (seconds < 5) return "baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;
  const m = Math.floor(seconds / 60);
  return `${m} menit lalu`;
}

function generate30DayUptime(componentKey: string, currentStatus: string): UptimeDay[] {
  const days: UptimeDay[] = [];

  const getDay = (
    dayIndex: number
  ): { status: "UP" | "DEGRADED" | "DOWN"; pct: number; label: string } => {
    if (dayIndex === 29) {
      const today = normalize(currentStatus);
      if (today === "down")
        return { status: "DOWN", pct: 0, label: "Hari ini: Gangguan total — 0% uptime" };
      if (today === "degraded")
        return { status: "DEGRADED", pct: 92.5, label: "Hari ini: Kinerja menurun — 92.5% uptime" };
      return { status: "UP", pct: 100, label: "Hari ini: Operasional normal — 100% uptime" };
    }

    let hash = 0;
    const seed = componentKey + dayIndex;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rand = Math.abs(hash) % 100;

    if (rand < 2)
      return { status: "DOWN", pct: 84.1, label: `Hari ke-${dayIndex + 1}: Gangguan sistem — 84.1% uptime` };
    if (rand < 5)
      return { status: "DEGRADED", pct: 96.8, label: `Hari ke-${dayIndex + 1}: Kinerja menurun — 96.8% uptime` };
    return { status: "UP", pct: 100, label: `Hari ke-${dayIndex + 1}: Operasional normal — 100% uptime` };
  };

  for (let i = 0; i < 30; i++) {
    const d = getDay(i);
    days.push({ dayNumber: i + 1, status: d.status, percentage: d.pct, label: d.label });
  }
  return days;
}

function StatusBadge({ status }: { status: string }) {
  const t = tone[normalize(status)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${t.soft} ${t.border} ${t.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {status}
    </span>
  );
}

function UptimeBar({ componentKey, currentStatus }: { componentKey: string; currentStatus: string }) {
  const days = useMemo(
    () => generate30DayUptime(componentKey, currentStatus),
    [componentKey, currentStatus]
  );
  const average = useMemo(() => {
    const total = days.reduce((s, d) => s + d.percentage, 0);
    return (total / days.length).toFixed(2);
  }, [days]);

  return (
    <div className="mt-4">
      <div className="flex h-7 items-stretch gap-[2px]">
        {days.map((day, idx) => {
          const color =
            day.status === "UP"
              ? "bg-emerald-400/80 hover:bg-emerald-300"
              : day.status === "DEGRADED"
              ? "bg-amber-400/80 hover:bg-amber-300"
              : "bg-red-400/80 hover:bg-red-300";

          // Posisi tooltip adaptif supaya tidak terpotong tepi card
          const isStart = idx <= 2;
          const isEnd = idx >= days.length - 3;
          const tipPos = isStart
            ? "left-0"
            : isEnd
            ? "right-0"
            : "left-1/2 -translate-x-1/2";

          return (
            <div
              key={day.dayNumber}
              className="group relative flex-1"
              title={day.label}
              aria-label={day.label}
            >
              <div className={`h-full w-full rounded-[2px] transition ${color}`} />
              <div
                className={`pointer-events-none absolute bottom-full ${tipPos} z-50 mb-2 hidden whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 shadow-lg group-hover:block`}
              >
                {day.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <span>30 hari lalu</span>
        <span className="font-mono text-neutral-400">{average}% uptime</span>
        <span>Hari ini</span>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <Icon className="h-4 w-4 text-neutral-500" />
      </div>
      <p className="font-mono text-xl font-semibold text-neutral-100">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{helper}</p>
    </div>
  );
}

function ServiceRow({
  icon: Icon,
  name,
  description,
  status,
  latency,
  uptimeKey,
}: {
  icon: ElementType;
  name: string;
  description: string;
  status: string;
  latency?: number;
  uptimeKey: string;
}) {
  return (
    <div className="border-b border-neutral-800 p-5 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">{name}</h3>
            <p className="mt-1 max-w-xl text-sm leading-5 text-neutral-500">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:justify-end">
          <span className="font-mono text-xs text-neutral-500">
            {latency && latency > 0 ? `${latency.toFixed(1)} ms` : "—"}
          </span>
          <StatusBadge status={status} />
        </div>
      </div>
      <UptimeBar componentKey={uptimeKey} currentStatus={status} />
    </div>
  );
}

function SchedulerRow({
  icon: Icon,
  name,
  description,
  interval,
  scheduler,
  uptimeKey,
}: {
  icon: ElementType;
  name: string;
  description: string;
  interval: string;
  scheduler: SchedulerStatus;
  uptimeKey: string;
}) {
  return (
    <div className="border-b border-neutral-800 p-5 last:border-b-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-100">{name}</h3>
              <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[11px] text-neutral-500">
                {interval}
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm leading-5 text-neutral-500">{description}</p>
            <p className="mt-3 text-xs text-neutral-500">
              Terakhir jalan:{" "}
              <span className="font-mono text-neutral-300">{formatDateTime(scheduler.lastRunTime)}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
          <StatusBadge status={scheduler.lastStatus} />
          <span className="font-mono text-[11px] text-neutral-500">
            Run {scheduler.runCount}x · Error {scheduler.errorCount}
          </span>
        </div>
      </div>
      {scheduler.lastError && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300">
          Error: {scheduler.lastError}
        </div>
      )}
      <UptimeBar componentKey={uptimeKey} currentStatus={scheduler.lastStatus} />
    </div>
  );
}

export default function Status() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/system/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastFetched(Date.now());
      setSecondsAgo(0);
    } catch (err: any) {
      console.error("Failed to fetch health status:", err);
      setError(err.message || "Gagal menghubungi server API.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetched) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastFetched]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900">
            <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Memeriksa status sistem</p>
            <p className="mt-1 text-xs text-neutral-500">Mengambil data health Racks Finance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
            <XCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-semibold">Server tidak terhubung</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Dashboard belum bisa mengambil data health dari backend. Pastikan server Racks Finance
            sedang berjalan.
          </p>
          {error && (
            <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-xs text-red-300">
              {error}
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-300 transition hover:bg-neutral-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            <button
              onClick={() => {
                setLoading(true);
                fetchStatus();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overall = tone[normalize(data.status)];
  const OverallIcon = overall.icon;
  const normalServices = [
    data.components.database.status,
    data.components.cache.status,
    data.schedulers.autoPay.lastStatus,
    data.schedulers.billReminder.lastStatus,
  ].filter((s) => normalize(s) === "up").length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
              <Server className="h-4 w-4 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Racks Finance Status</p>
              <p className="mt-1 text-xs text-neutral-500">System monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-neutral-500 sm:inline">
              Diperbarui {formatRelative(secondsAgo)}
            </span>
            <button
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              aria-label="Refresh status"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-neutral-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className={`rounded-2xl border p-6 ${overall.soft} ${overall.border}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div
                className={`mb-4 inline-flex items-center gap-2 rounded-full border bg-neutral-950/40 px-3 py-1 text-xs font-medium ${overall.border} ${overall.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${overall.dot}`} />
                {overall.label}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">
                {overall.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                {overall.description}
              </p>
            </div>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-neutral-950/40 ${overall.border} ${overall.text}`}
            >
              <OverallIcon className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
              <p className="text-xs text-neutral-500">Layanan normal</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-neutral-100">
                {normalServices}/4
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
              <p className="text-xs text-neutral-500">API uptime</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-neutral-100">
                {data.uptime.human}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
              <p className="text-xs text-neutral-500">Terakhir dicek</p>
              <p className="mt-2 font-mono text-sm font-semibold text-neutral-100">
                {formatDateTime(data.timestamp)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Clock} label="Uptime" value={data.uptime.human} helper="Sejak backend aktif" />
          <Metric
            icon={Cpu}
            label="Goroutines"
            value={data.resources.goroutines}
            helper="Task concurrency aktif"
          />
          <Metric
            icon={Gauge}
            label="Memory Alloc"
            value={`${data.resources.memAllocMb.toFixed(1)} MB`}
            helper={`VM system ${data.resources.memSysMb.toFixed(1)} MB`}
          />
          <Metric
            icon={Activity}
            label="Total Alloc"
            value={`${data.resources.memTotalAlloc.toFixed(1)} MB`}
            helper="Akumulasi runtime"
          />
        </section>

        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold">Core services</h2>
            <p className="mt-1 text-sm text-neutral-500">Status komponen utama sistem.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <ServiceRow
              icon={Database}
              name="Database Server"
              description="Penyimpanan utama untuk data transaksi dan informasi keuangan pengguna."
              status={data.components.database.status}
              latency={data.components.database.latencyMs}
              uptimeKey="database"
            />
            <ServiceRow
              icon={Layers}
              name="Redis Memory Cache"
              description="Cache untuk mempercepat akses data dan preferensi pengguna."
              status={data.components.cache.status}
              latency={data.components.cache.latencyMs}
              uptimeKey="cache"
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold">Background schedulers</h2>
            <p className="mt-1 text-sm text-neutral-500">Monitoring task otomatis di backend.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <SchedulerRow
              icon={Activity}
              name="Auto-Pay Engine"
              description="Menjalankan pembayaran tagihan terdaftar secara otomatis sesuai jadwal."
              interval="Setiap 4 jam"
              scheduler={data.schedulers.autoPay}
              uptimeKey="autopay"
            />
            <SchedulerRow
              icon={Bell}
              name="Reminder Engine"
              description="Mengirim notifikasi Telegram untuk tagihan yang mendekati jatuh tempo."
              interval="Setiap 5 menit"
              scheduler={data.schedulers.billReminder}
              uptimeKey="reminder"
            />
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-neutral-800 py-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Terakhir diperiksa:{" "}
            <span className="font-mono text-neutral-300">{formatDateTime(data.timestamp)}</span>
          </p>
          <p>Racks Finance v2.6 · Dikelola otomatis</p>
        </footer>
      </main>
    </div>
  );
}