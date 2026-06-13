import { useState } from "react";
import { ChevronDown, Palette, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  applyTheme,
  THEME_PRESETS,
  FONT_OPTIONS,
  applyFont,
  type ThemeVariables,
  type CardStyles,
  applyCardStyles,
  type ButtonStyles,
  applyButtonStyles,
} from "@/lib/utils/theme";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSettings() {
  const { language } = useLanguage();

  const [activePresetId, setActivePresetId] = useState(() => {
    if (typeof window === "undefined") return "nordic-midnight";
    return localStorage.getItem("racks-theme-id") || "nordic-midnight";
  });

  const [customVars, setCustomVars] = useState<Partial<ThemeVariables>>(() => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem("racks-custom-theme-vars");
    try {
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [activeFontId, setActiveFontId] = useState(() => {
    if (typeof window === "undefined") return "jakarta";
    return localStorage.getItem("racks-font-family") || "jakarta";
  });

  const [cardStyles, setCardStyles] = useState<CardStyles>(() => {
    const defaults: CardStyles = {
      radius: "16px",
      borderWidth: "1px",
      blur: "12px",
      opacity: "0.75",
      dropdownRadius: "9999px",
    };
    if (typeof window === "undefined") return defaults;
    const stored = localStorage.getItem("racks-card-styles");
    try {
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  const [buttonStyles, setButtonStyles] = useState<ButtonStyles>(() => {
    const defaults: ButtonStyles = {
      radius: "12px",
      size: "default",
      weight: "semibold",
    };
    if (typeof window === "undefined") return defaults;
    const stored = localStorage.getItem("racks-button-styles");
    try {
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  const handleCardStyleChange = (key: keyof CardStyles, value: string) => {
    const updated = { ...cardStyles, [key]: value };
    setCardStyles(updated);
    applyCardStyles(updated);
  };

  const handleButtonStyleChange = (key: keyof ButtonStyles, value: string) => {
    const updated = { ...buttonStyles, [key]: value };
    setButtonStyles(updated);
    applyButtonStyles(updated);
  };

  const handleFontChange = (id: string) => {
    setActiveFontId(id);
    applyFont(id);
    toast.success(
      language === "id"
        ? `Gaya font berhasil diubah ke ${FONT_OPTIONS.find((f) => f.id === id)?.name}`
        : `Font style updated to ${FONT_OPTIONS.find((f) => f.id === id)?.nameEn}`
    );
  };

  const handlePresetSelect = (id: string) => {
    setActivePresetId(id);
    setCustomVars({});
    applyTheme(id);
    toast.success(
      language === "id"
        ? `Tema warna berhasil diubah ke ${THEME_PRESETS.find((p) => p.id === id)?.name}`
        : `Theme color updated to ${THEME_PRESETS.find((p) => p.id === id)?.nameEn}`
    );
  };

  const handleCustomVarChange = (key: keyof ThemeVariables, value: string) => {
    const updated = { ...customVars, [key]: value };
    setCustomVars(updated);
    applyTheme(activePresetId, updated);
  };

  const radiusOptions = [
    { value: "0px", label: language === "id" ? "Tajam (0px)" : "Sharp (0px)" },
    { value: "8px", label: language === "id" ? "Kompak (8px)" : "Compact (8px)" },
    { value: "16px", label: language === "id" ? "Sedang (16px)" : "Medium (16px)" },
    { value: "24px", label: language === "id" ? "Sangat Bulat (24px)" : "Extra Rounded (24px)" },
  ];
  const borderOptions = [
    { value: "0px", label: language === "id" ? "Tanpa Garis (0px)" : "None (0px)" },
    { value: "1px", label: language === "id" ? "Tipis (1px)" : "Thin (1px)" },
    { value: "2px", label: language === "id" ? "Sedang (2px)" : "Medium (2px)" },
    { value: "3px", label: language === "id" ? "Tebal (3px)" : "Thick (3px)" },
  ];
  const blurOptions = [
    { value: "0px", label: language === "id" ? "Tanpa Blur (0px)" : "None (0px)" },
    { value: "12px", label: language === "id" ? "Sedang (12px)" : "Medium (12px)" },
    { value: "24px", label: language === "id" ? "Tebal (24px)" : "Heavy Frost (24px)" },
  ];
  const opacityOptions = [
    { value: "1", label: language === "id" ? "Padat (100%)" : "Solid (100%)" },
    { value: "0.75", label: language === "id" ? "Sedang (75%)" : "Medium (75%)" },
    { value: "0.5", label: language === "id" ? "Transparan (50%)" : "Clear (50%)" },
  ];
  const dropdownRadiusOptions = [
    { value: "0px", label: language === "id" ? "Tajam (0px)" : "Sharp (0px)" },
    { value: "8px", label: language === "id" ? "Kompak (8px)" : "Compact (8px)" },
    { value: "12px", label: language === "id" ? "Sedang (12px)" : "Medium (12px)" },
    { value: "16px", label: language === "id" ? "Bulat (16px)" : "Rounded (16px)" },
    { value: "9999px", label: language === "id" ? "Kapsul / Pill" : "Pill / Capsule" },
  ];

  const selectedRadiusLabel = radiusOptions.find((o) => o.value === cardStyles.radius)?.label ?? cardStyles.radius;
  const selectedBorderLabel = borderOptions.find((o) => o.value === cardStyles.borderWidth)?.label ?? cardStyles.borderWidth;
  const selectedBlurLabel = blurOptions.find((o) => o.value === cardStyles.blur)?.label ?? cardStyles.blur;
  const selectedOpacityLabel = opacityOptions.find((o) => o.value === cardStyles.opacity)?.label ?? cardStyles.opacity;
  const selectedDropdownRadiusLabel = dropdownRadiusOptions.find((o) => o.value === (cardStyles.dropdownRadius || "9999px"))?.label ?? (language === "id" ? "Kapsul / Pill (9999px)" : "Pill / Capsule (9999px)");

  const btnRadiusOptions = [
    { value: "0px", label: language === "id" ? "Tajam (0px)" : "Sharp (0px)" },
    { value: "8px", label: language === "id" ? "Sedikit (8px)" : "Slight (8px)" },
    { value: "12px", label: language === "id" ? "Sedang (12px)" : "Medium (12px)" },
    { value: "16px", label: language === "id" ? "Bulat (16px)" : "Rounded (16px)" },
  ];
  const btnSizeOptions = [
    { value: "compact", label: language === "id" ? "Kompak (36px)" : "Compact (36px)" },
    { value: "default", label: language === "id" ? "Standar (44px)" : "Default (44px)" },
    { value: "large", label: language === "id" ? "Besar (48px)" : "Large (48px)" },
  ];
  const btnWeightOptions = [
    { value: "normal", label: language === "id" ? "Normal (500)" : "Normal (500)" },
    { value: "medium", label: language === "id" ? "Sedang (600)" : "Medium (600)" },
    { value: "semibold", label: language === "id" ? "Semi Tebal (600)" : "Semibold (600)" },
    { value: "bold", label: language === "id" ? "Tebal (700)" : "Bold (700)" },
  ];

  const selectedBtnRadiusLabel = btnRadiusOptions.find((o) => o.value === buttonStyles.radius)?.label ?? buttonStyles.radius;
  const selectedBtnSizeLabel = btnSizeOptions.find((o) => o.value === buttonStyles.size)?.label ?? buttonStyles.size;
  const selectedBtnWeightLabel = btnWeightOptions.find((o) => o.value === buttonStyles.weight)?.label ?? buttonStyles.weight;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-base font-medium text-foreground flex items-center gap-2">
            <Palette size={14} className="text-muted-foreground" />
            {language === "id" ? "Kustomisasi Warna Website" : "Website Color Customization"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "id"
              ? "Pilih preset tema warna yang direkomendasikan atau sesuaikan warna secara manual untuk mempersonalisasi dashboard keuangan Anda."
              : "Select a recommended theme preset or customize colors manually to personalize your financial dashboard."}
          </p>
        </div>

        {/* Preset Cards Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {language === "id" ? "Rekomendasi Preset Warna (Terang & Gelap)" : "Recommended Color Presets (Light & Dark)"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEME_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={cn(
                    "flex flex-col text-left p-4 rounded-2xl border text-sm transition-all duration-200 hover:scale-[1.01] relative overflow-hidden",
                    isSelected
                      ? "bg-accent/5 border-accent shadow-md shadow-accent/5"
                      : "bg-surface/50 border-border hover:border-border/80"
                  )}
                  style={{
                    backgroundColor: preset.variables.background,
                    color: preset.variables.foreground,
                    borderColor: isSelected ? preset.variables.accent : undefined,
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                  }}
                >
                  {/* Selected Indicator Badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 bg-accent/20 border border-accent/40 text-accent text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {language === "id" ? "Aktif" : "Active"}
                    </div>
                  )}

                  <span className="font-bold text-[14px]">
                    {language === "id" ? preset.name : preset.nameEn}
                  </span>
                  <span className="text-[10px] opacity-60 mt-1 line-clamp-2">
                    {language === "id" ? preset.description : preset.descriptionEn}
                  </span>

                  {/* Color Preview Strip */}
                  <div className="flex gap-1.5 mt-4 w-full">
                    <div className="w-5 h-5 rounded-md border border-white/[0.08] shrink-0" style={{ backgroundColor: preset.variables.background }} title="Background" />
                    <div className="w-5 h-5 rounded-md border border-white/[0.08] shrink-0" style={{ backgroundColor: preset.variables.surface }} title="Card/Surface" />
                    <div className="w-5 h-5 rounded-md border border-white/[0.08] shrink-0" style={{ backgroundColor: preset.variables.elevated }} title="Popover/Elevated" />
                    <div className="w-5 h-5 rounded-md border border-white/[0.08] shrink-0" style={{ backgroundColor: preset.variables.border }} title="Border" />
                    <div className="w-5 h-5 rounded-md border border-white/[0.08] shrink-0" style={{ backgroundColor: preset.variables.accent }} title="Accent" />
                    <div className="w-5 h-5 rounded-md border border-white/[0.08] shrink-0 ml-auto" style={{ backgroundColor: preset.variables.income }} title="Income" />
                    <div className="w-5 h-5 rounded-md border border-white/[0.08] shrink-0" style={{ backgroundColor: preset.variables.expense }} title="Expense" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Color Adjust Panel */}
        <div className="mt-8 border-t border-border/60 pt-6 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {language === "id" ? "Penyesuaian Warna Manual" : "Manual Color Adjustments"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Accent Color */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.accent || "#3B82F6";
              const current = customVars.accent || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("accent", e.target.value)}
                      onInput={(e) => handleCustomVarChange("accent", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Aksen / Tombol Utama" : "Accent / Primary Buttons"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("accent", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Page Background */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.background || "#0A0E1A";
              const current = customVars.background || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("background", e.target.value)}
                      onInput={(e) => handleCustomVarChange("background", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Latar Belakang Halaman" : "Page Background"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("background", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Card Surface */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables["card-bg"] || "#111827";
              const current = customVars["card-bg"] || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("card-bg", e.target.value)}
                      onInput={(e) => handleCustomVarChange("card-bg", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Latar Belakang Panel/Kartu" : "Card / Panel Surface"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("card-bg", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Dropdown Menu & Popovers */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.elevated || "#1E293B";
              const current = customVars.elevated || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("elevated", e.target.value)}
                      onInput={(e) => handleCustomVarChange("elevated", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Menu Dropdown & Popover" : "Dropdown & Popover Menus"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("elevated", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Borders & Dividers */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.border || "#334155";
              const current = customVars.border || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("border", e.target.value)}
                      onInput={(e) => handleCustomVarChange("border", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Garis Batas & Pembatas" : "Borders & Dividers"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("border", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Progress Bar Color */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.progress || "#3B82F6";
              const current = customVars.progress || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("progress", e.target.value)}
                      onInput={(e) => handleCustomVarChange("progress", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Warna Progress Bar" : "Progress Bar Color"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("progress", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Primary Text Color */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.foreground || "#F8FAFC";
              const current = customVars.foreground || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("foreground", e.target.value)}
                      onInput={(e) => handleCustomVarChange("foreground", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Warna Teks Utama" : "Primary Text Color"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("foreground", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Secondary Text Color */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables["muted-foreground"] || "#94A3B8";
              const current = customVars["muted-foreground"] || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("muted-foreground", e.target.value)}
                      onInput={(e) => handleCustomVarChange("muted-foreground", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Warna Teks Sekunder" : "Secondary Text Color"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("muted-foreground", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Income / Success Color */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.income || "#10B981";
              const current = customVars.income || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("income", e.target.value)}
                      onInput={(e) => handleCustomVarChange("income", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Warna Uang Masuk / Sukses" : "Income / Success Color"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("income", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Expense / Danger Color */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.expense || "#EF4444";
              const current = customVars.expense || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("expense", e.target.value)}
                      onInput={(e) => handleCustomVarChange("expense", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Warna Uang Keluar / Bahaya" : "Expense / Danger Color"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("expense", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Warning / Pending Color */}
            {(() => {
              const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
              const def = preset?.variables.warning || "#F59E0B";
              const current = customVars.warning || def;
              return (
                <div
                  className="flex flex-col gap-1.5 p-3 border transition-all duration-200"
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                    backdropFilter: 'var(--card-backdrop-filter)',
                    WebkitBackdropFilter: 'var(--card-backdrop-filter)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleCustomVarChange("warning", e.target.value)}
                      onInput={(e) => handleCustomVarChange("warning", (e.target as HTMLInputElement).value)}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent shrink-0"
                    />
                    <span className="text-xs text-foreground font-semibold">
                      {language === "id" ? "Warna Uang Pending / Peringatan" : "Warning / Pending Color"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>{current}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomVarChange("warning", def)}
                      className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-foreground rounded transition-all"
                    >
                      {language === "id" ? `Bawaan: ${def}` : `Default: ${def}`}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Reset Customizations Button */}
          {Object.keys(customVars).length > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCustomVars({});
                  applyTheme(activePresetId);
                  toast.success(
                    language === "id"
                      ? "Penyesuaian warna manual berhasil dikembalikan ke default preset."
                      : "Manual color adjustments reset to preset default."
                  );
                }}
                className="text-xs hover:bg-white/[0.05]"
              >
                {language === "id" ? "Kembalikan ke Default Preset" : "Reset to Preset Default"}
              </Button>
            </div>
          )}
        </div>

        {/* Informational Color Breakdown Guide */}
        <div className="mt-8 pt-6 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {language === "id" ? "Panduan Peruntukan Warna" : "Color Mapping Guide"}
          </h3>

          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Visual UI Mapping Demo Widget */}
            <div
              className="w-full lg:w-80 p-5 border border-border bg-card/60 backdrop-blur-md space-y-4 text-left flex flex-col justify-between shrink-0"
              style={{ borderRadius: 'var(--card-radius)' }}
            >
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {language === "id" ? "Skema Variabel Elemen UI" : "UI Element Variable Mapping"}
                </p>

                <div className="space-y-3">
                  {/* Mock Search input (elevated) */}
                  <div className="p-2 rounded-lg bg-elevated border border-border flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>{language === "id" ? "Cari transaksi..." : "Search..."}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/30 font-mono text-foreground/75">var(--elevated)</span>
                  </div>

                  {/* Mock Item (border & bg-card & text) */}
                  <div className="p-3 rounded-xl border border-border bg-card/85 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-foreground">{language === "id" ? "Pekerjaan Lepas" : "Freelance Income"}</p>
                      <p className="text-[8px] text-muted-foreground font-mono">var(--card-bg)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-income font-mono tabular-nums">+Rp 1.500.000</span>
                      <span className="text-[8px] text-muted-foreground block font-mono">var(--income)</span>
                    </div>
                  </div>

                  {/* Mock Expense Item */}
                  <div className="p-3 rounded-xl border border-border bg-card/85 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-foreground">{language === "id" ? "Pembelian Kopi" : "Coffee Shop"}</p>
                      <p className="text-[8px] text-muted-foreground font-mono">var(--card-bg)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-expense font-mono tabular-nums">-Rp 45.000</span>
                      <span className="text-[8px] text-muted-foreground block font-mono">var(--expense)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Action (accent) */}
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <button type="button" className="flex-1 py-1.5 rounded-lg border border-border hover:bg-white/[0.02] text-[10px] text-muted-foreground transition">
                    {language === "id" ? "Batal" : "Cancel"}
                  </button>
                  <button type="button" className="px-3 py-1.5 rounded-lg bg-accent text-white text-[10px] font-semibold hover:bg-accent/80 transition flex items-center gap-1.5">
                    <span>{language === "id" ? "Simpan" : "Save"}</span>
                    <span className="text-[8px] opacity-75 font-mono">var(--accent)</span>
                  </button>
                </div>

                {/* Footer showing global layout variables */}
                <div className="pt-3 border-t border-border/50 space-y-1.5 text-[9px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{language === "id" ? "Latar Kanvas:" : "Canvas Background:"}</span>
                    <span className="font-mono text-foreground font-semibold">var(--background)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === "id" ? "Garis Batas:" : "Borders / Dividers:"}</span>
                    <span className="font-mono text-foreground font-semibold">var(--border)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descriptions Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div
                className="p-3.5 border transition-all duration-300 space-y-1.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-xs font-bold text-foreground">Accent / Brand Color</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {language === "id"
                    ? "Digunakan untuk tombol utama (CTA), tautan aktif, fokus ring, dan status penanda utama di dashboard."
                    : "Used for primary call-to-action buttons, active navigation links, focus rings, and primary highlights."}
                </p>
              </div>

              <div
                className="p-3.5 border transition-all duration-300 space-y-1.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-background" />
                  <span className="text-xs font-bold text-foreground">Background Canvas</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {language === "id"
                    ? "Warna dasar latar belakang halaman utama website. Menentukan atmosfer kontras (Terang/Gelap) seluruh dashboard."
                    : "The base background color of the main workspace canvas. Sets the contrast tone of the whole application."}
                </p>
              </div>

              <div
                className="p-3.5 border transition-all duration-300 space-y-1.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-surface" />
                  <span className="text-xs font-bold text-foreground">Card Surface Color</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {language === "id"
                    ? "Digunakan sebagai latar belakang panel statistik, ringkasan saldo, tabel transaksi, dan kartu modul."
                    : "Used as the surface color for stat cards, balance summaries, transaction tables, and panel elements."}
                </p>
              </div>

              <div
                className="p-3.5 border transition-all duration-300 space-y-1.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-elevated" />
                  <span className="text-xs font-bold text-foreground">Elevated Surface</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {language === "id"
                    ? "Digunakan untuk dropdown menu, dialog modal melayang, tooltip, serta bar pencarian input."
                    : "Used for dropdown menus, modal boxes, hover tooltips, and default input search bars."}
                </p>
              </div>

              <div
                className="p-3.5 border transition-all duration-300 space-y-1.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-border" />
                  <span className="text-xs font-bold text-foreground">Border / Dividers</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {language === "id"
                    ? "Digunakan untuk seluruh garis pemisah, garis tabel, dan outline border pada input serta panel."
                    : "Used for all horizontal dividers, grid lines, table row borders, and panel outline strokes."}
                </p>
              </div>

              <div
                className="p-3.5 border transition-all duration-300 space-y-1.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-income/20 border border-income/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-income" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Financial Status (Income / Expense)</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {language === "id"
                    ? "Hijau digunakan untuk nominal pemasukan dan kenaikan aset; merah digunakan untuk nominal pengeluaran dan kerugian."
                    : "Green tracks positive cashflow and asset appreciation; red tracks expenses and capital losses."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Typography Customization */}
        <div className="mt-6 pt-6 space-y-4 border-t border-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {language === "id" ? "Gaya Huruf / Tipografi" : "Typography & Font Styles"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {FONT_OPTIONS.map((option) => {
              const isSelected = activeFontId === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleFontChange(option.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-300",
                    isSelected
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-border/60 bg-transparent hover:border-accent/30 hover:bg-white/[0.01]"
                  )}
                  style={{
                    borderRadius: 'var(--card-radius)',
                    borderWidth: 'var(--card-border-width)',
                  }}
                >
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {language === "id" ? option.name : option.nameEn}
                  </span>
                  <span
                    className="text-lg font-semibold tracking-tight text-foreground mt-2"
                    style={{ fontFamily: option.value }}
                  >
                    Rp 12.345.678
                  </span>
                  <span
                    className="text-[10px] text-muted-foreground font-mono mt-1"
                    style={{ fontFamily: option.value }}
                  >
                    {option.id === "jetbrains" ? "Tabular Mono font" : "Sans-serif tabular-nums"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Style Customization */}
        <div className="mt-6 pt-6 space-y-6 border-t border-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {language === "id" ? "Gaya & Tampilan Kartu" : "Card Styles & Appearance"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Card Roundedness */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Sudut Kelengkungan" : "Corner Radius"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedRadiusLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {radiusOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleCardStyleChange("radius", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Card Border Thickness */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Ketebalan Garis Batas" : "Border Thickness"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedBorderLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {borderOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleCardStyleChange("borderWidth", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Card Glassmorphism Backdrop Blur */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Kekaburan Latar (Blur)" : "Backdrop Blur"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedBlurLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {blurOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleCardStyleChange("blur", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Card Background Opacity */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Tingkat Transparansi" : "Card Transparency"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedOpacityLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {opacityOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleCardStyleChange("opacity", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Dropdown Roundedness */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Kelengkungan Dropdown" : "Dropdown Roundedness"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedDropdownRadiusLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {dropdownRadiusOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleCardStyleChange("dropdownRadius", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Real-time Preview */}
          <div
            className="mt-6 p-5 rounded-2xl border border-border/30 bg-white/[0.01]"
            style={{
              borderRadius: 'var(--card-radius)',
              borderWidth: 'var(--card-border-width)',
              backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
            }}
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              {language === "id" ? "Pratinjau Kartu Terkustomisasi" : "Customized Card Preview"}
            </p>

            <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">
              {/* The actual Card Preview */}
              <div
                className="w-full lg:w-[360px] p-6 border text-card-foreground flex flex-col justify-between gap-4 transition-all duration-300"
                style={{
                  borderRadius: cardStyles.radius,
                  borderWidth: cardStyles.borderWidth,
                  borderColor: "color-mix(in srgb, var(--border) 50%, transparent)",
                  backdropFilter: `blur(${cardStyles.blur})`,
                  WebkitBackdropFilter: `blur(${cardStyles.blur})`,
                  backgroundColor: `color-mix(in srgb, var(--card-bg) calc(${cardStyles.opacity} * 100%), transparent)`,
                }}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {language === "id" ? "Total Kekayaan Bersih" : "Total Net Worth"}
                      </p>
                      <h4 className="text-lg font-bold font-mono tabular-nums text-foreground mt-0.5">
                        Rp 150.250.000
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-income/10 text-income border border-income/20">
                      +12.4%
                    </span>
                  </div>

                  {/* Card Inner Content - mini progress indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{language === "id" ? "Target Investasi" : "Investment Target"}</span>
                      <span>75%</span>
                    </div>
                    <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: "75%" }} />
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="flex justify-end gap-2 pt-3 border-t border-border/20">
                  <button type="button" className="px-2.5 py-1.5 border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all" style={{ borderRadius: 'var(--button-radius)' }}>
                    {language === "id" ? "Batal" : "Cancel"}
                  </button>
                  <button type="button" className="px-2.5 py-1.5 bg-accent text-white text-[10px] font-semibold hover:bg-accent/80 transition-all" style={{ borderRadius: 'var(--button-radius)' }}>
                    {language === "id" ? "Terapkan" : "Apply"}
                  </button>
                </div>
              </div>

              {/* Explanatory notes */}
              <div
                className="flex-1 p-5 border flex flex-col justify-center text-left text-xs text-muted-foreground space-y-2.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <p className="font-semibold text-foreground text-sm">
                  {language === "id" ? "Detail Penerapan Gaya Kartu:" : "Card Styling Properties Applied:"}
                </p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>
                    <strong>{language === "id" ? "Sudut Kelengkungan" : "Corner Radius"}:</strong> {language === "id" ? `Tepi luar kotak kartu melengkung sebesar ${cardStyles.radius}` : `Card corner radius set to ${cardStyles.radius}`}.
                  </li>
                  <li>
                    <strong>{language === "id" ? "Ketebalan Garis" : "Border Thickness"}:</strong> {language === "id" ? `Garis pembatas luar berukuran ${cardStyles.borderWidth}` : `Outer outlines stroke is ${cardStyles.borderWidth}`}.
                  </li>
                  <li>
                    <strong>{language === "id" ? "Kekaburan Latar" : "Backdrop Blur"}:</strong> {language === "id" ? `Efek kaca buram (blur) di latar belakang diatur ke ${cardStyles.blur}` : `Glass backdrop frosted blur is ${cardStyles.blur}`}.
                  </li>
                  <li>
                    <strong>{language === "id" ? "Tingkat Transparansi" : "Card Transparency"}:</strong> {language === "id" ? `Kepadatan latar kartu diatur ke ${Math.round(parseFloat(cardStyles.opacity) * 100)}%` : `Card surface color opacity is ${Math.round(parseFloat(cardStyles.opacity) * 100)}%`}.
                  </li>
                  <li>
                    <strong>{language === "id" ? "Kelengkungan Dropdown" : "Dropdown Roundedness"}:</strong> {language === "id" ? `Sudut kelengkungan tombol pilihan (dropdown) diatur ke ${cardStyles.dropdownRadius || "9999px"}` : `Dropdown triggers corner radius set to ${cardStyles.dropdownRadius || "9999px"}`}.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Button Customization */}
        <div className="mt-6 pt-6 space-y-6 border-t border-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {language === "id" ? "Gaya & Tampilan Tombol" : "Button Styles & Appearance"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Button Corner Radius */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Sudut Kelengkungan" : "Corner Radius"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedBtnRadiusLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {btnRadiusOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleButtonStyleChange("radius", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Button Height Size */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Tinggi Tombol" : "Button Height"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedBtnSizeLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {btnSizeOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleButtonStyleChange("size", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Button Font Weight */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Ketebalan Font" : "Font Weight"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none"
                  >
                    <span>{selectedBtnWeightLabel}</span>
                    <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px] max-h-[250px] overflow-y-auto rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl z-[1000]">
                  {btnWeightOptions.map((o) => (
                    <DropdownMenuItem
                      key={o.value}
                      className="text-xs font-semibold cursor-pointer"
                      onClick={() => handleButtonStyleChange("weight", o.value)}
                    >
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Button Preview */}
          <div
            className="mt-6 p-5 rounded-2xl border border-border/30 bg-white/[0.01]"
            style={{
              borderRadius: 'var(--card-radius)',
              borderWidth: 'var(--card-border-width)',
              backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
            }}
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              {language === "id" ? "Pratinjau Tombol Terkustomisasi" : "Customized Button Preview"}
            </p>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Button Variants Preview */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    {language === "id" ? "Varian Tombol" : "Button Variants"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button>{language === "id" ? "Tombol Utama" : "Primary Button"}</Button>
                    <Button variant="secondary">{language === "id" ? "Sekunder" : "Secondary"}</Button>
                    <Button variant="outline">{language === "id" ? "Outline" : "Outline"}</Button>
                    <Button variant="ghost">{language === "id" ? "Ghost" : "Ghost"}</Button>
                    <Button variant="destructive">{language === "id" ? "Hapus" : "Delete"}</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    {language === "id" ? "Dengan Ikon" : "With Icons"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button>
                      <Plus size={16} />
                      {language === "id" ? "Tambah Transaksi" : "Add Transaction"}
                    </Button>
                    <Button variant="secondary">
                      <Settings size={16} />
                      {language === "id" ? "Pengaturan" : "Settings"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Explanatory notes */}
              <div
                className="flex-1 p-5 border flex flex-col justify-center text-left text-xs text-muted-foreground space-y-2.5"
                style={{
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                }}
              >
                <p className="font-semibold text-foreground text-sm">
                  {language === "id" ? "Detail Penerapan Gaya Tombol:" : "Button Styling Properties Applied:"}
                </p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>
                    <strong>{language === "id" ? "Sudut Kelengkungan" : "Corner Radius"}:</strong> {language === "id" ? `Sudut tombol melengkung sebesar ${buttonStyles.radius}` : `Button corners rounded to ${buttonStyles.radius}`}.
                  </li>
                  <li>
                    <strong>{language === "id" ? "Tinggi Tombol" : "Button Height"}:</strong> {language === "id" ? `Tinggi tombol diatur ke ${buttonStyles.size === "compact" ? "36px (kompak)" : buttonStyles.size === "large" ? "48px (besar)" : "44px (standar)"}` : `Button height set to ${buttonStyles.size === "compact" ? "36px (compact)" : buttonStyles.size === "large" ? "48px (large)" : "44px (default)"}`}.
                  </li>
                  <li>
                    <strong>{language === "id" ? "Ketebalan Font" : "Font Weight"}:</strong> {language === "id" ? `Ketebalan teks tombol diatur ke ${buttonStyles.weight === "normal" ? "500 (normal)" : buttonStyles.weight === "bold" ? "700 (tebal)" : "600 (sedang)"}` : `Button text weight set to ${buttonStyles.weight === "normal" ? "500 (normal)" : buttonStyles.weight === "bold" ? "700 (bold)" : "600 (medium)"}`}.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
