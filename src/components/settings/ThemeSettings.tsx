import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Palette, Plus, Settings, Type, CreditCard, Square, Bell } from "lucide-react";
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
  type TypographyStyles,
  applyTypographyStyles,
} from "@/lib/utils/theme";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function SettingsSelect<T extends string | number | boolean>({
  value,
  onChange,
  options,
  className,
  minWidth = "150px",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  minWidth?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : String(value);

  const updatePosition = () => {
    if (triggerRef.current && containerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupHeight = containerRef.current.offsetHeight || 150;
      const popupWidth = containerRef.current.offsetWidth || parseInt(minWidth) || 150;
      
      let top = triggerRect.bottom + 4;
      let left = triggerRect.left;
      
      if (top + popupHeight > window.innerHeight && triggerRect.top - popupHeight > 0) {
        top = triggerRect.top - popupHeight - 4;
      }
      
      if (left + popupWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - popupWidth - 10);
      }
      
      setPosition({ top, left });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      
      let attempts = 0;
      const tryPosition = () => {
        if (containerRef.current && triggerRef.current) {
          updatePosition();
          if (containerRef.current.offsetHeight > 0) return;
        }
        if (attempts < 5) {
          attempts++;
          requestAnimationFrame(tryPosition);
        }
      };
      requestAnimationFrame(tryPosition);

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("click", handleClose, true);
    return () => document.removeEventListener("click", handleClose, true);
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-white/[0.04] transition-all outline-none text-left",
          className
        )}
        style={{ borderRadius: "var(--button-radius)" }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={14} className="opacity-60 shrink-0 ml-2" />
      </button>

      {isOpen && createPortal(
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: position ? `${position.top}px` : "-9999px",
            left: position ? `${position.left}px` : "-9999px",
            visibility: position ? undefined : "hidden",
            width: minWidth,
            borderRadius: "var(--custom-dropdown-menu-radius, 12px)",
          }}
          className="p-1 border border-white/[0.08] bg-popover/95 backdrop-blur-xl flex flex-col text-text-primary shadow-2xl z-[100000] max-h-[300px] overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 px-2.5 text-xs font-semibold outline-none transition-colors duration-200 text-left hover:bg-white/[0.06] text-text-primary",
                opt.value === value ? "bg-white/[0.04] text-foreground font-semibold" : "text-muted-foreground"
              )}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export function ThemeSettings() {
  const { language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<"colors" | "typography" | "cards" | "buttons" | "notifications">("colors");

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

  const [typographyStyles, setTypographyStyles] = useState<TypographyStyles>(() => {
    const defaults: TypographyStyles = {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    };
    if (typeof window === "undefined") return defaults;
    const stored = localStorage.getItem("racks-typography-styles");
    try {
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const defaults = {
      position: "top-right",
      theme: "dark",
      duration: 4000,
      expand: false,
    };
    if (typeof window === "undefined") return defaults;
    const stored = localStorage.getItem("racks-notification-settings");
    try {
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
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

  const handleTypographyStyleChange = (key: keyof TypographyStyles, value: string) => {
    const updated = { ...typographyStyles, [key]: value };
    setTypographyStyles(updated);
    applyTypographyStyles(updated);
    toast.success(
      language === "id"
        ? "Ketebalan huruf berhasil diperbarui!"
        : "Typography weight updated successfully!"
    );
  };

  const handleNotificationChange = (key: string, value: any) => {
    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);
    localStorage.setItem("racks-notification-settings", JSON.stringify(updated));
    window.dispatchEvent(new Event("notification-settings-changed"));
  };

  const triggerTestNotification = (type: "success" | "error" | "info") => {
    if (type === "success") {
      toast.success(
        language === "id" ? "Berhasil menyimpan pengaturan!" : "Settings saved successfully!",
        {
          description: language === "id" ? "Semua kustomisasi Anda telah diterapkan secara instan." : "All your customizations have been applied instantly."
        }
      );
    } else if (type === "error") {
      toast.error(
        language === "id" ? "Koneksi terputus dengan server!" : "Connection lost with the server!",
        {
          description: language === "id" ? "Mohon periksa sambungan internet Anda dan coba lagi." : "Please check your internet connection and try again."
        }
      );
    } else {
      toast(
        language === "id" ? "Informasi Sistem Terbaru" : "Latest System Information",
        {
          description: language === "id" ? "Fitur kustomisasi notifikasi sekarang sudah aktif." : "Notification customization features are now active."
        }
      );
    }
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

  const generalWeightOptions = [
    { value: "100", label: language === "id" ? "Sangat Tipis (Thin 100)" : "Thin (100)" },
    { value: "200", label: language === "id" ? "Ekstra Ringan (Extra Light 200)" : "Extra Light (200)" },
    { value: "300", label: language === "id" ? "Ringan (Light 300)" : "Light (300)" },
    { value: "400", label: language === "id" ? "Biasa (Normal 400)" : "Regular (400)" },
    { value: "500", label: language === "id" ? "Sedang (Medium 500)" : "Medium (500)" },
    { value: "600", label: language === "id" ? "Semi Tebal (Semibold 600)" : "Semibold (600)" },
    { value: "700", label: language === "id" ? "Tebal (Bold 700)" : "Bold (700)" },
    { value: "800", label: language === "id" ? "Sangat Tebal (Extra Bold 800)" : "Extra Bold (800)" },
    { value: "900", label: language === "id" ? "Hitam Pekat (Black 900)" : "Black (900)" },
  ];

  const subTabs: { id: "colors" | "typography" | "cards" | "buttons" | "notifications"; label: string; icon: React.ReactNode }[] = [
    { id: "colors", label: language === "id" ? "Tema & Warna" : "Theme & Colors", icon: <Palette size={14} /> },
    { id: "typography", label: language === "id" ? "Tipografi" : "Typography", icon: <Type size={14} /> },
    { id: "cards", label: language === "id" ? "Gaya Kartu" : "Card Styles", icon: <CreditCard size={14} /> },
    { id: "buttons", label: language === "id" ? "Gaya Tombol" : "Button Styles", icon: <Square size={14} /> },
    { id: "notifications", label: language === "id" ? "Notifikasi" : "Notifications", icon: <Bell size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-base font-medium text-foreground flex items-center gap-2">
            <Palette size={14} className="text-muted-foreground" />
            {language === "id" ? "Personalisasi Tampilan" : "Appearance Customization"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "id"
              ? "Sesuaikan warna, jenis huruf, serta tampilan kartu dan tombol untuk mempercantik antarmuka keuangan Anda."
              : "Customize color palettes, typography fonts, cards layout, and buttons to match your branding aesthetics."}
          </p>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap gap-1 border-b border-border/40 pb-3 mb-6">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150",
                activeSubTab === tab.id
                  ? "bg-accent/10 border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab === "colors" && (
          <div className="space-y-6 animate-fade-in-up">

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
      </div>
    )}

        {activeSubTab === "typography" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-4">
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

              {/* Custom Font Weights */}
              <div className="mt-8 pt-6 border-t border-border/40 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {language === "id" ? "Kustomisasi Ketebalan Huruf (Font Weights)" : "Custom Font Weights"}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Normal Weight */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">
                      {language === "id" ? "Teks Biasa (Normal)" : "Regular Text"}
                    </label>
                    <SettingsSelect
                      value={typographyStyles.normal}
                      onChange={(val) => handleTypographyStyleChange("normal", val)}
                      minWidth="150px"
                      options={generalWeightOptions}
                    />
                  </div>

                  {/* Medium Weight */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">
                      {language === "id" ? "Teks Sedang (Medium)" : "Medium Text"}
                    </label>
                    <SettingsSelect
                      value={typographyStyles.medium}
                      onChange={(val) => handleTypographyStyleChange("medium", val)}
                      minWidth="150px"
                      options={generalWeightOptions}
                    />
                  </div>

                  {/* Semibold Weight */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">
                      {language === "id" ? "Teks Semi Tebal (Semibold)" : "Semibold Text"}
                    </label>
                    <SettingsSelect
                      value={typographyStyles.semibold}
                      onChange={(val) => handleTypographyStyleChange("semibold", val)}
                      minWidth="150px"
                      options={generalWeightOptions}
                    />
                  </div>

                  {/* Bold Weight */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">
                      {language === "id" ? "Teks Tebal (Bold)" : "Bold Text"}
                    </label>
                    <SettingsSelect
                      value={typographyStyles.bold}
                      onChange={(val) => handleTypographyStyleChange("bold", val)}
                      minWidth="150px"
                      options={generalWeightOptions}
                    />
                  </div>
                </div>

                {/* Typography Preview box */}
                <div
                  className="mt-6 p-5 border text-left rounded-2xl flex flex-col justify-center gap-3 transition-all duration-300"
                  style={{
                    borderRadius: "var(--card-radius)",
                    borderWidth: "var(--card-border-width)",
                    borderColor: "var(--border)",
                    backgroundColor: "color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)",
                  }}
                >
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {language === "id" ? "Pratinjau Ketebalan Huruf Terkustomisasi" : "Customized Typography Weight Preview"}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-normal text-foreground">
                      <span className="text-muted-foreground font-mono mr-3">[font-normal]:</span>
                      {language === "id" ? "Ini adalah teks biasa (regular) yang digunakan untuk deskripsi dan konten utama." : "This is regular text used for descriptions and main content."}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-muted-foreground font-mono mr-3">[font-medium]:</span>
                      {language === "id" ? "Ini adalah teks tingkat sedang, digunakan untuk label formulir dan sub-item." : "This is medium text, used for form labels and sub-items."}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      <span className="text-muted-foreground font-mono mr-3">[font-semibold]:</span>
                      {language === "id" ? "Ini adalah teks semi-tebal, digunakan untuk judul kartu dan penekanan data." : "This is semibold text, used for card headers and data emphasis."}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      <span className="text-muted-foreground font-mono mr-3">[font-bold]:</span>
                      {language === "id" ? "Ini adalah teks tebal, digunakan untuk judul halaman dan nominal uang utama." : "This is bold text, used for page titles and main monetary values."}
                    </p>
                    <p className="text-sm font-extrabold text-foreground">
                      <span className="text-muted-foreground font-mono mr-3">[font-extrabold]:</span>
                      {language === "id" ? "Teks sangat tebal, mengikuti konfigurasi ketebalan bold." : "Extra bold text, following the bold weight configuration."}
                    </p>
                    <p className="text-sm font-black text-foreground">
                      <span className="text-muted-foreground font-mono mr-3">[font-black]:</span>
                      {language === "id" ? "Teks hitam pekat, mengikuti konfigurasi ketebalan bold." : "Black/heavy text, following the bold weight configuration."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "cards" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {language === "id" ? "Gaya & Tampilan Kartu" : "Card Styles & Appearance"}
              </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Card Roundedness */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Sudut Kelengkungan" : "Corner Radius"}
              </label>
              <SettingsSelect
                value={cardStyles.radius}
                onChange={(val) => handleCardStyleChange("radius", val)}
                minWidth="150px"
                options={radiusOptions}
              />
            </div>

            {/* Card Border Thickness */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Ketebalan Garis Batas" : "Border Thickness"}
              </label>
              <SettingsSelect
                value={cardStyles.borderWidth}
                onChange={(val) => handleCardStyleChange("borderWidth", val)}
                minWidth="150px"
                options={borderOptions}
              />
            </div>

            {/* Card Glassmorphism Backdrop Blur */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Kekaburan Latar (Blur)" : "Backdrop Blur"}
              </label>
              <SettingsSelect
                value={cardStyles.blur}
                onChange={(val) => handleCardStyleChange("blur", val)}
                minWidth="150px"
                options={blurOptions}
              />
            </div>

            {/* Card Background Opacity */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Tingkat Transparansi" : "Card Transparency"}
              </label>
              <SettingsSelect
                value={cardStyles.opacity}
                onChange={(val) => handleCardStyleChange("opacity", val)}
                minWidth="150px"
                options={opacityOptions}
              />
            </div>

            {/* Dropdown Roundedness */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Kelengkungan Dropdown" : "Dropdown Roundedness"}
              </label>
              <SettingsSelect
                value={cardStyles.dropdownRadius}
                onChange={(val) => handleCardStyleChange("dropdownRadius", val)}
                minWidth="150px"
                options={dropdownRadiusOptions}
              />
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
      </div>
    )}

        {activeSubTab === "buttons" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {language === "id" ? "Gaya & Tampilan Tombol" : "Button Styles & Appearance"}
              </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Button Corner Radius */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Sudut Kelengkungan" : "Corner Radius"}
              </label>
              <SettingsSelect
                value={buttonStyles.radius}
                onChange={(val) => handleButtonStyleChange("radius", val)}
                minWidth="150px"
                options={btnRadiusOptions}
              />
            </div>

            {/* Button Height Size */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Tinggi Tombol" : "Button Height"}
              </label>
              <SettingsSelect
                value={buttonStyles.size}
                onChange={(val) => handleButtonStyleChange("size", val)}
                minWidth="150px"
                options={btnSizeOptions}
              />
            </div>

            {/* Button Font Weight */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-semibold text-foreground">
                {language === "id" ? "Ketebalan Font" : "Font Weight"}
              </label>
              <SettingsSelect
                value={buttonStyles.weight}
                onChange={(val) => handleButtonStyleChange("weight", val)}
                minWidth="150px"
                options={btnWeightOptions}
              />
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
      </div>
    )}

        {activeSubTab === "notifications" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {language === "id" ? "Kustomisasi Tampilan Notifikasi (Toast)" : "Toast Notifications Customization"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Position selection */}
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-foreground block">
                    {language === "id" ? "Peletakan Notifikasi (Position)" : "Notification Placement"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "top-left", label: language === "id" ? "Kiri Atas" : "Top Left" },
                      { value: "top-center", label: language === "id" ? "Tengah Atas" : "Top Center" },
                      { value: "top-right", label: language === "id" ? "Kanan Atas" : "Top Right" },
                      { value: "bottom-left", label: language === "id" ? "Kiri Bawah" : "Bottom Left" },
                      { value: "bottom-center", label: language === "id" ? "Tengah Bawah" : "Bottom Center" },
                      { value: "bottom-right", label: language === "id" ? "Kanan Bawah" : "Bottom Right" },
                    ].map((pos) => {
                      const isSelected = notificationSettings.position === pos.value;
                      return (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() => handleNotificationChange("position", pos.value)}
                          className={cn(
                            "py-3 px-2 rounded-xl border text-center text-xs font-semibold transition-all duration-200",
                            isSelected
                              ? "bg-accent/10 border-accent text-accent ring-1 ring-accent"
                              : "border-border/60 bg-transparent hover:border-accent/30 hover:bg-white/[0.01] text-muted-foreground hover:text-foreground"
                          )}
                          style={{ borderRadius: 'var(--button-radius)' }}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Style/Theme and Duration */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">
                      {language === "id" ? "Gaya / Tema Notifikasi" : "Notification Style Theme"}
                    </label>
                    <SettingsSelect
                      value={notificationSettings.theme}
                      onChange={(val) => handleNotificationChange("theme", val)}
                      minWidth="200px"
                      options={[
                        { value: "dark", label: language === "id" ? "Gelap (Dark)" : "Dark" },
                        { value: "light", label: language === "id" ? "Terang (Light)" : "Light" },
                        { value: "system", label: language === "id" ? "Sistem (System)" : "System" },
                        { value: "custom", label: language === "id" ? "Kustom Tema Aktif (Themed)" : "Dynamic Custom Theme" },
                      ]}
                    />
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      {language === "id"
                        ? "Pilihan 'Kustom Tema Aktif' akan merubah warna notifikasi secara dinamis menyesuaikan tema warna website yang Anda pilih."
                        : "Choosing 'Dynamic Custom Theme' forces the toast notification container to automatically adapt to the active website theme colors."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Duration */}
                    <div className="space-y-2 flex flex-col">
                      <label className="text-xs font-semibold text-foreground">
                        {language === "id" ? "Durasi Tampil" : "Auto-close Duration"}
                      </label>
                      <SettingsSelect
                        value={notificationSettings.duration}
                        onChange={(val) => handleNotificationChange("duration", val)}
                        minWidth="150px"
                        options={[
                          { value: 2000, label: language === "id" ? "Cepat (2d)" : "Fast (2s)" },
                          { value: 4000, label: language === "id" ? "Normal (4d)" : "Normal (4s)" },
                          { value: 8000, label: language === "id" ? "Lambat (8d)" : "Slow (8s)" },
                        ]}
                      />
                    </div>

                    {/* Stack / Expand */}
                    <div className="space-y-2 flex flex-col">
                      <label className="text-xs font-semibold text-foreground">
                        {language === "id" ? "Tumpuk / Susun" : "Stack / Expand"}
                      </label>
                      <SettingsSelect
                        value={notificationSettings.expand}
                        onChange={(val) => handleNotificationChange("expand", val)}
                        minWidth="150px"
                        options={[
                          { value: false, label: language === "id" ? "Tumpuk (Stack)" : "Stack" },
                          { value: true, label: language === "id" ? "Ekspansi (Expand)" : "Expand" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trigger preview buttons */}
              <div
                className="mt-6 p-5 border text-left rounded-2xl flex flex-col justify-center gap-4 transition-all duration-300"
                style={{
                  borderRadius: "var(--card-radius)",
                  borderWidth: "var(--card-border-width)",
                  borderColor: "var(--border)",
                  backgroundColor: "color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)",
                }}
              >
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {language === "id" ? "Uji Coba Notifikasi Langsung" : "Live Notification Tester"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === "id"
                      ? "Klik tombol di bawah ini untuk melihat tampilan notifikasi sesuai dengan konfigurasi peletakan, tema, dan durasi yang Anda tentukan di atas."
                      : "Click the buttons below to trigger actual toasts and verify your placement, theme, and duration configurations."}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => triggerTestNotification("success")}
                    className="border-income/40 text-income hover:bg-income/10 hover:text-income text-xs h-9"
                    style={{ borderRadius: 'var(--button-radius)' }}
                  >
                    {language === "id" ? "Test Notifikasi Sukses" : "Test Success Toast"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => triggerTestNotification("error")}
                    className="border-expense/40 text-expense hover:bg-expense/10 hover:text-expense text-xs h-9"
                    style={{ borderRadius: 'var(--button-radius)' }}
                  >
                    {language === "id" ? "Test Notifikasi Gagal/Error" : "Test Error Toast"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => triggerTestNotification("info")}
                    className="border-border hover:bg-elevated hover:text-foreground text-xs h-9"
                    style={{ borderRadius: 'var(--button-radius)' }}
                  >
                    {language === "id" ? "Test Notifikasi Info" : "Test Info Toast"}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
