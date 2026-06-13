import { useState } from "react";
import { Key, Palette, Shapes, User } from "lucide-react";
import { ApiKeysCard } from "./ApiKeysCard";
import { CategoriesSettings, type CategoryItem } from "./CategoriesSettings";
import { ThemeSettings } from "./ThemeSettings";
import type { ApiKeyListItem } from "@/app/actions/api-keys";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
  } | null;
  categories: CategoryItem[];
  apiKeys: ApiKeyListItem[];
}

type Tab = "categories" | "api" | "theme";

export function SettingsClient({ user, categories, apiKeys }: Props) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "categories", label: language === "id" ? "Kategori" : "Categories", icon: <Shapes size={14} /> },
    { id: "api", label: language === "id" ? "API & Integrasi" : "API & Integrations", icon: <Key size={14} /> },
    { id: "theme", label: language === "id" ? "Kustomisasi Warna" : "Color Customization", icon: <Palette size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-1">
          {language === "id" ? "Pengaturan" : "Settings"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === "id"
            ? "Kelola profil pengguna dan kategori kustom keuangan Anda."
            : "Manage your user profile and custom financial categories."}
        </p>
      </div>

      {/* Profile Section */}
      <div
        className="p-6 border rounded-xl space-y-3"
        style={{
          borderRadius: 'var(--card-radius)',
          borderWidth: 'var(--card-border-width)',
          borderColor: 'var(--border)',
          backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
        }}
      >
        <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
          <User size={14} className="text-muted-foreground" />
          {language === "id" ? "Profil pengguna" : "User profile"}
        </h2>
        {user ? (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 text-primary font-semibold flex items-center justify-center text-sm shrink-0">
              {user.name
                ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {language === "id" ? "Gagal memuat profil pengguna." : "Failed to load user profile."}
          </p>
        )}
      </div>

      {/* Tab navigation */}
      <div>
        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "categories" && (
          <CategoriesSettings categories={categories} />
        )}

        {activeTab === "api" && (
          <ApiKeysCard apiKeys={apiKeys} />
        )}

        {activeTab === "theme" && (
          <ThemeSettings />
        )}
      </div>
    </div>
  );
}
