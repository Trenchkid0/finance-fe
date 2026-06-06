import { useEffect, useState } from "react";
import { useApp } from "@/components/layout/AppLayout";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { listApiKeys, type ApiKeyListItem } from "@/app/actions/api-keys";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { user, categories: globalCategories, refresh } = useApp();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await listApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      fetchApiKeys();
      refresh();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [refresh]);

  if (loading && apiKeys.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  // Format categories to match CategoryItem interface expected by SettingsClient
  const formattedCategories = globalCategories.map((c: any) => ({
    id: c.id,
    name: c.name,
    type: c.type as "income" | "expense",
    icon: c.icon,
    isDefault: c.isDefault || false,
  }));

  return (
    <SettingsClient
      user={user}
      categories={formattedCategories}
      apiKeys={apiKeys}
    />
  );
}
