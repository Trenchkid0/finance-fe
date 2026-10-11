import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Zap,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { CustomDateRangePicker } from "@/components/transactions/CustomDateRangePicker";
import type { Account } from "@/types";

interface EmailSyncConfig {
  id: string;
  email: string;
  imapServer: string;
  defaultAccountId?: string;
  isEnabled: boolean;
  lastSyncedAt?: string;
  lastSyncStatus: string;
  lastSyncError?: string;
  totalParsed: number;
  hasPassword?: boolean;
}

export function BankEmailSyncCard() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [config, setConfig] = useState<EmailSyncConfig | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [imapServer, setImapServer] = useState("imap.gmail.com:993");
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  // Actions states
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // User Accounts for default account picker
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetchConfig();
    fetchAccounts();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ isConfigured: boolean; config?: EmailSyncConfig }>(
        "/api/email-sync"
      );
      if (res.isConfigured && res.config) {
        setIsConfigured(true);
        setConfig(res.config);
        setEmail(res.config.email);
        setImapServer(res.config.imapServer || "imap.gmail.com:993");
        setDefaultAccountId(res.config.defaultAccountId || "");
        setIsEnabled(res.config.isEnabled);
      } else {
        setIsConfigured(false);
        setConfig(null);
      }
    } catch (err) {
      console.error("Failed to fetch email sync config:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get<{ accounts?: Account[] } | Account[]>("/api/accounts");
      const list = Array.isArray(res) ? res : res.accounts || [];
      setAccounts(list);
    } catch {
      // ignore
    }
  };

  const handleTestConnection = async () => {
    if (!email.trim() || (!appPassword.trim() && !isConfigured)) {
      toast.error(
        language === "id"
          ? "Silakan isi alamat email dan App Password terlebih dahulu!"
          : "Please fill in email and App Password first!"
      );
      return;
    }

    try {
      setTesting(true);
      const res = await api.post<{ success: boolean; message: string }>("/api/email-sync/test", {
        email: email.trim(),
        appPassword: appPassword.trim(),
        imapServer: imapServer.trim() || "imap.gmail.com:993",
      });

      if (res.success) {
        toast.success(res.message || "Koneksi IMAP berhasil!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Uji koneksi gagal. Periksa email atau App Password Anda.");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(language === "id" ? "Email tidak boleh kosong" : "Email cannot be empty");
      return;
    }

    if (!isConfigured && !appPassword.trim()) {
      toast.error(
        language === "id"
          ? "Google App Password (16 digit) wajib diisi"
          : "Google App Password is required"
      );
      return;
    }

    try {
      setSaving(true);
      const res = await api.post<{ success: boolean; message: string }>("/api/email-sync", {
        email: email.trim(),
        appPassword: appPassword.trim(),
        imapServer: imapServer.trim() || "imap.gmail.com:993",
        defaultAccountId: defaultAccountId || undefined,
        isEnabled,
      });

      if (res.success) {
        toast.success(res.message || "Konfigurasi berhasil disimpan!");
        setAppPassword("");
        fetchConfig();
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan konfigurasi email sync.");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerSync = async (reset = false) => {
    try {
      setSyncing(true);
      const rangeLabel =
        startDate && endDate
          ? `${startDate} s/d ${endDate}`
          : startDate
          ? `sejak ${startDate}`
          : "30 hari terakhir";

      toast.info(
        reset
          ? language === "id"
            ? `Mereset cache & memindai ulang email (${rangeLabel})...`
            : `Resetting cache & re-scanning emails (${rangeLabel})...`
          : language === "id"
          ? `Memindai bukti transaksi (${rangeLabel})...`
          : `Scanning transactions (${rangeLabel})...`
      );

      const res = await api.post<{ success: boolean; importedCount: number; message: string }>(
        "/api/email-sync/sync",
        { startDate, endDate, reset }
      );

      if (res.success) {
        if (res.importedCount > 0) {
          toast.success(
            language === "id"
              ? `🎉 Berhasil mencatat ${res.importedCount} transaksi baru dari email!`
              : `🎉 Successfully imported ${res.importedCount} new transactions from email!`
          );
        } else {
          toast.info(
            language === "id"
              ? "Tidak ada transaksi baru yang belum tercatat pada rentang tanggal tersebut."
              : "No new unrecorded transactions found in this date range."
          );
        }
        fetchConfig();
      }
    } catch (err: any) {
      toast.error(err?.message || "Sinkronisasi email gagal.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (
      !confirm(
        language === "id"
          ? "Apakah Anda yakin ingin memutuskan integrasi email bank ini?"
          : "Are you sure you want to disconnect this bank email integration?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const res = await api.delete<{ success: boolean; message: string }>("/api/email-sync", {});
      if (res.success) {
        toast.success(res.message || "Integrasi email bank telah diputuskan.");
        setIsConfigured(false);
        setConfig(null);
        setEmail("");
        setAppPassword("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal memutuskan integrasi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 border border-border/80 bg-card/60 backdrop-blur-md rounded-2xl flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <p className="text-xs font-medium">
            {language === "id" ? "Memuat konfigurasi sinkronisasi email..." : "Loading email sync configuration..."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border/80 bg-card/60 backdrop-blur-md rounded-2xl space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Mail size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                {language === "id" ? "Sinkronisasi Email Bank (IMAP)" : "Bank Email Sync (IMAP)"}
              </h3>
              {isConfigured ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5",
                    config?.isEnabled
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  )}
                >
                  {config?.isEnabled ? "Aktif" : "Nonaktif"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                  Belum Terhubung
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === "id"
                ? "Catat transaksi otomatis setiap kali bank (BCA, Mandiri, BRI, GoPay, dll) mengirim email bukti transfer."
                : "Automatically record transactions whenever banks (BCA, Mandiri, GoPay, etc.) send receipt emails."}
            </p>
          </div>
        </div>

        {isConfigured && (
          <div className="flex flex-wrap items-center gap-2">
            <CustomDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onPick={(range) => {
                setStartDate(range.start || "");
                setEndDate(range.end || "");
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={() => handleTriggerSync(false)}
              className="h-9 text-xs font-semibold gap-1.5 border-purple-500/30 hover:bg-purple-500/10 text-purple-300"
            >
              <RefreshCw size={13} className={cn(syncing && "animate-spin")} />
              {syncing
                ? language === "id"
                  ? "Sinkronisasi..."
                  : "Syncing..."
                : language === "id"
                ? "Sinkronkan Sekarang"
                : "Sync Now"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={syncing}
              onClick={() => {
                if (
                  confirm(
                    language === "id"
                      ? "Reset riwayat scan email dan tarik ulang semua transaksi pada rentang tanggal ini?"
                      : "Reset email scan history and re-import transactions in this date range?"
                  )
                ) {
                  handleTriggerSync(true);
                }
              }}
              title={language === "id" ? "Reset cache & pindai ulang semua email" : "Reset cache & re-scan all"}
              className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 border border-border/40"
            >
              <RotateCcw size={13} />
              {language === "id" ? "Tarik Ulang Semua" : "Re-sync All"}
            </Button>
          </div>
        )}
      </div>

      {/* Sync Status Banner */}
      {isConfigured && config && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-elevated/70 border border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Terakhir Disinkronkan:</span>
            <span className="font-semibold text-foreground">
              {config.lastSyncedAt
                ? new Date(config.lastSyncedAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Belum pernah"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Status Worker:</span>
            <span
              className={cn(
                "font-semibold flex items-center gap-1",
                config.lastSyncStatus === "failed"
                  ? "text-red-400"
                  : config.lastSyncStatus === "syncing"
                  ? "text-amber-400"
                  : "text-emerald-400"
              )}
            >
              {config.lastSyncStatus === "failed" ? (
                <>
                  <AlertCircle size={13} /> Gagal ({config.lastSyncError || "Error"})
                </>
              ) : config.lastSyncStatus === "syncing" ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Sedang Memindai
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} /> Terhubung & Siap
                </>
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Total Transaksi Terimpor:</span>
            <span className="font-mono font-bold text-foreground">
              {config.totalParsed} Transaksi
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSaveConfig} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="imap-email" className="text-xs font-semibold">
              Alamat Gmail
            </Label>
            <Input
              id="imap-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@gmail.com"
              required
              className="text-xs"
            />
          </div>

          {/* App Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="imap-password" className="text-xs font-semibold">
                Google App Password (16 Digit)
              </Label>
              <button
                type="button"
                onClick={() => setShowGuide((prev) => !prev)}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                <HelpCircle size={12} />
                Cara dapatkan?
              </button>
            </div>
            <div className="relative">
              <Input
                id="imap-password"
                type={showPassword ? "text" : "password"}
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder={
                  isConfigured
                    ? "•••••••••••••••• (Tersimpan - Kosongkan jika tidak diubah)"
                    : "abcd efgh ijkl mnop"
                }
                required={!isConfigured}
                className="text-xs pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Default Account */}
          <div className="space-y-1.5">
            <Label htmlFor="default-account" className="text-xs font-semibold">
              Rekening Asal Default (Opsional)
            </Label>
            <select
              id="default-account"
              value={defaultAccountId}
              onChange={(e) => setDefaultAccountId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              <option value="" className="bg-card text-foreground">
                Deteksi Otomatis berdasarkan Nama Bank
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-card text-foreground">
                  {acc.name} ({acc.type.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              Jika email bank menyebutkan rekening yang cocok, sistem akan memilih otomatis.
            </p>
          </div>

          {/* IMAP Server */}
          <div className="space-y-1.5">
            <Label htmlFor="imap-server" className="text-xs font-semibold">
              Server IMAP & Port
            </Label>
            <Input
              id="imap-server"
              type="text"
              value={imapServer}
              onChange={(e) => setImapServer(e.target.value)}
              placeholder="imap.gmail.com:993"
              className="text-xs font-mono"
            />
          </div>
        </div>

        {/* Toggle IsEnabled */}
        {isConfigured && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is-enabled-toggle"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <Label htmlFor="is-enabled-toggle" className="text-xs font-medium cursor-pointer">
              Aktifkan sinkronisasi otomatis di latar belakang (setiap 5 menit)
            </Label>
          </div>
        )}

        {/* Helper Guide Accordion */}
        {showGuide && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-2.5 text-purple-200">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Cara Membuat Google App Password (Gratis & Aman 100%):
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
              <li>
                Buka akun Google Anda di{" "}
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-white inline-flex items-center gap-0.5"
                >
                  myaccount.google.com/security <ExternalLink size={10} />
                </a>{" "}
                dan pastikan <strong>Verifikasi 2 Langkah (2FA)</strong> telah aktif.
              </li>
              <li>
                Kunjungi halaman{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-white inline-flex items-center gap-0.5"
                >
                  myaccount.google.com/apppasswords <ExternalLink size={10} />
                </a>
              </li>
              <li>
                Beri nama aplikasi, misalnya <strong>"Finance Self-Hosted"</strong>, lalu klik{" "}
                <strong>Buat</strong>.
              </li>
              <li>
                Salin 16 digit huruf yang muncul (misal: <code>abcd efgh ijkl mnop</code>) dan
                tempelkan pada kolom password di atas.
              </li>
            </ol>
            <div className="text-[10px] text-purple-300/80 pt-1 border-t border-purple-500/20">
              💡 <em>Catatan Privasi</em>: Server hanya membaca email mutasi transaksi dari bank (BCA,
              Mandiri, BRI, GoPay, Shopee, dll). Email pribadi lainnya tidak akan disimpan.
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing || saving}
              onClick={handleTestConnection}
              className="text-xs font-semibold h-8"
            >
              <Zap size={13} className="mr-1 text-amber-400" />
              {testing ? "Menguji..." : "Uji Koneksi"}
            </Button>

            {isConfigured && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={handleDeleteConfig}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
              >
                <Trash2 size={13} className="mr-1" />
                Putuskan
              </Button>
            )}
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white h-8 px-4"
          >
            {saving
              ? "Menyimpan..."
              : isConfigured
              ? "Perbarui Pengaturan"
              : "Simpan & Hubungkan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
