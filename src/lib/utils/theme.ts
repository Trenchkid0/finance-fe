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
  progress: string;
  sidebar: string;
  "sidebar-foreground": string;
  "sidebar-accent": string;
  "sidebar-border": string;
  "muted-foreground": string;
  "muted-bg": string;
  // Hover states
  "hover-surface": string;
  "hover-elevated": string;
  "hover-accent": string;
  "hover-border": string;
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
      progress: "#A78BFA",
      sidebar: "#0F172A",
      "sidebar-foreground": "#F8FAFC",
      "sidebar-accent": "#1E293B",
      "sidebar-border": "#334155",
      "muted-foreground": "#94A3B8",
      "muted-bg": "#1E293B",
      "hover-surface": "#1E293B",
      "hover-elevated": "#334155",
      "hover-accent": "#60A5FA",
      "hover-border": "#475569",
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
      progress: "#A371F7",
      sidebar: "#0D1117",
      "sidebar-foreground": "#F0F6FC",
      "sidebar-accent": "#161B22",
      "sidebar-border": "#30363D",
      "muted-foreground": "#8B949E",
      "muted-bg": "#161B22",
      "hover-surface": "#1C2128",
      "hover-elevated": "#2D333B",
      "hover-accent": "#58A6FF",
      "hover-border": "#444C56",
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
      progress: "#F472B6",
      sidebar: "#050505",
      "sidebar-foreground": "#FAFAFA",
      "sidebar-accent": "#0A0A0A",
      "sidebar-border": "#262626",
      "muted-foreground": "#A3A3A3",
      "muted-bg": "#121212",
      "hover-surface": "#171717",
      "hover-elevated": "#1F1F1F",
      "hover-accent": "#FB7185",
      "hover-border": "#404040",
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
      progress: "#6366F1",
      sidebar: "#F8FAFC",
      "sidebar-foreground": "#0F172A",
      "sidebar-border": "#E2E8F0",
      "sidebar-accent": "#E2E8F0",
      "muted-foreground": "#64748B",
      "muted-bg": "#F1F5F9",
      "hover-surface": "#F1F5F9",
      "hover-elevated": "#E2E8F0",
      "hover-accent": "#334155",
      "hover-border": "#CBD5E1",
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
      progress: "#D97706",
      sidebar: "#F3ECE0",
      "sidebar-foreground": "#3F2B1B",
      "sidebar-border": "#E5D9C4",
      "sidebar-accent": "#EADEC9",
      "muted-foreground": "#8A735E",
      "muted-bg": "#EADEC9",
      "hover-surface": "#EADEC9",
      "hover-elevated": "#DFD0B8",
      "hover-accent": "#C2410C",
      "hover-border": "#D4C4AF",
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
      progress: "#06B6D4",
      sidebar: "#060D0B",
      "sidebar-foreground": "#ECFDF5",
      "sidebar-accent": "#0D1F1A",
      "sidebar-border": "#1F3F35",
      "muted-foreground": "#6EE7B7",
      "muted-bg": "#0D1F1A",
      "hover-surface": "#132E27",
      "hover-elevated": "#1F3F35",
      "hover-accent": "#34D399",
      "hover-border": "#2D5246",
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
      progress: "#8B5CF6",
      sidebar: "#04091A",
      "sidebar-foreground": "#F0F4FF",
      "sidebar-accent": "#0B132B",
      "sidebar-border": "#202D54",
      "muted-foreground": "#8E9AAF",
      "muted-bg": "#0B132B",
      "hover-surface": "#1C2541",
      "hover-elevated": "#2C3A63",
      "hover-accent": "#33F3FF",
      "hover-border": "#3A4668",
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
      progress: "#F97316",
      sidebar: "#0C0A09",
      "sidebar-foreground": "#F5F5F4",
      "sidebar-accent": "#1C1917",
      "sidebar-border": "#44403C",
      "muted-foreground": "#A8A29E",
      "muted-bg": "#1C1917",
      "hover-surface": "#292524",
      "hover-elevated": "#3C3835",
      "hover-accent": "#FCD34D",
      "hover-border": "#57534E",
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
      progress: "#B45309",
      sidebar: "#FAF9F6",
      "sidebar-foreground": "#1C1A17",
      "sidebar-border": "#EAE6DF",
      "sidebar-accent": "#F5F2EB",
      "muted-foreground": "#7C7267",
      "muted-bg": "#F5F2EB",
      "hover-surface": "#F5F2EB",
      "hover-elevated": "#E9E3D8",
      "hover-accent": "#B03D3D",
      "hover-border": "#D8D0C1",
    },
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon (Gelap)",
    nameEn: "Cyberpunk Neon (Dark)",
    description: "Tema gelap bernuansa masa depan dengan perpaduan aksen hot pink dan neon teal.",
    descriptionEn: "Futuristic dark theme with hot pink and neon teal accents.",
    isDark: true,
    variables: {
      background: "#0B0813",
      foreground: "#F0EBF8",
      "card-bg": "#140F22",
      "card-fg": "#F0EBF8",
      popover: "#18122B",
      "popover-foreground": "#F0EBF8",
      border: "#2C1E47",
      canvas: "#0B0813",
      surface: "#140F22",
      elevated: "#1D1430",
      income: "#00FF9F",
      expense: "#FF0055",
      warning: "#FFCC00",
      accent: "#FF007F",
      progress: "#00FFFF",
      sidebar: "#08060E",
      "sidebar-foreground": "#F0EBF8",
      "sidebar-accent": "#18122B",
      "sidebar-border": "#2C1E47",
      "muted-foreground": "#8C7C9E",
      "muted-bg": "#1D1430",
      "hover-surface": "#221A35",
      "hover-elevated": "#2E2248",
      "hover-accent": "#FF3399",
      "hover-border": "#3F2B66",
    },
  },
  {
    id: "rosewood-forest",
    name: "Rosewood Forest (Gelap)",
    nameEn: "Rosewood Forest (Dark)",
    description: "Warna burgundy gelap dipadukan dengan aksen merah muda yang tenang.",
    descriptionEn: "Deep burgundy background paired with a calming rose pink accent.",
    isDark: true,
    variables: {
      background: "#0F0A0A",
      foreground: "#F5EBEB",
      "card-bg": "#1A1111",
      "card-fg": "#F5EBEB",
      popover: "#201414",
      "popover-foreground": "#F5EBEB",
      border: "#352222",
      canvas: "#0F0A0A",
      surface: "#1A1111",
      elevated: "#241818",
      income: "#34D399",
      expense: "#EF4444",
      warning: "#FBBF24",
      accent: "#E15A60",
      progress: "#F472B6",
      sidebar: "#0A0707",
      "sidebar-foreground": "#F5EBEB",
      "sidebar-accent": "#1A1111",
      "sidebar-border": "#352222",
      "muted-foreground": "#A38E8E",
      "muted-bg": "#241818",
      "hover-surface": "#2A1B1B",
      "hover-elevated": "#3B2626",
      "hover-accent": "#E57378",
      "hover-border": "#4F3232",
    },
  },
  {
    id: "nordic-snow",
    name: "Nordic Snow (Terang)",
    nameEn: "Nordic Snow (Light)",
    description: "Tema terang bernuansa salju perak dengan aksen biru kutub yang segar.",
    descriptionEn: "Clean silver-snow light theme with refreshing arctic blue accents.",
    isDark: false,
    variables: {
      background: "#F3F6F9",
      foreground: "#1E293B",
      "card-bg": "#FFFFFF",
      "card-fg": "#1E293B",
      popover: "#FFFFFF",
      "popover-foreground": "#1E293B",
      border: "#D1DBE5",
      canvas: "#F3F6F9",
      surface: "#FFFFFF",
      elevated: "#EBF1F6",
      income: "#10B981",
      expense: "#EF4444",
      warning: "#F59E0B",
      accent: "#3B82F6",
      progress: "#6366F1",
      sidebar: "#EBF1F6",
      "sidebar-foreground": "#1E293B",
      "sidebar-border": "#D1DBE5",
      "sidebar-accent": "#FFFFFF",
      "muted-foreground": "#5E7185",
      "muted-bg": "#EBF1F6",
      "hover-surface": "#E2EAF1",
      "hover-elevated": "#D1DBE5",
      "hover-accent": "#2563EB",
      "hover-border": "#BCCCDA",
    },
  },
  {
    id: "sakura-blossom",
    name: "Sakura Blossom (Terang)",
    nameEn: "Sakura Blossom (Light)",
    description: "Warna krim merah muda sakura yang lembut dan hangat, memberikan ketenangan.",
    descriptionEn: "Soft cherry blossom cream pink background for a gentle financial tracking mood.",
    isDark: false,
    variables: {
      background: "#FFF5F5",
      foreground: "#3D2B33",
      "card-bg": "#FFFFFF",
      "card-fg": "#3D2B33",
      popover: "#FFFFFF",
      "popover-foreground": "#3D2B33",
      border: "#FCDDEC",
      canvas: "#FFF5F5",
      surface: "#FFFFFF",
      elevated: "#FFF0F5",
      income: "#059669",
      expense: "#E11D48",
      warning: "#D97706",
      accent: "#F472B6",
      progress: "#FB7185",
      sidebar: "#FFF0F5",
      "sidebar-foreground": "#3D2B33",
      "sidebar-border": "#FCDDEC",
      "sidebar-accent": "#FFFFFF",
      "muted-foreground": "#AA8A98",
      "muted-bg": "#FFF0F5",
      "hover-surface": "#FFE4E1",
      "hover-elevated": "#FCDDEC",
      "hover-accent": "#EC4899",
      "hover-border": "#F8BBD0",
    },
  },
  {
    id: "sunset-crimson",
    name: "Sunset Crimson (Gelap)",
    nameEn: "Sunset Crimson (Dark)",
    description: "Tema abu-abu vulkanik gelap yang hangat dengan perpaduan aksen jingga senja dan crimson.",
    descriptionEn: "Volcanic charcoal dark background paired with sunset orange and crimson accents.",
    isDark: true,
    variables: {
      background: "#0D090B",
      foreground: "#FCE7F3",
      "card-bg": "#161013",
      "card-fg": "#FCE7F3",
      popover: "#1B1317",
      "popover-foreground": "#FCE7F3",
      border: "#38252D",
      canvas: "#0D090B",
      surface: "#161013",
      elevated: "#22181C",
      income: "#34D399",
      expense: "#F43F5E",
      warning: "#F59E0B",
      accent: "#EA580C",
      progress: "#F43F5E",
      sidebar: "#0A0708",
      "sidebar-foreground": "#FCE7F3",
      "sidebar-accent": "#161013",
      "sidebar-border": "#38252D",
      "muted-foreground": "#A78BFA",
      "muted-bg": "#22181C",
      "hover-surface": "#22181C",
      "hover-elevated": "#2D2026",
      "hover-accent": "#F97316",
      "hover-border": "#4B323C",
    },
  },
  {
    id: "oceanic-abyss",
    name: "Oceanic Abyss (Gelap)",
    nameEn: "Oceanic Abyss (Dark)",
    description: "Tema dasar laut terdalam yang misterius dengan kilauan biru sian dan biru laut.",
    descriptionEn: "Mysterious deep ocean floor background illuminated by cyan and sea blue accents.",
    isDark: true,
    variables: {
      background: "#02070F",
      foreground: "#E0F2FE",
      "card-bg": "#081322",
      "card-fg": "#E0F2FE",
      popover: "#0F1F33",
      "popover-foreground": "#E0F2FE",
      border: "#1E3A5F",
      canvas: "#02070F",
      surface: "#081322",
      elevated: "#10253E",
      income: "#059669",
      expense: "#F43F5E",
      warning: "#EAB308",
      accent: "#06B6D4",
      progress: "#3B82F6",
      sidebar: "#01050A",
      "sidebar-foreground": "#E0F2FE",
      "sidebar-accent": "#081322",
      "sidebar-border": "#1E3A5F",
      "muted-foreground": "#38BDF8",
      "muted-bg": "#10253E",
      "hover-surface": "#10253E",
      "hover-elevated": "#163152",
      "hover-accent": "#22D3EE",
      "hover-border": "#2A4E7E",
    },
  },
  {
    id: "royal-amethyst",
    name: "Royal Amethyst (Gelap)",
    nameEn: "Royal Amethyst (Dark)",
    description: "Tema ungu kerajaan mewah dengan aksen batu kecubung bersinar dan merah muda.",
    descriptionEn: "Prestigious deep royal purple background paired with amethyst violet and magenta.",
    isDark: true,
    variables: {
      background: "#08050E",
      foreground: "#F3E8FF",
      "card-bg": "#120D1E",
      "card-fg": "#F3E8FF",
      popover: "#1A132C",
      "popover-foreground": "#F3E8FF",
      border: "#322352",
      canvas: "#08050E",
      surface: "#120D1E",
      elevated: "#201836",
      income: "#10B981",
      expense: "#F43F5E",
      warning: "#EAB308",
      accent: "#A855F7",
      progress: "#EC4899",
      sidebar: "#050309",
      "sidebar-foreground": "#F3E8FF",
      "sidebar-accent": "#120D1E",
      "sidebar-border": "#322352",
      "muted-foreground": "#C084FC",
      "muted-bg": "#201836",
      "hover-surface": "#201836",
      "hover-elevated": "#2B2049",
      "hover-accent": "#C084FC",
      "hover-border": "#453171",
    },
  },
  {
    id: "deep-forest",
    name: "Deep Forest (Gelap)",
    nameEn: "Deep Forest (Dark)",
    description: "Tema hutan rimba gelap yang tenang dengan aksen hijau lumut dan kuning perunggu.",
    descriptionEn: "Deep jungle forest green background with vibrant moss green and bronze accents.",
    isDark: true,
    variables: {
      background: "#040705",
      foreground: "#E8F5E9",
      "card-bg": "#0C150E",
      "card-fg": "#E8F5E9",
      popover: "#142218",
      "popover-foreground": "#E8F5E9",
      border: "#223C2B",
      canvas: "#040705",
      surface: "#0C150E",
      elevated: "#1A2E20",
      income: "#34D399",
      expense: "#EF4444",
      warning: "#FBBF24",
      accent: "#22C55E",
      progress: "#D97706",
      sidebar: "#020403",
      "sidebar-foreground": "#E8F5E9",
      "sidebar-accent": "#0C150E",
      "sidebar-border": "#223C2B",
      "muted-foreground": "#81C784",
      "muted-bg": "#1A2E20",
      "hover-surface": "#1A2E20",
      "hover-elevated": "#233F2B",
      "hover-accent": "#4ADE80",
      "hover-border": "#30563D",
    },
  },
  {
    id: "slate-obsidian",
    name: "Slate Obsidian (Gelap)",
    nameEn: "Slate Obsidian (Dark)",
    description: "Desain industrial modern abu-abu batu dengan aksen biru indigo elektrik yang tegas.",
    descriptionEn: "Modern industrial charcoal slate with sharp electric indigo and steel blue highlights.",
    isDark: true,
    variables: {
      background: "#0F172A",
      foreground: "#F8FAFC",
      "card-bg": "#1E293B",
      "card-fg": "#F8FAFC",
      popover: "#334155",
      "popover-foreground": "#F8FAFC",
      border: "#475569",
      canvas: "#0F172A",
      surface: "#1E293B",
      elevated: "#334155",
      income: "#10B981",
      expense: "#EF4444",
      warning: "#FBBF24",
      accent: "#6366F1",
      progress: "#388BFD",
      sidebar: "#0B1324",
      "sidebar-foreground": "#F8FAFC",
      "sidebar-accent": "#1E293B",
      "sidebar-border": "#475569",
      "muted-foreground": "#94A3B8",
      "muted-bg": "#334155",
      "hover-surface": "#334155",
      "hover-elevated": "#475569",
      "hover-accent": "#818CF8",
      "hover-border": "#5B708B",
    },
  },
  {
    id: "sage-garden",
    name: "Sage Garden (Terang)",
    nameEn: "Sage Garden (Light)",
    description: "Tema terang bernuansa herbal hijau sage yang menyegarkan pikiran dan mata.",
    descriptionEn: "Fresh organic sage green light theme with deep forest spruce and eucalyptus accents.",
    isDark: false,
    variables: {
      background: "#F2F6F3",
      foreground: "#1E3F35",
      "card-bg": "#FFFFFF",
      "card-fg": "#1E3F35",
      popover: "#FFFFFF",
      "popover-foreground": "#1E3F35",
      border: "#D2DFD8",
      canvas: "#F2F6F3",
      surface: "#FFFFFF",
      elevated: "#E6ECE8",
      income: "#15803D",
      expense: "#B91C1C",
      warning: "#A16207",
      accent: "#1E3F35",
      progress: "#3A6A5E",
      sidebar: "#E6ECE8",
      "sidebar-foreground": "#1E3F35",
      "sidebar-border": "#D2DFD8",
      "sidebar-accent": "#FFFFFF",
      "muted-foreground": "#5D7D73",
      "muted-bg": "#E6ECE8",
      "hover-surface": "#E6ECE8",
      "hover-elevated": "#D8E2DC",
      "hover-accent": "#2C5E4F",
      "hover-border": "#B8C9C0",
    },
  },
  {
    id: "tuscan-sun",
    name: "Tuscan Sun (Terang)",
    nameEn: "Tuscan Sun (Light)",
    description: "Kombinasi warna mentega lembut pedesaan Italia dengan aksen jingga terracotta hangat.",
    descriptionEn: "Warm butter-cream countryside background with terracotta and olive accents.",
    isDark: false,
    variables: {
      background: "#FFFDF5",
      foreground: "#3E2723",
      "card-bg": "#FFFFFF",
      "card-fg": "#3E2723",
      popover: "#FFFFFF",
      "popover-foreground": "#3E2723",
      border: "#EAD8B1",
      canvas: "#FFFDF5",
      surface: "#FFFFFF",
      elevated: "#FAF0D7",
      income: "#166534",
      expense: "#991B1B",
      warning: "#854D0E",
      accent: "#C2410C",
      progress: "#854D0E",
      sidebar: "#FAF0D7",
      "sidebar-foreground": "#3E2723",
      "sidebar-border": "#EAD8B1",
      "sidebar-accent": "#FFFFFF",
      "muted-foreground": "#7D6A5D",
      "muted-bg": "#FAF0D7",
      "hover-surface": "#FAF0D7",
      "hover-elevated": "#EEDCB2",
      "hover-accent": "#A23508",
      "hover-border": "#DBC08C",
    },
  },
  {
    id: "glacier-breeze",
    name: "Glacier Breeze (Terang)",
    nameEn: "Glacier Breeze (Light)",
    description: "Tema sejuk salju pegunungan Alpen dengan warna biru es dan aksen turquoise.",
    descriptionEn: "Cool frosty alpine blue light theme with icy navy and turquoise accents.",
    isDark: false,
    variables: {
      background: "#F0F8FF",
      foreground: "#0F172A",
      "card-bg": "#FFFFFF",
      "card-fg": "#0F172A",
      popover: "#FFFFFF",
      "popover-foreground": "#0F172A",
      border: "#CBE2F7",
      canvas: "#F0F8FF",
      surface: "#FFFFFF",
      elevated: "#E6F2FF",
      income: "#0F766E",
      expense: "#9F1239",
      warning: "#B45309",
      accent: "#1E3A8A",
      progress: "#0D9488",
      sidebar: "#E6F2FF",
      "sidebar-foreground": "#0F172A",
      "sidebar-border": "#CBE2F7",
      "sidebar-accent": "#FFFFFF",
      "muted-foreground": "#475569",
      "muted-bg": "#E6F2FF",
      "hover-surface": "#E6F2FF",
      "hover-elevated": "#D2E6FC",
      "hover-accent": "#172554",
      "hover-border": "#B2D1F1",
    },
  },
  {
    id: "lavender-fields",
    name: "Lavender Fields (Terang)",
    nameEn: "Lavender Fields (Light)",
    description: "Tema damai padang lavender Provence dengan aksen ungu plum dan lilac lembut.",
    descriptionEn: "Peaceful Provence lavender fields style with deep plum and lilac accents.",
    isDark: false,
    variables: {
      background: "#FAF9FF",
      foreground: "#2E1065",
      "card-bg": "#FFFFFF",
      "card-fg": "#2E1065",
      popover: "#FFFFFF",
      "popover-foreground": "#2E1065",
      border: "#E4E0FC",
      canvas: "#FAF9FF",
      surface: "#FFFFFF",
      elevated: "#F3F0FF",
      income: "#15803D",
      expense: "#B91C1C",
      warning: "#A16207",
      accent: "#581C87",
      progress: "#7C3AED",
      sidebar: "#F3F0FF",
      "sidebar-foreground": "#2E1065",
      "sidebar-border": "#E4E0FC",
      "sidebar-accent": "#FFFFFF",
      "muted-foreground": "#6B589C",
      "muted-bg": "#F3F0FF",
      "hover-surface": "#F3F0FF",
      "hover-elevated": "#E7E1FC",
      "hover-accent": "#4C1D95",
      "hover-border": "#CFCAFA",
    },
  },
  {
    id: "soft-peach",
    name: "Soft Peach (Terang)",
    nameEn: "Soft Peach (Light)",
    description: "Warna pastel buah persik musim panas dengan aksen tembaga oranye hangat.",
    descriptionEn: "Juicy summer peach pastel theme with warm copper orange and apricot accents.",
    isDark: false,
    variables: {
      background: "#FFF8F3",
      foreground: "#451A03",
      "card-bg": "#FFFFFF",
      "card-fg": "#451A03",
      popover: "#FFFFFF",
      "popover-foreground": "#451A03",
      border: "#FCD7C5",
      canvas: "#FFF8F3",
      surface: "#FFFFFF",
      elevated: "#FFEBE0",
      income: "#15803D",
      expense: "#B91C1C",
      warning: "#A16207",
      accent: "#B45309",
      progress: "#E07A5F",
      sidebar: "#FFEBE0",
      "sidebar-foreground": "#451A03",
      "sidebar-border": "#FCD7C5",
      "sidebar-accent": "#FFFFFF",
      "muted-foreground": "#8A6B5D",
      "muted-bg": "#FFEBE0",
      "hover-surface": "#FFEBE0",
      "hover-elevated": "#FCD4C2",
      "hover-accent": "#9A3412",
      "hover-border": "#F8C2A8",
    },
  },
];

export const FONT_OPTIONS = [
  { id: "inter", name: "Inter (Standar Fintech)", nameEn: "Inter (Fintech Standard)", value: "'Inter', -apple-system, sans-serif" },
  { id: "outfit", name: "Outfit (Elegans & Geometris)", nameEn: "Outfit (Elegant & Geometric)", value: "'Outfit', -apple-system, sans-serif" },
  { id: "jakarta", name: "Plus Jakarta Sans (Dinamis)", nameEn: "Plus Jakarta Sans (Dynamic Sans)", value: "'Plus Jakarta Sans', -apple-system, sans-serif" },
  { id: "geist", name: "Geist (Linear & Modern)", nameEn: "Geist (Linear & Modern)", value: "'Geist', 'Inter', -apple-system, sans-serif" },
  { id: "manrope", name: "Manrope (Modern & Seimbang)", nameEn: "Manrope (Modern & Balanced)", value: "'Manrope', -apple-system, sans-serif" },
  { id: "sora", name: "Sora (Fintech & Geometris)", nameEn: "Sora (Fintech & Geometric)", value: "'Sora', -apple-system, sans-serif" },
  { id: "ibm-plex", name: "IBM Plex Sans (Teknis & Terstruktur)", nameEn: "IBM Plex Sans (Technical & Structured)", value: "'IBM Plex Sans', -apple-system, sans-serif" },
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

export interface CardStyles {
  radius: string;      // "0px" | "8px" | "16px" | "24px"
  borderWidth: string; // "0px" | "1px" | "2px" | "3px"
  blur: string;        // "0px" | "12px" | "24px"
  opacity: string;     // "1" | "0.75" | "0.5"
  dropdownRadius: string; // "0px" | "8px" | "12px" | "16px" | "24px" | "9999px"
}

export interface ButtonStyles {
  radius: string;      // "0px" | "8px" | "12px" | "16px"
  size: string;        // "default" | "compact" | "large"
  weight: string;      // "normal" | "medium" | "semibold" | "bold"
}

export function applyCardStyles(styles: CardStyles) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--card-radius", styles.radius);
  root.style.setProperty("--card-border-width", styles.borderWidth);
  root.style.setProperty("--card-backdrop-blur", styles.blur);
  root.style.setProperty("--card-opacity", styles.opacity);
  
  const dr = styles.dropdownRadius || "9999px";
  root.style.setProperty("--dropdown-radius", dr);
  root.style.setProperty("--custom-dropdown-radius", dr);
  const dmr = dr === "9999px" ? "16px" : dr;
  root.style.setProperty("--dropdown-menu-radius", dmr);
  root.style.setProperty("--custom-dropdown-menu-radius", dmr);
  
  localStorage.setItem("racks-card-styles", JSON.stringify(styles));
}

export function applyButtonStyles(styles: ButtonStyles) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--button-radius", styles.radius);
  root.style.setProperty("--button-height", styles.size === "compact" ? "36px" : styles.size === "large" ? "48px" : "44px");
  root.style.setProperty("--button-font-weight", styles.weight === "normal" ? "500" : styles.weight === "medium" ? "600" : styles.weight === "bold" ? "700" : "600");
  localStorage.setItem("racks-button-styles", JSON.stringify(styles));
}

export function loadSavedCardStyles() {
  if (typeof window === "undefined") return;
  const defaults: CardStyles = {
    radius: "16px",
    borderWidth: "1px",
    blur: "12px",
    opacity: "0.75",
    dropdownRadius: "9999px",
  };
  const savedStr = localStorage.getItem("racks-card-styles");
  let styles = defaults;
  if (savedStr) {
    try {
      styles = { ...defaults, ...JSON.parse(savedStr) };
    } catch (e) {
      // Ignore
    }
  }
  applyCardStyles(styles);
}

export function loadSavedButtonStyles() {
  if (typeof window === "undefined") return;
  const defaults: ButtonStyles = {
    radius: "12px",
    size: "default",
    weight: "semibold"
  };
  const savedStr = localStorage.getItem("racks-button-styles");
  let styles = defaults;
  if (savedStr) {
    try {
      styles = { ...defaults, ...JSON.parse(savedStr) };
    } catch (e) {
      // Ignore
    }
  }
  applyButtonStyles(styles);
}

export interface TypographyStyles {
  normal: string;   // "100" | "200" | ... | "900"
  medium: string;   // "100" | "200" | ... | "900"
  semibold: string; // "100" | "200" | ... | "900"
  bold: string;     // "100" | "200" | ... | "900"
}

export function applyTypographyStyles(styles: TypographyStyles) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--font-weight-normal", styles.normal);
  root.style.setProperty("--font-weight-medium", styles.medium);
  root.style.setProperty("--font-weight-semibold", styles.semibold);
  root.style.setProperty("--font-weight-bold", styles.bold);
  localStorage.setItem("racks-typography-styles", JSON.stringify(styles));
}

export function loadSavedTypographyStyles() {
  if (typeof window === "undefined") return;
  const defaults: TypographyStyles = {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  };
  const savedStr = localStorage.getItem("racks-typography-styles");
  let styles = defaults;
  if (savedStr) {
    try {
      styles = { ...defaults, ...JSON.parse(savedStr) };
    } catch (e) {
      // Ignore
    }
  }
  applyTypographyStyles(styles);
}

export function loadSavedTheme() {
  if (typeof window === "undefined") return;
  loadSavedFont();
  loadSavedCardStyles();
  loadSavedButtonStyles();
  loadSavedTypographyStyles();
  const themeId = localStorage.getItem("racks-theme-id") || "github-dark";
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
