export interface ThemeVariables {
  background: string;
  foreground: string;
  "card-bg": string;
  "card-fg": string;
  popover: string;
  "popover-foreground": string;
  border: string;
  canvas: string;
  surface: string;
  elevated: string;
  income: string;
  expense: string;
  warning: string;
  accent: string;
  sidebar: string;
  "sidebar-foreground": string;
  "sidebar-accent": string;
  "sidebar-border": string;
  "muted-foreground": string;
  "muted-bg": string;
}

export interface ThemePreset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  isDark: boolean;
  variables: ThemeVariables;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "nordic-midnight",
    name: "Nordic Midnight (Bawaan)",
    nameEn: "Nordic Midnight (Default)",
    description: "Tema gelap biru laut yang sejuk, nyaman untuk penggunaan jangka panjang.",
    descriptionEn: "Cool deep sea blue dark theme, optimized for extended viewing comfort.",
    isDark: true,
    variables: {
      background: "#0A0E1A",
      foreground: "#F8FAFC",
      "card-bg": "#111827",
      "card-fg": "#F8FAFC",
      popover: "#1E293B",
      "popover-foreground": "#F8FAFC",
      border: "#334155",
      canvas: "#0A0E1A",
      surface: "#111827",
      elevated: "#1E293B",
      income: "#10B981",
      expense: "#EF4444",
      warning: "#F59E0B",
      accent: "#3B82F6",
      sidebar: "#0F172A",
      "sidebar-foreground": "#F8FAFC",
      "sidebar-accent": "#1E293B",
      "sidebar-border": "#334155",
      "muted-foreground": "#94A3B8",
      "muted-bg": "#1E293B",
    },
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    nameEn: "GitHub Dark",
    description: "Tema gelap resmi ala GitHub dengan kontras monokromatik yang seimbang.",
    descriptionEn: "Official GitHub style dark theme with balanced monochromatic contrast.",
    isDark: true,
    variables: {
      background: "#0D1117",
      foreground: "#F0F6FC",
      "card-bg": "#161B22",
      "card-fg": "#F0F6FC",
      popover: "#1C2128",
      "popover-foreground": "#F0F6FC",
      border: "#30363D",
      canvas: "#0D1117",
      surface: "#161B22",
      elevated: "#1C2128",
      income: "#2EA043",
      expense: "#F85149",
      warning: "#D29922",
      accent: "#388BFD",
      sidebar: "#0D1117",
      "sidebar-foreground": "#F0F6FC",
      "sidebar-accent": "#161B22",
      "sidebar-border": "#30363D",
      "muted-foreground": "#8B949E",
      "muted-bg": "#161B22",
    },
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian (Amoled)",
    nameEn: "Midnight Obsidian (Amoled)",
    description: "Hitam pekat murni dikombinasikan dengan aksen merah mawar yang elegan.",
    descriptionEn: "Pure obsidian pitch black coupled with an elegant rose pink accent.",
    isDark: true,
    variables: {
      background: "#050505",
      foreground: "#FAFAFA",
      "card-bg": "#0A0A0A",
      "card-fg": "#FAFAFA",
      popover: "#121212",
      "popover-foreground": "#FAFAFA",
      border: "#262626",
      canvas: "#050505",
      surface: "#0A0A0A",
      elevated: "#121212",
      income: "#10B981",
      expense: "#F43F5E",
      warning: "#F59E0B",
      accent: "#F43F5E",
      sidebar: "#050505",
      "sidebar-foreground": "#FAFAFA",
      "sidebar-accent": "#0A0A0A",
      "sidebar-border": "#262626",
      "muted-foreground": "#A3A3A3",
      "muted-bg": "#121212",
    },
  },
  {
    id: "minimalist-light",
    name: "Minimalist Light (Terang)",
    nameEn: "Minimalist Light (Clean White)",
    description: "Warna putih bersih minimalis dengan kontras teks gelap yang tajam dan bersih.",
    descriptionEn: "Clean minimalist white theme with sharp, readable dark slate typography.",
    isDark: false,
    variables: {
      background: "#FFFFFF",
      foreground: "#0F172A",
      "card-bg": "#F8FAFC",
      "card-fg": "#0F172A",
      popover: "#FFFFFF",
      "popover-foreground": "#0F172A",
      border: "#E2E8F0",
      canvas: "#FFFFFF",
      surface: "#F8FAFC",
      elevated: "#F1F5F9",
      income: "#059669",
      expense: "#DC2626",
      warning: "#D97706",
      accent: "#0F172A",
      sidebar: "#F8FAFC",
      "sidebar-foreground": "#0F172A",
      "sidebar-border": "#E2E8F0",
      "sidebar-accent": "#E2E8F0",
      "muted-foreground": "#64748B",
      "muted-bg": "#F1F5F9",
    },
  },
  {
    id: "retro-sepia",
    name: "Retro Sepia (Hangat)",
    nameEn: "Retro Sepia (Warm Paper)",
    description: "Warna kertas koran antik hangat yang sangat ramah untuk kesehatan mata.",
    descriptionEn: "Warm vintage paper tint that reduces blue light eye strain significantly.",
    isDark: false,
    variables: {
      background: "#FAF6EE",
      foreground: "#3F2B1B",
      "card-bg": "#F3ECE0",
      "card-fg": "#3F2B1B",
      popover: "#FAF6EE",
      "popover-foreground": "#3F2B1B",
      border: "#E5D9C4",
      canvas: "#FAF6EE",
      surface: "#F3ECE0",
      elevated: "#EADEC9",
      income: "#15803D",
      expense: "#B91C1C",
      warning: "#A16207",
      accent: "#B45309",
      sidebar: "#F3ECE0",
      "sidebar-foreground": "#3F2B1B",
      "sidebar-border": "#E5D9C4",
      "sidebar-accent": "#EADEC9",
      "muted-foreground": "#8A735E",
      "muted-bg": "#EADEC9",
    },
  },
  {
    id: "emerald-wealth",
    name: "Emerald Wealth (Investasi & Pertumbuhan)",
    nameEn: "Emerald Wealth (Investment & Growth)",
    description: "Tema hijau hutan premium bernuansa investasi, aset, dan kestabilan finansial.",
    descriptionEn: "Premium deep forest green theme evoking investments, wealth assets, and growth.",
    isDark: true,
    variables: {
      background: "#060D0B",
      foreground: "#ECFDF5",
      "card-bg": "#0D1F1A",
      "card-fg": "#ECFDF5",
      popover: "#132E27",
      "popover-foreground": "#ECFDF5",
      border: "#1F3F35",
      canvas: "#060D0B",
      surface: "#0D1F1A",
      elevated: "#132E27",
      income: "#10B981",
      expense: "#F43F5E",
      warning: "#F59E0B",
      accent: "#10B981",
      sidebar: "#060D0B",
      "sidebar-foreground": "#ECFDF5",
      "sidebar-accent": "#0D1F1A",
      "sidebar-border": "#1F3F35",
      "muted-foreground": "#6EE7B7",
      "muted-bg": "#0D1F1A",
    },
  },
  {
    id: "midnight-sapphire",
    name: "Midnight Sapphire (Kripto & Teknologi)",
    nameEn: "Midnight Sapphire (Crypto & Fintech)",
    description: "Tema biru safir futuristik ala platform crypto trading dan fintech modern.",
    descriptionEn: "Futuristic sapphire blue tint styled after crypto-trading and modern fintech platforms.",
    isDark: true,
    variables: {
      background: "#04091A",
      foreground: "#F0F4FF",
      "card-bg": "#0B132B",
      "card-fg": "#F0F4FF",
      popover: "#1C2541",
      "popover-foreground": "#F0F4FF",
      border: "#202D54",
      canvas: "#04091A",
      surface: "#0B132B",
      elevated: "#1C2541",
      income: "#10B981",
      expense: "#FF4B72",
      warning: "#FFB800",
      accent: "#00F0FF",
      sidebar: "#04091A",
      "sidebar-foreground": "#F0F4FF",
      "sidebar-accent": "#0B132B",
      "sidebar-border": "#202D54",
      "muted-foreground": "#8E9AAF",
      "muted-bg": "#0B132B",
    },
  },
  {
    id: "cyberpunk-gold",
    name: "Aureum Gold (Luks & Premium)",
    nameEn: "Aureum Gold (Luxe & Prestige)",
    description: "Kombinasi warna hitam arang pekat dengan aksen emas mewah untuk manajemen aset elit.",
    descriptionEn: "Deep charcoal black paired with high-performance prestige gold accents.",
    isDark: true,
    variables: {
      background: "#0C0A09",
      foreground: "#F5F5F4",
      "card-bg": "#1C1917",
      "card-fg": "#F5F5F4",
      popover: "#292524",
      "popover-foreground": "#F5F5F4",
      border: "#44403C",
      canvas: "#0C0A09",
      surface: "#1C1917",
      elevated: "#292524",
      income: "#10B981",
      expense: "#F43F5E",
      warning: "#EAB308",
      accent: "#EAB308",
      sidebar: "#0C0A09",
      "sidebar-foreground": "#F5F5F4",
      "sidebar-accent": "#1C1917",
      "sidebar-border": "#44403C",
      "muted-foreground": "#A8A29E",
      "muted-bg": "#1C1917",
    },
  },
  {
    id: "swiss-clean",
    name: "Swiss Banking (Elegansi Klasik)",
    nameEn: "Swiss Banking (Classic Light)",
    description: "Tema terang bernuansa kertas krim bank Swiss dengan aksen merah bordeaux elegan.",
    descriptionEn: "Sophisticated warm cream-tinted background with deep bordeaux red accents.",
    isDark: false,
    variables: {
      background: "#FAF9F6",
      foreground: "#1C1A17",
      "card-bg": "#FFFFFF",
      "card-fg": "#1C1A17",
      popover: "#FAF9F6",
      "popover-foreground": "#1C1A17",
      border: "#EAE6DF",
      canvas: "#FAF9F6",
      surface: "#FFFFFF",
      elevated: "#F5F2EB",
      income: "#168544",
      expense: "#C83232",
      warning: "#B45309",
      accent: "#962D2D",
      sidebar: "#FAF9F6",
      "sidebar-foreground": "#1C1A17",
      "sidebar-border": "#EAE6DF",
      "sidebar-accent": "#F5F2EB",
      "muted-foreground": "#7C7267",
      "muted-bg": "#F5F2EB",
    },
  },
];

export const FONT_OPTIONS = [
  { id: "inter", name: "Inter (Standar Fintech)", nameEn: "Inter (Fintech Standard)", value: "'Inter', -apple-system, sans-serif" },
  { id: "outfit", name: "Outfit (Elegans & Geometris)", nameEn: "Outfit (Elegant & Geometric)", value: "'Outfit', -apple-system, sans-serif" },
  { id: "jakarta", name: "Plus Jakarta Sans (Dinamis)", nameEn: "Plus Jakarta Sans (Dynamic Sans)", value: "'Plus Jakarta Sans', -apple-system, sans-serif" },
  { id: "jetbrains", name: "JetBrains Mono (Teknikal Tabular)", nameEn: "JetBrains Mono (Technical Tabular)", value: "'JetBrains Mono', monospace" }
];

export function applyFont(fontId: string) {
  if (typeof window === "undefined") return;
  const option = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[2];
  document.documentElement.style.setProperty("--font-family", option.value);
  localStorage.setItem("racks-font-family", fontId);
}

export function loadSavedFont() {
  if (typeof window === "undefined") return;
  const fontId = localStorage.getItem("racks-font-family") || "jakarta";
  applyFont(fontId);
}

export function applyTheme(themeId: string, customVars?: Partial<ThemeVariables>) {
  const preset = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  const finalVars = { ...preset.variables, ...customVars };

  const root = document.documentElement;

  // Apply dark class
  if (preset.isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Set all CSS variables on :root
  Object.entries(finalVars).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Save selection
  localStorage.setItem("racks-theme-id", themeId);
  if (customVars) {
    localStorage.setItem("racks-custom-theme-vars", JSON.stringify(customVars));
  } else {
    localStorage.removeItem("racks-custom-theme-vars");
  }
}

export function loadSavedTheme() {
  if (typeof window === "undefined") return;
  loadSavedFont();
  const themeId = localStorage.getItem("racks-theme-id") || "nordic-midnight";
  const customVarsStr = localStorage.getItem("racks-custom-theme-vars");
  let customVars = undefined;
  if (customVarsStr) {
    try {
      customVars = JSON.parse(customVarsStr);
    } catch (e) {
      // Ignore
    }
  }
  applyTheme(themeId, customVars);
}
