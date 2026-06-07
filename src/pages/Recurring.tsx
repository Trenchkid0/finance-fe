import { useEffect, useState } from "react";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  Repeat,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecurringForm } from "@/components/recurring/RecurringForm";

interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  categoryId?: string | null;
  frequency: string; // "weekly", "monthly", "yearly"
  dayOfMonth: number;
  note?: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}

export default function Recurring() {
  const { language } = useLanguage();
  const { categories } = useApp();
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar Date State (default to current date)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  // Delete Confirm State
  const [deletingBill, setDeletingBill] = useState<RecurringBill | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await api.get<RecurringBill[]>("/api/recurring");
      setBills(data || []);
    } catch (err) {
      console.error("Error fetching recurring bills", err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const openAddModal = (initialDay?: number) => {
    setEditingBill({
      id: '',
      name: '',
      amount: 0,
      categoryId: null,
      frequency: 'monthly',
      dayOfMonth: initialDay || selectedDay || 1,
      note: '',
    } as any);
    setIsModalOpen(true);
  };

  const openEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingBill?.id) {
        await api.put(`/api/recurring/${editingBill.id}`, data);
        toast.success(language === "id" ? "Tagihan berhasil diperbarui" : "Bill updated successfully");
      } else {
        await api.post("/api/recurring", data);
        toast.success(language === "id" ? "Tagihan berhasil ditambahkan" : "Bill added successfully");
      }
      setIsModalOpen(false);
      setEditingBill(null);
      fetchBills();
    } catch (err) {
      console.error(err);
      toast.error(language === "id" ? "Gagal menyimpan tagihan" : "Failed to save bill");
    }
  };

  const handleDelete = async () => {
    if (!deletingBill) return;
    try {
      await api.delete(`/api/recurring/${deletingBill.id}`);
      toast.success(language === "id" ? "Tagihan berhasil dihapus" : "Bill deleted successfully");
      setDeletingBill(null);
      fetchBills();
    } catch (err) {
      console.error(err);
      toast.error(language === "id" ? "Gagal menghapus tagihan" : "Failed to delete bill");
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      await api.post("/api/recurring/test-telegram", {});
      toast.success(language === "id" ? "Uji coba notifikasi Telegram berhasil dikirim!" : "Telegram test notification sent successfully!");
    } catch (err) {
      console.error(err);
      toast.error(language === "id" ? "Gagal mengirim uji coba notifikasi" : "Failed to send test notification");
    } finally {
      setTestingTelegram(false);
    }
  };

  // Metrics
  const monthlyTotal = bills.reduce((acc, b) => {
    if (b.frequency === "monthly") return acc + b.amount;
    if (b.frequency === "weekly") return acc + b.amount * 4; // approximate
    if (b.frequency === "yearly") return acc + b.amount / 12; // approximate
    return acc;
  }, 0);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Weekday offset of 1st day of month (0 = Sunday, 1 = Monday, etc.)
  let startOffset = new Date(year, month, 1).getDay();
  // Adjust offset to make Monday first (0 = Mon, 1 = Tue, ..., 6 = Sun)
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  // Generate calendar grid array
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  // Get bills occurring on a specific calendar day of the month
  const getBillsForDay = (dayNum: number): RecurringBill[] => {
    return bills.filter((b) => {
      // If frequency is monthly or yearly, check if the day matches
      if (b.frequency === "monthly" || b.frequency === "yearly") {
        return b.dayOfMonth === dayNum;
      }
      // If frequency is weekly, we can display it on the same weekday as the specified dayOfMonth
      if (b.frequency === "weekly") {
        const billBaseDate = new Date(year, month, b.dayOfMonth);
        const currentCheckDate = new Date(year, month, dayNum);
        return billBaseDate.getDay() === currentCheckDate.getDay();
      }
      return false;
    });
  };

  // Month Name Label
  const monthLabel = currentDate.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
    month: "long",
    year: "numeric",
  });

  // Selected Day bills list
  const selectedDayBills = selectedDay ? getBillsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
            {language === "id" ? "Jadwal Tagihan & Langganan" : "Bill Schedule & Subscriptions"}
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5">
            {language === "id"
              ? "Kalender interaktif untuk memantau pengeluaran subscription bulanan Anda."
              : "Interactive calendar to track your monthly subscription commitments."}
          </p>
        </div>
        <Button onClick={() => openAddModal()} className="h-9 rounded-xl gap-2 text-xs font-semibold px-4">
          <Plus size={14} strokeWidth={2.5} />
          {language === "id" ? "Tambah Tagihan" : "Add Bill"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 gap-0">
          <CardHeader className="p-0">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {language === "id" ? "TOTAL BULANAN" : "TOTAL MONTHLY COMMITMENT"}
            </CardDescription>
            <CardTitle className="text-lg font-black font-mono tabular-nums text-foreground mt-1">
              {formatIDR(monthlyTotal)}
            </CardTitle>
            <CardAction>
              <div className="size-9 rounded-xl bg-expense/10 border border-expense/20 flex items-center justify-center text-expense">
                <Repeat size={16} />
              </div>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="p-4 gap-0">
          <CardHeader className="p-0">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {language === "id" ? "LAYANAN AKTIF" : "ACTIVE SUBSCRIPTIONS"}
            </CardDescription>
            <CardTitle className="text-lg font-black font-mono tabular-nums text-foreground mt-1 flex items-baseline gap-1">
              <span>{bills.length}</span>
              <span className="text-xs text-muted-foreground/60 font-sans font-semibold">
                {language === "id" ? "tagihan" : "items"}
              </span>
            </CardTitle>
            <CardAction>
              <div className="size-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <CalendarRange size={16} />
              </div>
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      {/* Calendar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 overflow-hidden gap-0">
          {/* Calendar Header with Navigation */}
          <div className="p-4 border-b border-border bg-white/[0.01] flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              {monthLabel}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="size-8 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="size-8 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border bg-white/[0.005] text-center">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, idx) => (
              <span
                key={idx}
                className="py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted"
              >
                {language === "id" ? day : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
              </span>
            ))}
          </div>

          {/* Calendar Days */}
          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 bg-[#30363D]/10 divide-x divide-y divide-border">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[70px] bg-white/[0.005] border-t border-l border-border"
                    />
                  );
                }

                const dayBills = getBillsForDay(day);
                const isSelected = selectedDay === day;
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[70px] p-2 flex flex-col justify-between cursor-pointer transition-colors border-t border-l border-border relative ${
                      isSelected
                        ? "bg-accent/10 hover:bg-accent/15"
                        : "hover:bg-elevated/40"
                    }`}
                  >
                    {dayBills.length > 0 && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-expense/50 rounded-r" />
                    )}
                    <div className="flex justify-between items-start z-10">
                      <span
                        className={`text-xs font-mono font-bold leading-none ${
                          isToday
                            ? "bg-accent text-white size-5 rounded-full flex items-center justify-center -m-1"
                            : isSelected
                            ? "text-accent font-black"
                            : "text-text-muted"
                        }`}
                      >
                        {day}
                      </span>

                      {/* Small Indicator dot if has bills */}
                      {dayBills.length > 0 && (
                        <span className="size-1.5 rounded-full bg-expense animate-pulse" />
                      )}
                    </div>

                    {/* Compact list of bill names on this cell */}
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {dayBills.slice(0, 2).map((bill) => (
                        <div
                          key={bill.id}
                          className="text-[9px] font-semibold truncate bg-expense/10 text-expense border border-expense/20 px-1 rounded leading-tight"
                        >
                          {bill.name}
                        </div>
                      ))}
                      {dayBills.length > 2 && (
                        <div className="text-[8px] text-text-muted font-bold pl-1">
                          +{dayBills.length - 2} lagi
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Selected Day Bill Detail List Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="p-5 flex flex-col justify-between min-h-[300px] gap-0">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Calendar size={13} className="text-accent" />
                  {selectedDay
                    ? `${language === "id" ? "TANGGAL" : "DAY"} ${selectedDay} ${monthLabel.split(" ")[0]}`
                    : language === "id" ? "PILIH TANGGAL" : "SELECT A DAY"}
                </h3>
                {selectedDay && (
                  <Button
                    onClick={() => openAddModal(selectedDay)}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] font-bold gap-1 text-accent hover:bg-elevated px-2 rounded-lg"
                  >
                    <Plus size={11} />
                    {language === "id" ? "Tambah" : "Add"}
                  </Button>
                )}
              </div>

              {selectedDay === null ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
                  <Info size={24} className="mb-2 opacity-50" />
                  <p className="text-xs">
                    {language === "id"
                      ? "Pilih tanggal pada kalender untuk melihat daftar tagihan."
                      : "Select a date on the calendar grid to see scheduled bills."}
                  </p>
                </div>
              ) : selectedDayBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
                  <Clock size={24} className="mb-2 opacity-40" />
                  <p className="text-xs font-medium">
                    {language === "id"
                      ? "Tidak ada jadwal tagihan pada tanggal ini."
                      : "No scheduled bills on this day."}
                  </p>
                  <Button
                    onClick={() => openAddModal(selectedDay)}
                    variant="outline"
                    className="mt-3 h-7 rounded-lg text-[10px] font-semibold border-border bg-elevated hover:bg-[#2D333B] px-3"
                  >
                    {language === "id" ? "Pasang Tagihan" : "Setup Bill"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-3 rounded-lg border border-border bg-elevated/40 hover:bg-elevated transition-all duration-200"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-text-primary leading-tight">
                            {bill.name}
                          </h4>
                          <span className="text-[9px] font-medium text-accent uppercase tracking-wider mt-1 block">
                            {bill.frequency === "monthly"
                              ? language === "id" ? "Bulanan" : "Monthly"
                              : bill.frequency === "weekly"
                              ? language === "id" ? "Mingguan" : "Weekly"
                              : language === "id" ? "Tahunan" : "Yearly"}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => openEditModal(bill)}
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-[#1C2128]"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => setDeletingBill(bill)}
                            className="p-1 rounded text-text-muted hover:text-expense hover:bg-expense/10"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-3 pt-2 border-t border-border/50">
                        <span className="text-[10px] text-text-muted">
                          {bill.category?.name || (language === "id" ? "Tanpa Kategori" : "Uncategorized")}
                        </span>
                        <span className="text-xs font-black font-mono tabular-nums text-text-primary">
                          {formatIDR(bill.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Telegram Settings Card */}
          <Card className="p-5 space-y-4 gap-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <span className="text-sky-500">🔵</span>
              Telegram Bot Notifier
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {language === "id"
                ? "Dapatkan notifikasi otomatis saat tagihan jatuh tempo melalui Bot Telegram."
                : "Receive automated alerts when bills are due via a Telegram Bot."}
            </p>
            <div className="pt-1">
              <Button
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                variant="outline"
                className="w-full h-8 rounded-lg text-xs font-semibold border-border bg-elevated hover:bg-[#2D333B]"
              >
                {testingTelegram
                  ? (language === "id" ? "Mengirim Tes..." : "Sending Test...")
                  : (language === "id" ? "Kirim Pesan Tes" : "Send Test Message")}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/60 italic leading-snug">
              {language === "id"
                ? "Konfigurasi TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID di file .env backend untuk mengaktifkan notifikasi."
                : "Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in backend .env to enable alerts."}
            </p>
          </Card>
        </div>
      </div>

      {/* Add / Edit Form */}
      {isModalOpen && (
        <RecurringForm
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBill(null);
          }}
          recurring={editingBill?.id ? editingBill : undefined}
          categories={categories}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingBill} onOpenChange={(open) => !open && setDeletingBill(null)}>
        <DialogContent className="bg-elevated border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {language === "id" ? "Hapus Tagihan Berulang?" : "Delete Recurring Bill?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === "id"
                ? "Tindakan ini permanen dan akan menghapus pelacakan tagihan rutin."
                : "This action is permanent and will stop tracking this constant schedule."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingBill(null)}
              className="h-8 rounded-lg text-xs font-semibold"
            >
              {language === "id" ? "Batal" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="bg-expense hover:bg-red-600 text-white h-8 rounded-lg text-xs font-semibold"
            >
              {language === "id" ? "Hapus" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
