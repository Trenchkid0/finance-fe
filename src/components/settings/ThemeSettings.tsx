import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Palette, Plus, Settings, Type, CreditCard, Square, Bell, Check, LayoutGrid, CornerDownRight, Shield, Sparkles, MousePointer } from "lucide-react";
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
import {
  savePreferences,
  getCurrentPreferences,
  type NotificationSettings,
  type CursorSettings,
  type CursorType,
  type CursorColor,
  type CursorSize,
} from "@/lib/preferences";
import { Button } from "@/components/ui/button";
import { Card, BlueprintCorners } from "@/components/ui/card";

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
          "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-elevated px-3 text-xs text-foreground hover:bg-hover-surface transition-all outline-none text-left",
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
          className="p-1 border border-border bg-popover backdrop-blur-xl flex flex-col text-foreground shadow-2xl shadow-black/10 dark:shadow-black/45 z-[100000] max-h-[300px] overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 px-2.5 text-xs font-semibold outline-none transition-colors duration-200 text-left hover:bg-hover-surface text-foreground",
                opt.value === value ? "bg-elevated text-foreground font-semibold" : "text-muted-foreground"
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
  const [activeSubTab, setActiveSubTab] = useState<"colors" | "typography" | "cards" | "buttons" | "notifications" | "cursor">("colors");
  const [cursorSettings, setCursorSettings] = useState<CursorSettings>(
    () => getCurrentPreferences().cursorSettings || { type: "macos-pointer", color: "accent", size: "default" }
  );

  // Initialize from the centralized preferences service (which is loaded from backend on app init)
  const [activePresetId, setActivePresetId] = useState(() => getCurrentPreferences().themeId);

  const [customVars, setCustomVars] = useState<Partial<ThemeVariables>>(() => getCurrentPreferences().customThemeVars);

  const [typographyStyles, setTypographyStyles] = useState<TypographyStyles>(() => getCurrentPreferences().typographyStyles);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getCurrentPreferences().notificationSettings);

  const [activeFontId, setActiveFontId] = useState(() => getCurrentPreferences().fontId);

  const [cardStyles, setCardStyles] = useState<CardStyles>(() => getCurrentPreferences().cardStyles);

  const [buttonStyles, setButtonStyles] = useState<ButtonStyles>(() => getCurrentPreferences().buttonStyles);

  const handleCardStyleChange = (key: keyof CardStyles, value: string) => {
    const updated = { ...cardStyles, [key]: value };
    setCardStyles(updated);
    applyCardStyles(updated);
    // Persist immediately — triggers preferences-changed event for CardTypeProvider
    savePreferences({
      ...getCurrentPreferences(),
      themeId: activePresetId,
      customThemeVars: customVars,
      fontId: activeFontId,
      cardStyles: updated,
      buttonStyles,
      typographyStyles,
      notificationSettings,
    });
  };

  const handleButtonStyleChange = (key: keyof ButtonStyles, value: string) => {
    const updated = { ...buttonStyles, [key]: value };
    setButtonStyles(updated);
    applyButtonStyles(updated);
    // Persist immediately with the updated value — avoid stale closure
    savePreferences({
      ...getCurrentPreferences(),
      themeId: activePresetId,
      customThemeVars: customVars,
      fontId: activeFontId,
      cardStyles,
      buttonStyles: updated,
      typographyStyles,
      notificationSettings,
    });
  };

  const handleFontChange = (id: string) => {
    setActiveFontId(id);
    applyFont(id);
    // Need to use callback form since state isn't updated yet
    savePreferences({
      ...getCurrentPreferences(),
      fontId: id,
    });
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
    // Persist with updated typography
    const current = getCurrentPreferences();
    savePreferences({ ...current, typographyStyles: updated });
    toast.success(
      language === "id"
        ? "Ketebalan huruf berhasil diperbarui!"
        : "Typography weight updated successfully!"
    );
  };

  const handleNotificationChange = (key: string, value: string | number | boolean) => {
    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);
    // Persist via centralized service (writes to localStorage + backend)
    const current = getCurrentPreferences();
    savePreferences({ ...current, notificationSettings: updated });
    window.dispatchEvent(new Event("notification-settings-changed"));
  };

  const handleCursorChange = <K extends keyof CursorSettings>(key: K, value: CursorSettings[K]) => {
    const updated: CursorSettings = { ...cursorSettings, [key]: value };
    setCursorSettings(updated);
    const current = getCurrentPreferences();
    savePreferences({ ...current, cursorSettings: updated });
    window.dispatchEvent(new Event("cursor-settings-changed"));
    toast.success(
      language === "id" ? "Pengaturan kursor berhasil diperbarui!" : "Cursor settings updated successfully!"
    );
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
    // Persist theme change to backend
    const current = getCurrentPreferences();
    savePreferences({ ...current, themeId: id, customThemeVars: {} });
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
    // Persist custom theme var change to backend
    const current = getCurrentPreferences();
    savePreferences({ ...current, customThemeVars: updated });
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

  const subTabs: { id: "colors" | "typography" | "cards" | "buttons" | "notifications" | "cursor"; label: string; icon: React.ReactNode }[] = [
    { id: "colors", label: language === "id" ? "Tema & Warna" : "Theme & Colors", icon: <Palette size={14} /> },
    { id: "typography", label: language === "id" ? "Tipografi" : "Typography", icon: <Type size={14} /> },
    { id: "cards", label: language === "id" ? "Gaya Kartu" : "Card Styles", icon: <CreditCard size={14} /> },
    { id: "buttons", label: language === "id" ? "Gaya Tombol" : "Button Styles", icon: <Square size={14} /> },
    { id: "notifications", label: language === "id" ? "Notifikasi" : "Notifications", icon: <Bell size={14} /> },
    { id: "cursor", label: language === "id" ? "Gaya Kursor" : "Cursor Style", icon: <MousePointer size={14} /> },
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
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-elevated/50"
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
                        <div className="w-5 h-5 rounded-md border border-border shrink-0" style={{ backgroundColor: preset.variables.background }} title="Background" />
                        <div className="w-5 h-5 rounded-md border border-border shrink-0" style={{ backgroundColor: preset.variables.surface }} title="Card/Surface" />
                        <div className="w-5 h-5 rounded-md border border-border shrink-0" style={{ backgroundColor: preset.variables.elevated }} title="Popover/Elevated" />
                        <div className="w-5 h-5 rounded-md border border-border shrink-0" style={{ backgroundColor: preset.variables.border }} title="Border" />
                        <div className="w-5 h-5 rounded-md border border-border shrink-0" style={{ backgroundColor: preset.variables.accent }} title="Accent" />
                        <div className="w-5 h-5 rounded-md border border-border shrink-0 ml-auto" style={{ backgroundColor: preset.variables.income }} title="Income" />
                        <div className="w-5 h-5 rounded-md border border-border shrink-0" style={{ backgroundColor: preset.variables.expense }} title="Expense" />
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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
                          className="text-[9px] px-1.5 py-0.5 bg-elevated border border-border hover:bg-hover-elevated hover:border-hover-border hover:text-foreground rounded transition-all"
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

              {/* ── Card Type Picker ── */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground">
                  {language === "id" ? "Jenis Kartu" : "Card Type"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Default */}
                  <button
                    type="button"
                    onClick={() => handleCardStyleChange("cardType", "default")}
                    className={cn(
                      "relative text-left p-4 rounded-xl border transition-all duration-200",
                      cardStyles.cardType === "default"
                        ? "border-accent ring-1 ring-accent/30 bg-accent/5"
                        : "border-border bg-elevated/30 hover:border-hover-border hover:bg-elevated/50",
                    )}
                  >
                    {cardStyles.cardType === "default" && (
                      <span className="absolute top-3 right-3 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                        <Check size={12} />
                      </span>
                    )}
                    {/* Mini preview */}
                    <div
                      className="mb-3 h-20 w-full border border-border bg-background p-3 flex flex-col justify-between"
                      style={{
                        borderRadius: cardStyles.radius || "16px",
                        borderWidth: cardStyles.borderWidth || "1px",
                        backgroundColor: "var(--background)",
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="h-1.5 w-12 rounded bg-muted-foreground/30" />
                          <div className="mt-1.5 h-3 w-20 rounded bg-foreground/40" />
                        </div>
                        <div className="h-4 w-10 rounded bg-income/20 border border-income/20" />
                      </div>
                      <div className="h-1.5 w-3/4 rounded-full bg-border/30">
                        <div className="h-full w-2/3 rounded-full bg-accent/50" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <LayoutGrid size={14} className="text-accent" />
                      <span className="text-sm font-semibold text-foreground">
                        {language === "id" ? "Default" : "Default"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === "id"
                        ? "Sudut melengkung, efek kaca buram, dan transparansi. Cocok untuk dashboard modern."
                        : "Rounded corners, glassmorphism blur, and transparency. Great for modern dashboards."}
                    </p>
                  </button>

                  {/* Blueprint */}
                  <button
                    type="button"
                    onClick={() => handleCardStyleChange("cardType", "blueprint")}
                    className={cn(
                      "relative text-left p-4 rounded-xl border transition-all duration-200",
                      cardStyles.cardType === "blueprint"
                        ? "border-accent ring-1 ring-accent/30 bg-accent/5"
                        : "border-border bg-elevated/30 hover:border-hover-border hover:bg-elevated/50",
                    )}
                  >
                    {cardStyles.cardType === "blueprint" && (
                      <span className="absolute top-3 right-3 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                        <Check size={12} />
                      </span>
                    )}
                    {/* Mini preview — blueprint style */}
                    <div className="relative mb-3 h-20 w-full border border-border bg-background p-3 flex flex-col justify-between overflow-hidden">
                      {/* Corner marks */}
                      <BlueprintCorners size={8} />
                      {/* Left accent bar */}
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-accent/40" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <div className="h-1.5 w-12 rounded bg-muted-foreground/30" />
                          <div className="mt-1.5 h-3 w-20 rounded bg-foreground/40" />
                        </div>
                        <div className="h-4 w-10 border border-border flex items-center justify-center">
                          <span className="text-[7px] font-mono text-muted-foreground">LIVE</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-3/4 rounded bg-muted-foreground/10 relative z-10">
                        <div className="h-full w-2/3 rounded bg-accent/50" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <CornerDownRight size={14} className="text-accent" />
                      <span className="text-sm font-semibold text-foreground">
                        {language === "id" ? "Blueprint" : "Blueprint"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === "id"
                        ? "Sudut tajam, tanda sudut dekoratif, dan efek cahaya aksen. Gaya teknis & presisi."
                        : "Sharp corners, decorative corner marks, and accent hover glow. Technical & precise feel."}
                    </p>
                  </button>

                  {/* Manly */}
                  <button
                    type="button"
                    onClick={() => handleCardStyleChange("cardType", "manly")}
                    className={cn(
                      "relative text-left p-4 rounded-xl border transition-all duration-200",
                      cardStyles.cardType === "manly"
                        ? "border-amber-500/80 ring-1 ring-amber-500/30 bg-amber-500/5"
                        : "border-border bg-elevated/30 hover:border-hover-border hover:bg-elevated/50",
                    )}
                  >
                    {cardStyles.cardType === "manly" && (
                      <span className="absolute top-3 right-3 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black shadow-sm font-bold">
                        <Check size={12} />
                      </span>
                    )}
                    {/* Mini preview — manly style */}
                    <div className="relative mb-3 h-20 w-full rounded-md border border-zinc-700/80 bg-background p-3 flex flex-col justify-between overflow-hidden shadow-inner">
                      {/* Corner micro-rivets */}
                      <div className="absolute left-1 top-1 h-1 w-1 rounded-full bg-zinc-400/60 ring-1 ring-zinc-700" />
                      <div className="absolute right-1 top-1 h-1 w-1 rounded-full bg-zinc-400/60 ring-1 ring-zinc-700" />
                      <div className="absolute bottom-1 left-1 h-1 w-1 rounded-full bg-zinc-400/60 ring-1 ring-zinc-700" />
                      <div className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-zinc-400/60 ring-1 ring-zinc-700" />
                      {/* Top titanium/amber stripe */}
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-zinc-600/50 via-amber-500/70 to-zinc-600/50" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <div className="h-1.5 w-12 rounded bg-zinc-500/40" />
                          <div className="mt-1.5 h-3 w-20 rounded bg-zinc-200/50" />
                        </div>
                        <div className="h-4 px-1.5 rounded-sm border border-zinc-700 bg-elevated/80 flex items-center justify-center">
                          <span className="text-[7px] font-mono font-bold tracking-wider text-amber-400">TACTICAL</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-3/4 rounded-sm bg-border/40 relative z-10 overflow-hidden">
                        <div className="h-full w-2/3 bg-gradient-to-r from-amber-600 to-amber-400 rounded-sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className="text-amber-500" />
                      <span className="text-sm font-semibold text-foreground">
                        {language === "id" ? "Manly" : "Manly"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === "id"
                        ? "Sudut kokoh 6px, baut taktis sudut, dan strip titanium. Nuansa maskulin & tangguh."
                        : "Solid 6px corners, corner tactical rivets, and titanium stripe. Rugged & masculine feel."}
                    </p>
                  </button>

                  {/* Girly */}
                  <button
                    type="button"
                    onClick={() => handleCardStyleChange("cardType", "girly")}
                    className={cn(
                      "relative text-left p-4 rounded-xl border transition-all duration-200",
                      cardStyles.cardType === "girly"
                        ? "border-pink-400 ring-1 ring-pink-400/30 bg-pink-500/5"
                        : "border-border bg-elevated/30 hover:border-hover-border hover:bg-elevated/50",
                    )}
                  >
                    {cardStyles.cardType === "girly" && (
                      <span className="absolute top-3 right-3 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white shadow-sm">
                        <Check size={12} />
                      </span>
                    )}
                    {/* Mini preview — girly style */}
                    <div className="relative mb-3 h-20 w-full rounded-[18px] border border-pink-300/50 bg-background p-3 flex flex-col justify-between overflow-hidden">
                      {/* Pastel blurs */}
                      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full bg-pink-400/20 blur-md" />
                      <div className="pointer-events-none absolute -left-3 -bottom-3 h-14 w-14 rounded-full bg-purple-400/15 blur-md" />
                      {/* Sparkle star */}
                      <div className="pointer-events-none absolute right-2.5 top-2 z-10 text-pink-400">
                        <Sparkles size={11} />
                      </div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <div className="h-1.5 w-12 rounded-full bg-pink-300/40" />
                          <div className="mt-1.5 h-3 w-20 rounded-full bg-pink-200/50 dark:bg-pink-100/40" />
                        </div>
                        <div className="h-4 px-2 rounded-full border border-pink-400/30 bg-pink-500/10 flex items-center justify-center">
                          <span className="text-[7px] font-bold tracking-wider text-pink-400">LOVELY</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-3/4 rounded-full bg-pink-200/20 relative z-10 overflow-hidden">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-pink-400 to-rose-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={14} className="text-pink-400" />
                      <span className="text-sm font-semibold text-foreground">
                        {language === "id" ? "Girly" : "Girly"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === "id"
                        ? "Sudut melengkung halus 22px, pendar pastel dreamy, dan kilau bintang. Manis & estetik."
                        : "Soft 22px curves, dreamy pastel glow, and delicate star sparkles. Sweet & aesthetic."}
                    </p>
                  </button>
                </div>
              </div>
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
                className={cn(
                  "mt-6 p-5 border transition-all duration-300 bg-background",
                  cardStyles.cardType === "blueprint"
                    ? "border-border overflow-hidden relative"
                    : cardStyles.cardType === "manly"
                      ? "border-zinc-700/60 overflow-hidden relative rounded-lg"
                      : cardStyles.cardType === "girly"
                        ? "border-pink-300/40 overflow-hidden relative rounded-[24px]"
                        : "rounded-2xl border-border/30",
                )}
                style={cardStyles.cardType === "default" ? {
                  borderRadius: 'var(--card-radius)',
                  borderWidth: 'var(--card-border-width)',
                  backgroundColor: 'var(--background)',
                } : undefined}
              >
                {cardStyles.cardType === "blueprint" && (
                  <BlueprintCorners size={14} />
                )}
                {cardStyles.cardType === "manly" && (
                  <>
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-zinc-600/40 via-amber-500/50 to-zinc-600/40" />
                    <div className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                    <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                    <div className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                    <div className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                  </>
                )}
                {cardStyles.cardType === "girly" && (
                  <>
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-400/15 blur-xl" />
                    <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-purple-400/10 blur-xl" />
                  </>
                )}
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  {language === "id" ? "Pratinjau Kartu Terkustomisasi" : "Customized Card Preview"}
                </p>

                <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">
                  {/* The actual Card Preview */}
                  <div
                    className={cn(
                      "w-full lg:w-[360px] p-6 border text-card-foreground flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden",
                      cardStyles.cardType === "blueprint" && "group hover:border-accent/40 rounded-none",
                      cardStyles.cardType === "manly" && "group hover:border-zinc-500 hover:shadow-lg hover:shadow-black/25 rounded-md",
                      cardStyles.cardType === "girly" && "group hover:border-pink-400/70 hover:shadow-[0_8px_30px_rgba(244,114,182,0.18)] rounded-[22px]",
                    )}
                    style={
                      cardStyles.cardType === "blueprint"
                        ? { borderColor: "var(--border)", backgroundColor: "var(--background)" }
                        : cardStyles.cardType === "manly"
                          ? {
                            borderRadius: "6px",
                            borderWidth: "1px",
                            borderColor: "rgba(113, 113, 122, 0.6)",
                            backgroundColor: "var(--background)",
                          }
                          : cardStyles.cardType === "girly"
                            ? {
                              borderRadius: "22px",
                              borderWidth: "1.5px",
                              borderColor: "rgba(244, 114, 182, 0.4)",
                              backgroundColor: "var(--background)",
                            }
                            : {
                              borderRadius: cardStyles.radius,
                              borderWidth: cardStyles.borderWidth,
                              borderColor: "var(--border)",
                              backgroundColor: "var(--background)",
                            }
                    }
                  >
                    {cardStyles.cardType === "blueprint" && (
                      <>
                        <BlueprintCorners size={10} />
                        <div className="absolute left-0 top-0 h-full w-0.5 bg-accent/40" />
                      </>
                    )}
                    {cardStyles.cardType === "manly" && (
                      <>
                        <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                        <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                        <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                        <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 h-1.5 w-1.5 rounded-full bg-zinc-500/40 ring-1 ring-zinc-700/50" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-zinc-600/40 via-amber-500/50 to-zinc-600/40 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="pointer-events-none absolute right-0 top-0 h-8 w-8 bg-gradient-to-bl from-zinc-600/10 to-transparent" />
                      </>
                    )}
                    {cardStyles.cardType === "girly" && (
                      <>
                        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-pink-400/15 via-rose-300/10 to-transparent blur-xl" />
                        <div className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-gradient-to-tr from-purple-400/10 via-pink-300/10 to-transparent blur-xl" />
                        <div className="pointer-events-none absolute right-3.5 top-3 z-10 text-pink-400/70 group-hover:scale-110 group-hover:text-pink-400 transition-all duration-300">
                          <Sparkles size={13} />
                        </div>
                      </>
                    )}
                    <div className="space-y-4 relative z-10">
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
                        {cardStyles.cardType === "blueprint" ? (
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 border border-border text-muted-foreground">
                            LIVE
                          </span>
                        ) : cardStyles.cardType === "manly" ? (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-sm border border-zinc-600/70 bg-zinc-800/80 text-amber-400 tracking-wider">
                            TACTICAL
                          </span>
                        ) : cardStyles.cardType === "girly" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-400/30 flex items-center gap-1">
                            ✨ LOVELY
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-income/10 text-income border border-income/20">
                            +12.4%
                          </span>
                        )}
                      </div>

                      {/* Card Inner Content - mini progress indicator */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{language === "id" ? "Target Investasi" : "Investment Target"}</span>
                          <span>75%</span>
                        </div>
                        <div className={cn(
                          "h-1.5 w-full overflow-hidden",
                          cardStyles.cardType === "blueprint"
                            ? "bg-muted-foreground/10"
                            : cardStyles.cardType === "manly"
                              ? "bg-zinc-800 rounded-sm"
                              : cardStyles.cardType === "girly"
                                ? "bg-pink-100/20 dark:bg-pink-900/20 rounded-full"
                                : "bg-border/20 rounded-full",
                        )}>
                          <div className={cn(
                            "h-full transition-all duration-500",
                            cardStyles.cardType === "blueprint"
                              ? "bg-accent"
                              : cardStyles.cardType === "manly"
                                ? "bg-gradient-to-r from-amber-600 to-amber-400 rounded-sm"
                                : cardStyles.cardType === "girly"
                                  ? "bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"
                                  : "bg-accent rounded-full",
                          )} style={{ width: "75%" }} />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className={cn(
                      "flex justify-end gap-2 pt-3 border-t relative z-10",
                      cardStyles.cardType === "blueprint"
                        ? "border-border/30"
                        : cardStyles.cardType === "manly"
                          ? "border-zinc-700/40"
                          : cardStyles.cardType === "girly"
                            ? "border-pink-300/20"
                            : "border-border/20",
                    )}>
                      <button type="button" className={cn(
                        "px-2.5 py-1.5 border text-[10px] font-semibold transition-all",
                        cardStyles.cardType === "blueprint"
                          ? "border-border text-muted-foreground hover:bg-muted/30"
                          : cardStyles.cardType === "manly"
                            ? "rounded-sm border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            : cardStyles.cardType === "girly"
                              ? "rounded-full border-pink-300/40 text-pink-400 hover:bg-pink-500/10"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
                      )} style={cardStyles.cardType === "default" ? { borderRadius: 'var(--button-radius)' } : undefined}>
                        {language === "id" ? "Batal" : "Cancel"}
                      </button>
                      <button type="button" className={cn(
                        "px-2.5 py-1.5 text-[10px] font-semibold transition-all",
                        cardStyles.cardType === "blueprint"
                          ? "bg-accent text-white hover:bg-accent/80"
                          : cardStyles.cardType === "manly"
                            ? "rounded-sm bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-amber-300 border border-zinc-600"
                            : cardStyles.cardType === "girly"
                              ? "rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30 hover:brightness-105"
                              : "bg-accent text-white hover:bg-accent/80",
                      )} style={cardStyles.cardType === "default" ? { borderRadius: 'var(--button-radius)' } : undefined}>
                        {language === "id" ? "Terapkan" : "Apply"}
                      </button>
                    </div>
                  </div>

                  {/* Explanatory notes */}
                  <div
                    className={cn(
                      "flex-1 p-5 border flex flex-col justify-center text-left text-xs text-muted-foreground space-y-2.5 relative overflow-hidden",
                      cardStyles.cardType === "blueprint" && "group",
                      cardStyles.cardType === "manly" && "group rounded-md border-zinc-700/60 bg-zinc-900/40",
                      cardStyles.cardType === "girly" && "group rounded-[20px] border-pink-300/30 bg-pink-500/[0.02]",
                    )}
                    style={
                      cardStyles.cardType === "blueprint"
                        ? { borderColor: 'var(--border)', backgroundColor: 'var(--background)' }
                        : cardStyles.cardType === "manly" || cardStyles.cardType === "girly"
                          ? undefined
                          : {
                            borderRadius: 'var(--card-radius)',
                            borderWidth: 'var(--card-border-width)',
                            borderColor: 'var(--border)',
                            backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
                          }
                    }
                  >
                    {cardStyles.cardType === "blueprint" && (
                      <BlueprintCorners size={10} />
                    )}
                    <p className="font-semibold text-foreground text-sm relative z-10">
                      {language === "id" ? "Detail Penerapan Gaya Kartu:" : "Card Styling Properties Applied:"}
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 relative z-10">
                      <li>
                        <strong>{language === "id" ? "Jenis Kartu" : "Card Type"}:</strong> {
                          cardStyles.cardType === "blueprint"
                            ? (language === "id" ? "Blueprint — sudut tajam, tanda dekoratif, efek cahaya aksen" : "Blueprint — sharp corners, decorative marks, accent hover glow")
                            : cardStyles.cardType === "manly"
                              ? (language === "id" ? "Manly — sudut kokoh 6px, baut sudut taktis, strip titanium maskulin" : "Manly — 6px solid corners, tactical corner rivets, titanium accent stripe")
                              : cardStyles.cardType === "girly"
                                ? (language === "id" ? "Girly — sudut lembut 22px, pendar pastel dreamy, kilauan bintang manis" : "Girly — soft 22px pillowy curves, dreamy pastel glow, star sparkles")
                                : (language === "id" ? "Default — sudut melengkung, efek kaca buram" : "Default — rounded corners, glassmorphism")
                        }.
                      </li>
                      {cardStyles.cardType === "default" && (
                        <>
                          <li>
                            <strong>{language === "id" ? "Sudut Kelengkungan" : "Corner Radius"}:</strong> {language === "id" ? `Tepi luar kotak kartu melengkung sebesar ${cardStyles.radius}` : `Card corner radius set to ${cardStyles.radius}`}.
                          </li>
                          <li>
                            <strong>{language === "id" ? "Kekaburan Latar" : "Backdrop Blur"}:</strong> {language === "id" ? `Efek kaca buram (blur) di latar belakang diatur ke ${cardStyles.blur}` : `Glass backdrop frosted blur is ${cardStyles.blur}`}.
                          </li>
                          <li>
                            <strong>{language === "id" ? "Tingkat Transparansi" : "Card Transparency"}:</strong> {language === "id" ? `Kepadatan latar kartu diatur ke ${Math.round(parseFloat(cardStyles.opacity) * 100)}%` : `Card surface color opacity is ${Math.round(parseFloat(cardStyles.opacity) * 100)}%`}.
                          </li>
                        </>
                      )}
                      {cardStyles.cardType === "manly" && (
                        <>
                          <li>
                            <strong>{language === "id" ? "Geometri & Tepi" : "Geometry & Edge"}:</strong> {language === "id" ? "Presisi sudut 6px dengan baut pengunci taktis di setiap sudut" : "6px precision corners with tactical locking rivets at each corner"}.
                          </li>
                          <li>
                            <strong>{language === "id" ? "Aksen Material" : "Material Accent"}:</strong> {language === "id" ? "Garis strip titanium/amber di tepi atas kartu dengan latar gunmetal pekat" : "Titanium/amber accent stripe at the top edge with solid gunmetal depth"}.
                          </li>
                        </>
                      )}
                      {cardStyles.cardType === "girly" && (
                        <>
                          <li>
                            <strong>{language === "id" ? "Geometri & Tepi" : "Geometry & Edge"}:</strong> {language === "id" ? "Sudut ultra-lembut 22px dengan garis tepi bernuansa rose gold halus" : "Ultra-soft 22px curves with delicate rose gold outline"}.
                          </li>
                          <li>
                            <strong>{language === "id" ? "Efek Suasana" : "Atmospheric Glow"}:</strong> {language === "id" ? "Pendaran warna pastel lembut di sudut dan ikon kilau bintang (sparkle) interaktif" : "Soft pastel aura in the corners and interactive starlet sparkles"}.
                          </li>
                        </>
                      )}
                      <li>
                        <strong>{language === "id" ? "Ketebalan Garis" : "Border Thickness"}:</strong> {
                          cardStyles.cardType === "manly"
                            ? "1px"
                            : cardStyles.cardType === "girly"
                              ? "1.5px"
                              : cardStyles.cardType === "blueprint"
                                ? "1px"
                                : cardStyles.borderWidth
                        }.
                      </li>
                      <li>
                        <strong>{language === "id" ? "Kelengkungan Dropdown" : "Dropdown Roundedness"}:</strong> {
                          cardStyles.cardType === "manly"
                            ? "6px"
                            : cardStyles.cardType === "girly"
                              ? "22px"
                              : cardStyles.cardType === "blueprint"
                                ? "0px"
                                : (language === "id" ? `Sudut kelengkungan tombol pilihan (dropdown) diatur ke ${cardStyles.dropdownRadius || "9999px"}` : `Dropdown triggers corner radius set to ${cardStyles.dropdownRadius || "9999px"}`)
                        }.
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

        {activeSubTab === "cursor" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {language === "id" ? "Kustomisasi Model Kursor Layar" : "Custom Screen Pointer Customization"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "id"
                    ? "Pilih gaya kursor ultra-presisi dengan zero-latency hardware tracking. Bebas dari bayangan blur yang mengganggu. Kursor input teks tetap menggunakan kursor alami sistem."
                    : "Select ultra-precise cursor styles with zero-latency hardware tracking. Clean and free from blurry trailing blobs. Text inputs seamlessly preserve natural OS I-beam."}
                </p>
              </div>

              {/* Cursor Model Selection Cards */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground block">
                  {language === "id" ? "Pilih Model Kursor (Presets)" : "Select Pointer Model (Presets)"}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: "macos-pointer",
                      name: language === "id" ? "macOS Obsidian Arrow" : "macOS Obsidian Arrow",
                      badge: language === "id" ? "Paling Populer" : "Most Popular",
                      desc: language === "id"
                        ? "Panah hitam presisi khas macOS dengan garis tepi putih kontras dan inner accent bersih."
                        : "Iconic macOS black pointer with crisp white contrast hairline and clean inner accent.",
                      preview: (
                        <div className="w-10 h-10 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <svg width="20" height="22" viewBox="0 0 22 24" fill="none">
                            <path
                              d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
                              fill="#000000"
                              stroke="var(--accent, #388BFD)"
                              strokeWidth="1.3"
                              strokeLinejoin="round"
                            />
                            <path d="M1.5 2.5 L1.5 13.5 L4.2 11.2" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
                          </svg>
                        </div>
                      ),
                    },
                    {
                      id: "vision-glass",
                      name: language === "id" ? "VisionOS Frosted Glass" : "VisionOS Frosted Glass",
                      badge: language === "id" ? "Translucent" : "Translucent",
                      desc: language === "id"
                        ? "Panah kaca akrilik tembus pandang dengan aksen bevel cahaya kristal halus."
                        : "Frosted translucent acrylic glass pointer with crystalline highlight streak.",
                      preview: (
                        <div className="w-10 h-10 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <svg width="20" height="22" viewBox="0 0 22 24" fill="none">
                            <path
                              d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
                              fill="rgba(255,255,255,0.15)"
                              stroke="var(--accent, #388BFD)"
                              strokeWidth="1.3"
                              strokeLinejoin="round"
                            />
                            <path d="M1.8 3 L1.8 13.5 L4.5 11" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
                          </svg>
                        </div>
                      ),
                    },
                    {
                      id: "raycast-tech",
                      name: language === "id" ? "Raycast Precision Tech" : "Raycast Precision Tech",
                      badge: language === "id" ? "Developer Choice" : "Developer Choice",
                      desc: language === "id"
                        ? "Panah geometris modern ala developer workstation dengan bilah tech presisi."
                        : "Modern geometric tech dart with clean layered core blade.",
                      preview: (
                        <div className="w-10 h-10 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <svg width="20" height="22" viewBox="0 0 22 24" fill="none">
                            <path
                              d="M0 0 L0 17 L4.5 13 L8 20.5 L10.5 19.5 L7 12 L12.5 12 Z"
                              fill="#0B0E14"
                              stroke="var(--accent, #388BFD)"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M1.8 2.8 L1.8 13.5 L4.2 11.5 L6.8 17 L7.8 16.5 L5.5 11 L10 11 Z"
                              fill="var(--accent, #388BFD)"
                              opacity="0.35"
                            />
                          </svg>
                        </div>
                      ),
                    },
                    {
                      id: "ambient-spotlight",
                      name: language === "id" ? "Ambient Spotlight Glow" : "Ambient Spotlight Glow",
                      badge: language === "id" ? "Atmospheric" : "Atmospheric",
                      desc: language === "id"
                        ? "Panah presisi yang memancarkan sorotan cahaya radial lembut 180px ke elemen di sekitarnya."
                        : "Precision arrow casting a soft 180px ambient radial flashlight to reveal dark UI boundaries.",
                      preview: (
                        <div className="w-10 h-10 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)] opacity-35" />
                          <svg width="20" height="22" viewBox="0 0 22 24" fill="none" className="relative z-10">
                            <path
                              d="M0 0 L0 16.8 L4.5 12.8 L8.2 21 L10.8 19.8 L7.2 11.8 L12.8 11.8 Z"
                              fill="#000000"
                              stroke="rgba(255,255,255,0.9)"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                            <path d="M1.5 2.5 L1.5 13.5 L4.2 11.2" stroke="var(--accent, #388BFD)" strokeWidth="1" />
                          </svg>
                        </div>
                      ),
                    },
                    {
                      id: "default",
                      name: language === "id" ? "Kursor Bawaan OS" : "Native OS Cursor",
                      badge: language === "id" ? "Standar" : "Standard",
                      desc: language === "id"
                        ? "Menggunakan kursor bawaan Windows atau macOS tanpa efek manipulasi grafis kustom."
                        : "Use standard operating system pointer without custom graphic overlays.",
                      preview: (
                        <div className="w-10 h-10 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                          </svg>
                        </div>
                      ),
                    },
                  ].map((preset) => {
                    const isSelected = cursorSettings.type === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleCursorChange("type", preset.id as CursorType)}
                        className={cn(
                          "relative p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group",
                          isSelected
                            ? "bg-accent/10 border-accent shadow-md shadow-accent/5 ring-1 ring-accent"
                            : "bg-elevated/40 border-border/60 hover:bg-elevated hover:border-border"
                        )}
                        style={{ borderRadius: "var(--card-radius)" }}
                      >
                        <div className="flex items-start justify-between gap-3 w-full mb-3">
                          {preset.preview}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                isSelected
                                  ? "bg-accent text-white border-accent"
                                  : "bg-surface text-muted-foreground border-border/40"
                              )}
                            >
                              {preset.badge}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-xs text-foreground group-hover:text-accent transition-colors flex items-center gap-1.5">
                            {preset.name}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            {preset.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color & Size Customization */}
              {cursorSettings.type !== "default" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/40">
                  {/* Color Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground block">
                        {language === "id" ? "Warna Aksen Pointer" : "Pointer Accent Color"}
                      </label>
                      <span className="text-[10px] text-accent font-medium px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                        {language === "id" ? `Tema: ${THEME_PRESETS.find((p) => p.id === activePresetId)?.name || "Aktif"}` : `Theme: ${THEME_PRESETS.find((p) => p.id === activePresetId)?.nameEn || "Active"}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        {
                          id: "accent" as CursorColor,
                          label: language === "id" ? "Warna Tema" : "Theme Main",
                          color: customVars.accent || THEME_PRESETS.find((p) => p.id === activePresetId)?.variables.accent || "#388BFD",
                          isTheme: true,
                        },
                        {
                          id: "progress" as CursorColor,
                          label: language === "id" ? "Sekunder" : "Secondary",
                          color: customVars.progress || THEME_PRESETS.find((p) => p.id === activePresetId)?.variables.progress || "#A855F7",
                        },
                        {
                          id: "income" as CursorColor,
                          label: language === "id" ? "Income" : "Income",
                          color: customVars.income || THEME_PRESETS.find((p) => p.id === activePresetId)?.variables.income || "#10B981",
                        },
                        {
                          id: "white" as CursorColor,
                          label: language === "id" ? "Putih" : "White",
                          color: "#FFFFFF",
                        },
                        {
                          id: "cyan" as CursorColor,
                          label: "Cyan",
                          color: "#00F2FE",
                        },
                        {
                          id: "purple" as CursorColor,
                          label: "Purple",
                          color: "#A855F7",
                        },
                        {
                          id: "amber" as CursorColor,
                          label: "Amber",
                          color: customVars.warning || THEME_PRESETS.find((p) => p.id === activePresetId)?.variables.warning || "#F59E0B",
                        },
                      ].map((item) => {
                        const isSelected = cursorSettings.color === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleCursorChange("color", item.id)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all duration-150 relative",
                              isSelected
                                ? "bg-accent/15 border-accent text-foreground font-semibold ring-1 ring-accent"
                                : "bg-elevated/40 border-border/50 text-muted-foreground hover:bg-elevated hover:text-foreground"
                            )}
                            style={{ borderRadius: "var(--button-radius)" }}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/25 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[10px] truncate w-full text-center leading-tight">{item.label}</span>
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-background" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                      {language === "id"
                        ? `Pilihan 'Warna Tema' akan selalu sinkron otomatis dengan warna utama dari tema aktif (${THEME_PRESETS.find((p) => p.id === activePresetId)?.name}). Saat Anda mengganti tema, warna kursor akan langsung beradaptasi.`
                        : `The 'Theme Main' option dynamically binds the pointer accent to the active theme's primary color (${THEME_PRESETS.find((p) => p.id === activePresetId)?.nameEn}). Changing themes will immediately update your cursor.`}
                    </p>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-foreground block">
                      {language === "id" ? "Skala Ukuran Pointer" : "Pointer Scale Size"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "small", label: language === "id" ? "Kompak (0.85x)" : "Compact (0.85x)" },
                        { id: "default", label: language === "id" ? "Standar (1.0x)" : "Default (1.0x)" },
                        { id: "large", label: language === "id" ? "Besar (1.25x)" : "Large (1.25x)" },
                      ].map((item) => {
                        const isSelected = cursorSettings.size === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleCursorChange("size", item.id as CursorSize)}
                            className={cn(
                              "py-2.5 px-3 rounded-lg border text-xs font-medium transition-all duration-150 text-center",
                              isSelected
                                ? "bg-accent/15 border-accent text-foreground font-semibold ring-1 ring-accent"
                                : "bg-elevated/40 border-border/50 text-muted-foreground hover:bg-elevated hover:text-foreground"
                            )}
                            style={{ borderRadius: "var(--button-radius)" }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Live Playground */}
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
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-accent" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {language === "id" ? "Area Uji Coba Kursor Langsung" : "Live Cursor Interactive Playground"}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {language === "id"
                      ? "Gerakkan kursor ke komponen di bawah ini untuk melihat respons micro-spark, efek hover interaktif, pengetikan teks alami, serta badge dragging status."
                      : "Hover over the components below to preview the micro-spark reaction, interactive hover tilting, native text I-beam, and dragging status badge."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Test 1: Button hover spark */}
                  <Button
                    type="button"
                    variant="outline"
                    className="border-accent/40 text-accent hover:bg-accent hover:text-white text-xs h-10 transition-all font-semibold flex items-center justify-center gap-1.5"
                    style={{ borderRadius: "var(--button-radius)" }}
                    onClick={() => {
                      toast.success(language === "id" ? "Klik terdeteksi!" : "Click registered!");
                    }}
                  >
                    <MousePointer size={13} />
                    {language === "id" ? "Arahkan & Klik Saya" : "Hover & Click Me"}
                  </Button>

                  {/* Test 2: Draggable Card to test badge */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", "card");
                    }}
                    className="flex items-center justify-center p-2.5 rounded-lg border border-dashed border-border bg-elevated/60 text-xs font-semibold text-muted-foreground cursor-grab active:cursor-grabbing hover:text-foreground hover:border-accent/60 transition-all select-none"
                    style={{ borderRadius: "var(--card-radius)" }}
                  >
                    <span>{language === "id" ? "✋ Coba Drag Kartu Ini" : "✋ Try Dragging This"}</span>
                  </div>

                  {/* Test 3: Natural OS Text I-Beam */}
                  <input
                    type="text"
                    placeholder={language === "id" ? "Ketik sesuatu di sini..." : "Type text here to test..."}
                    className="h-10 px-3 rounded-lg border border-border bg-elevated text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    style={{ borderRadius: "var(--button-radius)" }}
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
