import { useState, useEffect } from "react";
import { Plus, Search, Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQuickAdd } from "@/components/transactions/QuickAddProvider";
import { openCommandPalette } from "@/components/command-palette/CommandPalette";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Sticky top bar — sidebar trigger + global actions.
 *
 *   - Search button → membuka command palette (Cmd+K)
 *   - Tambah button → membuka quick-add dialog (shortcut: N)
 *
 * Page title sengaja tidak dipasang di sini karena setiap page sudah
 * render <h1>-nya sendiri (audit poin 2 — hindari duplikasi visual).
 */
export function SiteHeader() {
  const { open: openQuickAdd, canCreate } = useQuickAdd();
  const { language, setLanguage } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<any[]>("/api/notifications");
      setNotifications(res);
      setUnreadCount(res.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post("/api/notifications/read", {});
      toast.success(language === "id" ? "Semua notifikasi ditandai dibaca" : "All notifications marked as read");
      fetchNotifications();
    } catch (err) {
      toast.error(language === "id" ? "Gagal memperbarui notifikasi" : "Failed to update notifications");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post("/api/notifications/read", { ids: [id] });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete("/api/notifications");
      toast.success(language === "id" ? "Semua notifikasi dihapus" : "All notifications cleared");
      fetchNotifications();
    } catch (err) {
      toast.error(language === "id" ? "Gagal menghapus notifikasi" : "Failed to clear notifications");
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/30 bg-canvas/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        {/* Sidebar trigger */}
        <SidebarTrigger className="-ml-1 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] transition-all duration-200 rounded-lg" />
        <Separator
          orientation="vertical"
          className="mx-0.5 h-4 bg-border/30"
        />

        {/* Search trigger — command palette */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2.5 h-9 px-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs text-muted-foreground/50 hover:text-foreground/80 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 w-64 lg:w-80 group"
          aria-label="Buka pencarian cepat"
        >
          <Search size={14} className="shrink-0 text-muted-foreground/40 group-hover:text-accent/60 transition-colors" />
          <span className="flex-1 text-left text-[12px]">Cari halaman, akun, transaksi…</span>
          <kbd className="ml-auto text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-muted-foreground/40 tracking-wide">
            ⌘K
          </kbd>
        </button>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cari"
            className="h-9 w-9 md:hidden rounded-xl text-muted-foreground/50 hover:text-foreground"
            onClick={openCommandPalette}
          >
            <Search size={16} />
          </Button>

          {/* Dynamic Notifications Bell */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifikasi"
                className="h-9 w-9 rounded-xl text-muted-foreground/50 hover:text-foreground relative"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-accent animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 bg-surface border border-border rounded-xl p-0 overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-border bg-elevated/40">
                <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  {language === "id" ? "Notifikasi" : "Notifications"}
                  {unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-mono tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-elevated"
                      title={language === "id" ? "Tandai semua dibaca" : "Mark all as read"}
                      onClick={markAllAsRead}
                    >
                      <CheckCheck size={14} />
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-expense hover:bg-expense/10"
                      title={language === "id" ? "Hapus semua" : "Clear all"}
                      onClick={clearAllNotifications}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Bell size={24} className="text-muted-foreground/30 mb-2" />
                    <span className="text-xs text-muted-foreground">
                      {language === "id" ? "Tidak ada notifikasi baru" : "No new notifications"}
                    </span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      className={`flex gap-3 p-3 transition-colors duration-200 cursor-pointer ${
                        n.isRead ? "hover:bg-elevated/40 bg-transparent" : "hover:bg-accent/5 bg-accent/5"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs truncate ${n.isRead ? "text-text-primary" : "text-text-primary font-semibold"}`}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="size-1.5 rounded-full bg-accent shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {new Date(n.createdAt).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            onClick={(e) => deleteNotification(e, n.id)}
                            className="text-[10px] text-muted-foreground hover:text-expense hover:underline transition-colors"
                          >
                            {language === "id" ? "Hapus" : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language selector */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 gap-1.5 px-2 text-xs font-semibold text-text-primary hover:bg-white/[0.04] transition-all ml-1 flex items-center justify-center"
                style={{ borderRadius: 'var(--dropdown-radius, 8px)' }}
              >
                <span>{language === "id" ? "ID" : "EN"}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px] rounded-xl border-border/40 bg-elevated/60 backdrop-blur-xl">
              <DropdownMenuItem
                className="text-xs font-semibold cursor-pointer"
                onSelect={() => setLanguage("id")}
              >
                Bahasa Indonesia
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs font-semibold cursor-pointer"
                onSelect={() => setLanguage("en")}
              >
                English (US)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Separator */}
          <Separator
            orientation="vertical"
            className="mx-1 h-5 bg-border/30 hidden sm:block"
          />

          {/* Add transaction */}
          <Button
            size="sm"
            onClick={openQuickAdd}
            disabled={!canCreate}
            title={
              canCreate
                ? "Tambah transaksi (N)"
                : "Tambahkan akun terlebih dahulu"
            }
            className="h-9 gap-2 rounded-xl text-[12px] px-4"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
