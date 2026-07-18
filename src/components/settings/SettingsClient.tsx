import { useState, useEffect } from "react";
import { Key, Palette, Shapes, User, Database, Download, Upload, ShieldAlert, Loader2, LayoutGrid } from "lucide-react";
import { ApiKeysCard } from "./ApiKeysCard";
import { CategoriesSettings, type CategoryItem } from "./CategoriesSettings";
import { ThemeSettings } from "./ThemeSettings";
import { DashboardGridSettings } from "./DashboardGridSettings";
import type { ApiKeyListItem } from "@/app/actions/api-keys";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
  } | null;
  categories: CategoryItem[];
  apiKeys: ApiKeyListItem[];
}

type Tab = "categories" | "api" | "theme" | "data" | "dashboard";

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "";
  if (url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }
    return url;
  }
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${host}:8081`;
};

export function SettingsClient({ user, categories, apiKeys }: Props) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  const [restoring, setRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dbType, setDbType] = useState<string>("sqlite");

  useEffect(() => {
    const fetchDbType = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/api/system/db-type`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.dbType) {
            setDbType(data.dbType);
          }
        }
      } catch (err) {
        console.error("Failed to fetch database type:", err);
      }
    };
    fetchDbType();
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "categories", label: language === "id" ? "Kategori" : "Categories", icon: <Shapes size={14} /> },
    { id: "api", label: language === "id" ? "API & Integrasi" : "API & Integrations", icon: <Key size={14} /> },
    { id: "theme", label: language === "id" ? "Kustomisasi Warna" : "Color Customization", icon: <Palette size={14} /> },
    { id: "dashboard", label: language === "id" ? "Tata Letak Dashboard" : "Dashboard Layout", icon: <LayoutGrid size={14} /> },
    { id: "data", label: language === "id" ? "Manajemen Data" : "Data Management", icon: <Database size={14} /> },
  ];

  const handleBackup = async () => {
    try {
      toast.info(language === "id" ? "Memulai pencadangan..." : "Starting backup...");
      const response = await fetch(`${getBaseUrl()}/api/system/backup`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Backup failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `racks_finance_backup_${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(language === "id" ? "Database berhasil diunduh" : "Database successfully downloaded");
    } catch (err: any) {
      toast.error(language === "id" ? "Gagal melakukan cadangan" : "Backup failed");
    }
  };

  const handleBackupSQL = async () => {
    try {
      toast.info(language === "id" ? "Memulai pencadangan SQL..." : "Starting SQL backup...");
      const response = await fetch(`${getBaseUrl()}/api/system/backup/sql`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("SQL Backup failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `racks_finance_backup_${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(language === "id" ? "Database SQL berhasil diunduh" : "SQL database successfully downloaded");
    } catch (err: any) {
      toast.error(language === "id" ? "Gagal melakukan cadangan SQL" : "SQL backup failed");
    }
  };

  const handleBackupCSV = async () => {
    try {
      toast.info(language === "id" ? "Memulai pencadangan CSV..." : "Starting CSV backup...");
      const response = await fetch(`${getBaseUrl()}/api/system/backup/csv`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("CSV Backup failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `racks_finance_csv_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(language === "id" ? "Database CSV berhasil diunduh" : "CSV database successfully downloaded");
    } catch (err: any) {
      toast.error(language === "id" ? "Gagal melakukan cadangan CSV" : "CSV backup failed");
    }
  };

  const handleExportAll = async () => {
    try {
      toast.info(language === "id" ? "Mengekspor data..." : "Exporting data...");
      const response = await fetch(`${getBaseUrl()}/api/system/export`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `racks_finance_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(language === "id" ? "Semua data berhasil diekspor" : "All data successfully exported");
    } catch (err: any) {
      toast.error(language === "id" ? "Gagal mengekspor data" : "Export failed");
    }
  };

  const handleRestore = async (file: File) => {
    try {
      setRestoring(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${getBaseUrl()}/api/system/restore`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Restore failed");
      }

      toast.success(
        language === "id"
          ? "Database berhasil dipulihkan! Halaman akan dimuat ulang."
          : "Database successfully restored! Reloading page."
      );
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || (language === "id" ? "Gagal memulihkan database" : "Failed to restore database"));
    } finally {
      setRestoring(false);
      setConfirmRestore(false);
      setSelectedFile(null);
    }
  };

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
      <Card className="p-6 space-y-3">
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
      </Card>

      {/* Tab navigation */}
      <div>
        <div className="overflow-x-auto -mx-1 px-1 scrollbar-none">
          <div className="flex gap-1 border-b border-border mb-6 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 shrink-0 whitespace-nowrap",
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

        {activeTab === "dashboard" && (
          <DashboardGridSettings />
        )}

        {activeTab === "data" && (
          <div className="space-y-6">
            {/* Backup Card */}
            <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Download size={14} className="text-accent" />
                  {language === "id" ? "Cadangkan Database" : "Backup Database"}
                </h3>
                <p className="text-xs text-text-muted max-w-xl">
                  {dbType === "mysql"
                    ? (language === "id"
                      ? "Ekspor salinan cadangan database MySQL Anda dalam format SQL dump atau file CSV (ZIP)."
                      : "Export a backup copy of your MySQL database in SQL dump or CSV file (ZIP) format.")
                    : (language === "id"
                      ? "Unduh salinan cadangan dari seluruh database SQLite Anda (.db) untuk disimpan secara aman."
                      : "Download a full backup file of your SQLite database (.db) to store it securely.")}
                </p>
              </div>
              {dbType === "mysql" ? (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleBackupSQL}
                    className="border-border hover:bg-elevated text-xs font-semibold h-9 px-4 rounded-xl gap-1.5"
                  >
                    <Download size={13} />
                    {language === "id" ? "Ekspor SQL" : "Export SQL"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBackupCSV}
                    className="border-border hover:bg-elevated text-xs font-semibold h-9 px-4 rounded-xl gap-1.5"
                  >
                    <Download size={13} />
                    {language === "id" ? "Ekspor CSV (ZIP)" : "Export CSV (ZIP)"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleBackup}
                  className="border-border hover:bg-elevated text-xs font-semibold h-9 px-4 rounded-xl shrink-0"
                >
                  {language === "id" ? "Unduh Database" : "Download Database"}
                </Button>
              )}
            </Card>

            {/* Export Card */}
            <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Download size={14} className="text-income" />
                  {language === "id" ? "Ekspor Semua Data (JSON)" : "Export All Data (JSON)"}
                </h3>
                <p className="text-xs text-text-muted max-w-xl">
                  {language === "id"
                    ? "Ekspor semua data transaksi, akun, kategori kustom, dan preferensi Anda dalam satu file JSON."
                    : "Export all your transactions, accounts, custom categories, and preferences in a single JSON file."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportAll}
                className="border-border hover:bg-elevated text-xs font-semibold h-9 px-4 rounded-xl shrink-0"
              >
                {language === "id" ? "Ekspor JSON" : "Export JSON"}
              </Button>
            </Card>

            {/* Restore Card */}
            <Card className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-expense flex items-center gap-2">
                  <Upload size={14} />
                  {language === "id" ? "Pulihkan Database" : "Restore Database"}
                </h3>
                <p className="text-xs text-text-muted">
                  {dbType === "mysql"
                    ? (language === "id"
                      ? "Fitur pemulihan database dari web panel hanya didukung untuk database SQLite. Untuk memulihkan database MySQL Anda, harap gunakan tool manajemen database standar (seperti phpMyAdmin, DBeaver, dll.)."
                      : "Database restore from web panel is only supported for SQLite. To restore your MySQL database, please use standard database management tools (such as phpMyAdmin, DBeaver, etc.).")
                    : (language === "id"
                      ? "Unggah file database (.db) cadangan sebelumnya untuk memulihkan keadaan data. Seluruh data aktif akan ditimpa."
                      : "Upload a previously backed-up database (.db) file to restore your state. All current active data will be overwritten.")}
                </p>
              </div>

              {dbType !== "mysql" && (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".db"
                    id="db-restore-file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setConfirmRestore(true);
                      }
                    }}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => document.getElementById("db-restore-file")?.click()}
                    disabled={restoring}
                    className="bg-expense/10 text-expense border border-expense/30 hover:bg-expense/20 text-xs font-semibold h-9 px-4 rounded-xl gap-1.5"
                  >
                    <Upload size={13} />
                    {language === "id" ? "Unggah & Pulihkan" : "Upload & Restore"}
                  </Button>
                </div>
              )}
            </Card>

            {/* Confirm Restore Dialog */}
            <Dialog
              open={confirmRestore}
              onOpenChange={(open) => !open && !restoring && setConfirmRestore(false)}
            >
              <DialogContent className="rounded-2xl border border-border bg-popover backdrop-blur-xl max-w-sm shadow-2xl shadow-black/10 dark:shadow-black/45">
                <DialogHeader>
                  <DialogTitle className="text-text-primary text-base font-bold flex items-center gap-2">
                    <ShieldAlert className="text-expense" size={18} />
                    {language === "id" ? "Konfirmasi Pemulihan" : "Confirm Restore"}
                  </DialogTitle>
                </DialogHeader>
                <DialogBody className="space-y-4">
                  <p className="text-xs text-text-muted leading-relaxed">
                    {language === "id"
                      ? `Apakah Anda yakin ingin memulihkan database dari file "${selectedFile?.name}"? Tindakan ini akan menghapus dan menimpa seluruh transaksi, akun, dan kategori saat ini secara permanen!`
                      : `Are you sure you want to restore the database from "${selectedFile?.name}"? This action will permanently erase and overwrite all current transactions, accounts, and categories!`}
                  </p>
                  <div className="flex justify-end gap-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={restoring}
                      onClick={() => {
                        setConfirmRestore(false);
                        setSelectedFile(null);
                      }}
                      className="text-xs h-9 px-4 rounded-xl"
                    >
                      {language === "id" ? "Batal" : "Cancel"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={restoring}
                      onClick={() => selectedFile && handleRestore(selectedFile)}
                      className="bg-expense hover:bg-red-600 text-white text-xs font-semibold h-9 px-4 rounded-xl gap-1.5"
                    >
                      {restoring && <Loader2 className="h-3 w-3 animate-spin" />}
                      {language === "id" ? "Ya, Pulihkan" : "Yes, Restore"}
                    </Button>
                  </div>
                </DialogBody>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
