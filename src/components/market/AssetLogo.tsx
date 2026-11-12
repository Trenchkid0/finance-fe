import { useState, useMemo, memo } from "react";
import { Coins, DollarSign, Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AssetLogoProps {
  logoUrl?: string;
  name: string;
  symbol: string;
  category?: "indo_stock" | "world_stock" | "currency" | "gold" | "mutual_fund";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Global in-memory cache to ensure repeated loads are instant and 0-overhead */
const GLOBAL_WORKING_URLS = new Map<string, string>();
const GLOBAL_FAILED_URLS = new Set<string>();

/** Pre-warm top critical market logos on idle so the very first tab change or scroll is 0ms */
const WARMUP_LOGOS = [
  "/logos/bbca.png",
  "/logos/bbri.png",
  "/logos/bmri.png",
  "/logos/bbni.png",
  "/logos/tlkm.png",
  "/logos/asii.png",
  "/logos/goto.png",
  "/logos/aapl.png",
  "/logos/nvda.png",
  "/logos/msft.png",
  "/logos/antam.png",
  "/logos/pegadaian.png",
  "/logos/sucor.png",
  "/logos/batavia.png",
];

if (typeof window !== "undefined") {
  const warmup = () => {
    WARMUP_LOGOS.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  };
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(warmup);
  } else {
    setTimeout(warmup, 1200);
  }
}

/** Verified Genuine Corporate Logo Mappings */
const REAL_BRAND_LOGOS: Record<string, string> = {
  // Indonesian Blue Chip & Major Stocks
  "BBCA.JK": "/logos/bbca.png",
  "BBCA": "/logos/bbca.png",
  "BBRI.JK": "/logos/bbri.png",
  "BBRI": "/logos/bbri.png",
  "BMRI.JK": "/logos/bmri.png",
  "BMRI": "/logos/bmri.png",
  "BBNI.JK": "/logos/bbni.png",
  "BBNI": "/logos/bbni.png",
  "TLKM.JK": "/logos/tlkm.png",
  "TLKM": "/logos/tlkm.png",
  "ASII.JK": "/logos/asii.png",
  "ASII": "/logos/asii.png",
  "GOTO.JK": "/logos/goto.png",
  "GOTO": "/logos/goto.png",
  "ADRO.JK": "/logos/adro.png",
  "ADRO": "/logos/adro.png",
  "ICBP.JK": "/logos/icbp.png",
  "ICBP": "/logos/icbp.png",
  "AMMN.JK": "/logos/ammn.png",
  "AMMN": "/logos/ammn.png",
  "UNVR.JK": "https://companiesmarketcap.com/img/company-logos/64/UNVR.JK.png",
  "UNVR": "https://companiesmarketcap.com/img/company-logos/64/UNVR.JK.png",
  "INDF.JK": "https://companiesmarketcap.com/img/company-logos/64/INDF.JK.png",
  "INDF": "https://companiesmarketcap.com/img/company-logos/64/INDF.JK.png",
  "BRIS.JK": "/logos/bris.png",
  "BRIS": "/logos/bris.png",
  "BBTN.JK": "/logos/bbtn.png",
  "BBTN": "/logos/bbtn.png",
  "KLBF.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kalbe.co.id&size=128",
  "KLBF": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kalbe.co.id&size=128",
  "PTBA.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ptba.co.id&size=128",
  "PTBA": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ptba.co.id&size=128",
  "PGAS.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pgn.co.id&size=128",
  "PGAS": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pgn.co.id&size=128",
  "MEDC.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://medcoenergi.com&size=128",
  "MEDC": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://medcoenergi.com&size=128",
  "BREN.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://baritorenewables.co.id&size=128",
  "BREN": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://baritorenewables.co.id&size=128",
  "MDKA.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://merdekacoppergold.com&size=128",
  "MDKA": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://merdekacoppergold.com&size=128",
  "ANTM.JK": "/logos/antam.png",
  "SMGR.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sig.id&size=128",
  "SMGR": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sig.id&size=128",
  "BSDE.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sinarmasland.com&size=128",
  "BSDE": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sinarmasland.com&size=128",
  "CTRA.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ciputra.com&size=128",
  "CTRA": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ciputra.com&size=128",
  "PWON.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pakuwonjati.com&size=128",
  "PWON": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pakuwonjati.com&size=128",
  "SMRA.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://summarecon.com&size=128",
  "SMRA": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://summarecon.com&size=128",
  "BIRD.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://bluebirdgroup.com&size=128",
  "BIRD": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://bluebirdgroup.com&size=128",
  "SMDR.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://samudera.id&size=128",
  "SMDR": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://samudera.id&size=128",
  "MYOR.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mayora.com&size=128",
  "MYOR": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mayora.com&size=128",
  "CMRY.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://cimory.com&size=128",
  "CMRY": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://cimory.com&size=128",
  "INCO.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://vale.com&size=128",
  "INCO": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://vale.com&size=128",
  "HRUM.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://harumenergy.com&size=128",
  "HRUM": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://harumenergy.com&size=128",
  "NCKL.JK": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://haritanickel.com&size=128",
  "NCKL": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://haritanickel.com&size=128",

  // Global Stocks
  "AAPL": "/logos/aapl.png",
  "MSFT": "/logos/msft.png",
  "GOOGL": "/logos/googl.png",
  "GOOG": "/logos/googl.png",
  "NVDA": "/logos/nvda.png",
  "AMZN": "/logos/amzn.png",
  "TSLA": "/logos/tsla.png",
  "META": "/logos/meta.png",

  // Gold Brands
  "ANTAM": "/logos/antam.png",
  "PEGADAIAN": "/logos/pegadaian.png",
  "UBS": "/logos/ubs.png",
  "UBSGOLD": "/logos/ubs.png",

  // Mutual Funds (Manajer Investasi)
  "SUCOR": "/logos/sucor.png",
  "BATAVIA": "/logos/batavia.png",
  "MANDIRI_MI": "/logos/mandiri_mi.png",
  "MANDIRI-FTSE": "/logos/mandiri_mi.png",
  "SINARMAS": "/logos/sinarmas.png",
  "BAHANA": "/logos/bahana.png",
  "MANULIFE": "/logos/manulife.png",
  "BNIAM": "/logos/bniam.png",
  "EASTSPRING": "/logos/eastspring.png",
  "SCHRODERS": "/logos/schroders.png",
  "BNP": "/logos/bnpparibas.png",
  "BNPPARIBAS": "/logos/bnpparibas.png",
  "SYAILENDRA": "/logos/syailendra.png",
  "TRIMEGAH": "/logos/trimegah.png",
  "PANIN": "/logos/panin.png",
  "MAJORIS": "/logos/majoris.png",
  "ASHMORE": "/logos/ashmore.png",
};

/** Currency Country Flag mapping */
const CURRENCY_FLAGS: Record<string, string> = {
  USD: "https://flagcdn.com/w80/us.png",
  EUR: "https://flagcdn.com/w80/eu.png",
  SGD: "https://flagcdn.com/w80/sg.png",
  JPY: "https://flagcdn.com/w80/jp.png",
  GBP: "https://flagcdn.com/w80/gb.png",
  AUD: "https://flagcdn.com/w80/au.png",
  CNY: "https://flagcdn.com/w80/cn.png",
  SAR: "https://flagcdn.com/w80/sa.png",
  MYR: "https://flagcdn.com/w80/my.png",
};

function AssetLogoComponent({
  logoUrl,
  name,
  symbol,
  category = "indo_stock",
  size = "md",
  className,
}: AssetLogoProps) {
  const [errorIndex, setErrorIndex] = useState(0);

  const sizeClasses = {
    sm: "size-8 text-xs rounded-lg",
    md: "size-10 text-sm rounded-xl",
    lg: "size-12 text-base rounded-2xl",
  }[size];

  const pixelDim = size === "sm" ? 32 : size === "md" ? 40 : 48;

  const cacheKey = `${category}:${(symbol || "").toUpperCase().replace(".JK", "").trim()}`;

  // Build candidate URL array
  const candidateUrls = useMemo(() => {
    // If we already know a working URL for this asset, prioritize it immediately
    const cachedWorking = GLOBAL_WORKING_URLS.get(cacheKey);

    const list: string[] = [];
    if (cachedWorking) {
      list.push(cachedWorking);
    }

    const symUpper = (symbol || "").toUpperCase();
    const cleanSym = symUpper.replace(".JK", "").trim();

    // 1. Currency flag check
    if (category === "currency" || symUpper.includes("IDR=X") || symUpper.includes("=X")) {
      const code = symUpper.replace("IDR=X", "").replace("=X", "").slice(0, 3);
      if (CURRENCY_FLAGS[code]) {
        list.push(CURRENCY_FLAGS[code]);
      }
    }

    // 2. Exact match in REAL_BRAND_LOGOS
    if (REAL_BRAND_LOGOS[symUpper]) {
      list.push(REAL_BRAND_LOGOS[symUpper]);
    }
    if (REAL_BRAND_LOGOS[cleanSym]) {
      list.push(REAL_BRAND_LOGOS[cleanSym]);
    }

    // 3. Mutual fund match by name or symbol
    if (category === "mutual_fund") {
      const nLower = (name || "").toLowerCase();
      if (nLower.includes("sucor")) list.push("/logos/sucor.png");
      if (nLower.includes("mandiri")) list.push("/logos/mandiri_mi.png");
      if (nLower.includes("batavia")) list.push("/logos/batavia.png");
      if (nLower.includes("sinarmas")) list.push("/logos/sinarmas.png");
      if (nLower.includes("bahana")) list.push("/logos/bahana.png");
      if (nLower.includes("manulife")) list.push("/logos/manulife.png");
      if (nLower.includes("bni")) list.push("/logos/bniam.png");
      if (nLower.includes("eastspring")) list.push("/logos/eastspring.png");
      if (nLower.includes("schroder")) list.push("/logos/schroders.png");
      if (nLower.includes("panin")) list.push("/logos/panin.png");
      if (nLower.includes("majoris")) list.push("/logos/majoris.png");
      if (nLower.includes("syailendra")) list.push("/logos/syailendra.png");
      if (nLower.includes("trimegah")) list.push("/logos/trimegah.png");
      if (nLower.includes("ashmore")) list.push("/logos/ashmore.png");
      if (nLower.includes("bnp")) list.push("/logos/bnpparibas.png");
    }

    // 4. Gold match
    if (category === "gold" || symUpper.includes("GOLD") || symUpper.includes("EMAS")) {
      const nLower = (name || "").toLowerCase();
      if (nLower.includes("antam")) list.push("/logos/antam.png");
      if (nLower.includes("pegadaian")) list.push("/logos/pegadaian.png");
      if (nLower.includes("ubs")) list.push("/logos/ubs.png");
    }

    // 5. Provided logoUrl (convert .svg to .png if local png exists)
    if (logoUrl) {
      const pngUrl = logoUrl.replace(/\.svg$/, ".png");
      list.push(pngUrl);
      if (pngUrl !== logoUrl) {
        list.push(logoUrl);
      }
    }

    // 6. CompaniesMarketCap fallback for stocks
    if (category === "indo_stock") {
      list.push(`https://companiesmarketcap.com/img/company-logos/64/${cleanSym}.JK.png`);
    } else if (category === "world_stock") {
      list.push(`https://companiesmarketcap.com/img/company-logos/64/${cleanSym}.png`);
    }

    // Filter out known broken/failed URLs and remove duplicates
    const unique = Array.from(new Set(list.filter(Boolean)));
    return unique.filter((url) => !GLOBAL_FAILED_URLS.has(url));
  }, [symbol, name, category, logoUrl, cacheKey]);

  const activeUrl = candidateUrls[errorIndex];

  if (activeUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center overflow-hidden border border-border/50 bg-white dark:bg-card shadow-xs transition-transform duration-200",
          sizeClasses,
          className
        )}
        style={{
          contain: "paint layout",
          contentVisibility: "auto",
        }}
      >
        <img
          src={activeUrl}
          alt={name}
          width={pixelDim}
          height={pixelDim}
          className="size-full object-contain p-1 select-none pointer-events-none"
          loading={size === "lg" ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={size === "lg" ? "high" : "low"}
          draggable={false}
          onLoad={() => {
            GLOBAL_WORKING_URLS.set(cacheKey, activeUrl);
          }}
          onError={() => {
            GLOBAL_FAILED_URLS.add(activeUrl);
            setErrorIndex((prev) => prev + 1);
          }}
        />
      </div>
    );
  }

  // Graceful fallback for Gold
  if (category === "gold") {
    return (
      <div
        className={cn(
          "shrink-0 flex items-center justify-center font-bold border border-amber-500/30 bg-amber-500/15 text-amber-500 shadow-xs",
          sizeClasses,
          className
        )}
        style={{ contain: "paint layout" }}
        title={name}
      >
        <Coins className={size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6"} />
      </div>
    );
  }

  // Graceful fallback for Currency
  if (category === "currency") {
    const cleanSymbol = symbol.replace("IDR=X", "").replace("=X", "").substring(0, 3);
    return (
      <div
        className={cn(
          "shrink-0 flex items-center justify-center font-bold border border-emerald-500/30 bg-emerald-500/15 text-emerald-500 shadow-xs",
          sizeClasses,
          className
        )}
        style={{ contain: "paint layout" }}
        title={name}
      >
        {cleanSymbol === "USD" ? (
          <DollarSign className={size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6"} />
        ) : (
          <Globe className={size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6"} />
        )}
      </div>
    );
  }

  // Clean stock monogram fallback
  const cleanSymbol = symbol.replace(".JK", "").substring(0, 4);
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center font-black tracking-tight border border-border bg-muted/60 text-foreground shadow-xs select-none",
        sizeClasses,
        className
      )}
      style={{ contain: "paint layout" }}
      title={name}
    >
      {cleanSymbol}
    </div>
  );
}

export const AssetLogo = memo(AssetLogoComponent);
