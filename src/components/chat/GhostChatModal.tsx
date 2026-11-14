import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Trash2,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GhostAvatar, type GhostMood } from "./GhostAvatar";
import {
  processGhostQuery,
  type GhostDataCard,
  type GhostDataCardAction,
  type FinancialContext,
} from "@/lib/chat/ghostFinancialEngine";
import { useApp } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { SummaryApiResponse } from "@/types";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { invalidateCache } from "@/lib/cache";
import { formatIDR } from "@/lib/utils/formatters";

interface ChatMessage {
  id: string;
  sender: "user" | "ghost";
  text: string;
  timestamp: Date;
  mood?: GhostMood;
  dataCard?: GhostDataCard;
  suggestedPrompts?: string[];
}

const getInitialMessages = (name?: string, uId?: string): ChatMessage[] => [
  {
    id: `welcome-${uId || "guest"}`,
    sender: "ghost",
    text: `Boo! 👻 Halo **${name || "Sobat"}**! Aku **Racks**, asisten finansial pribadimu! Aku mengawasi seluruh pengeluaran, pemasukan, dan kesehatan dompetmu. Kamu bisa langsung menyuruhku mencatat transaksi, cari riwayat belanja, atau cek saldo akun!`,
    timestamp: new Date(),
    mood: "happy",
    suggestedPrompts: [
      "Catat makan siang 35rb dari BCA",
      "Cari transaksi Indomaret",
      "Saldo BCA berapa?",
      "Boleh beli laptop 10jt gak?",
      "Cek transaksi pajak Coretax",
      "Apa yang bisa kamu lakukan?",
    ],
  },
];

export const GhostChatModal: React.FC = () => {
  const { user, accounts } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Unique key per user (isolated storage for User A, User B, etc.)
  const userId = user?.id || user?.email || "anonymous";
  const userName =
    user?.name?.trim().split(" ")[0] ||
    user?.email?.split("@")?.[0] ||
    "Sobat";
  const storageKey = `racks_ghost_chat_history_${userId}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
        }
      }
    } catch {
      // ignore
    }
    return getInitialMessages(userName, userId);
  });

  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryApiResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const isDraggingChipsRef = useRef(false);
  const startXChipsRef = useRef(0);
  const scrollLeftChipsRef = useRef(0);
  const hasMovedChipsRef = useRef(false);

  // In-memory session caches to avoid redundant API network requests during rapid questions (2-min TTL)
  const cachedTxRef = useRef<{ data: any[]; timestamp: number } | null>(null);
  const cachedBudgetsRef = useRef<{ data: any[]; timestamp: number } | null>(null);
  const cachedInvestmentsRef = useRef<{ data: any[]; timestamp: number } | null>(null);

  // Switch chat history when logged-in user changes (User A -> User B)
  useEffect(() => {
    cachedTxRef.current = null;
    cachedBudgetsRef.current = null;
    cachedInvestmentsRef.current = null;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }))
          );
          return;
        }
      }
    } catch {
      // ignore
    }
    setMessages(getInitialMessages(userName, userId));
  }, [userId, userName, storageKey]);

  // Fetch summary if not present
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const res = await api.get<SummaryApiResponse>("/api/summary?period=30d");
        if (isMounted) setSummaryData(res);
      } catch (err) {
        console.warn("Failed to load summary for ghost assistant", err);
      }
    };
    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Save chat to user-specific localStorage key (capped at last 50 messages to preserve memory & storage)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    try {
      const trimmed = messages.slice(-50);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  // Handle ESC key to close right sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Global custom event listeners to toggle/open ghost chat from Header or anywhere
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("open-ghost-chat", handleOpen);
    window.addEventListener("toggle-ghost-chat", handleToggle);
    return () => {
      window.removeEventListener("open-ghost-chat", handleOpen);
      window.removeEventListener("toggle-ghost-chat", handleToggle);
    };
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Convert mouse wheel vertical scroll into horizontal scroll for chips
  useEffect(() => {
    const el = chipsRef.current;
    if (!el || !isOpen) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [isOpen]);

  // Mouse drag-to-scroll for desktop mouse users
  const handleChipsMouseDown = (e: React.MouseEvent) => {
    if (!chipsRef.current) return;
    isDraggingChipsRef.current = true;
    hasMovedChipsRef.current = false;
    startXChipsRef.current = e.pageX - chipsRef.current.offsetLeft;
    scrollLeftChipsRef.current = chipsRef.current.scrollLeft;
  };

  const handleChipsMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingChipsRef.current || !chipsRef.current) return;
    const x = e.pageX - chipsRef.current.offsetLeft;
    const walk = x - startXChipsRef.current;
    if (Math.abs(walk) > 4) {
      hasMovedChipsRef.current = true;
    }
    chipsRef.current.scrollLeft = scrollLeftChipsRef.current - walk;
  };

  const handleChipsMouseUp = () => {
    isDraggingChipsRef.current = false;
  };

  const scrollChips = (dir: "left" | "right") => {
    if (chipsRef.current) {
      chipsRef.current.scrollBy({
        left: dir === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    try {
      let transactionsList = summaryData?.recent || [];
      const qLower = query.toLowerCase();

      // Fetch live transactions for all financial queries (cached in memory for 120s)
      const isPureGreeting =
        (qLower === "halo" || qLower === "hai" || qLower === "hey" || qLower === "tes" || qLower === "test" || qLower === "makasih") &&
        qLower.length < 10;
      const needsTx = !isPureGreeting || transactionsList.length <= 5;

      const now = Date.now();

      if (needsTx) {
        if (cachedTxRef.current && now - cachedTxRef.current.timestamp < 120_000) {
          transactionsList = cachedTxRef.current.data;
        } else {
          try {
            const res = await api.get<{ transactions: any[] }>(
              "/api/transactions?type=expense&limit=500"
            );
            if (res && res.transactions) {
              transactionsList = res.transactions;
              cachedTxRef.current = { data: res.transactions, timestamp: now };
            }
          } catch {
            // fallback to summaryData.recent
          }
        }
      }

      // Fetch budgets if queried (cached for 2 minutes)
      let budgetsList = undefined;
      if (qLower.includes("budget") || qLower.includes("anggaran")) {
        if (cachedBudgetsRef.current && now - cachedBudgetsRef.current.timestamp < 120_000) {
          budgetsList = cachedBudgetsRef.current.data;
        } else {
          try {
            budgetsList = await api.get<any[]>("/api/budgets");
            if (budgetsList) {
              cachedBudgetsRef.current = { data: budgetsList, timestamp: now };
            }
          } catch {
            // ignore
          }
        }
      }

      // Fetch investments if queried (cached for 2 minutes)
      let investmentsList = undefined;
      if (
        qLower.includes("investasi") ||
        qLower.includes("portofolio") ||
        qLower.includes("saham") ||
        qLower.includes("reksa") ||
        qLower.includes("sehat") ||
        qLower.includes("skor")
      ) {
        if (cachedInvestmentsRef.current && now - cachedInvestmentsRef.current.timestamp < 120_000) {
          investmentsList = cachedInvestmentsRef.current.data;
        } else {
          try {
            investmentsList = await api.get<any[]>("/api/investments");
            if (investmentsList) {
              cachedInvestmentsRef.current = { data: investmentsList, timestamp: now };
            }
          } catch {
            // ignore
          }
        }
      }

      // Small natural delay so user sees Racks thinking
      await new Promise((r) => setTimeout(r, 260));

      const ctx: FinancialContext = {
        summary: summaryData,
        accounts: accounts || [],
        user: user || null,
        transactions: transactionsList,
        budgets: budgetsList,
        investments: investmentsList,
      };

      const resp = processGhostQuery(query, ctx);

      const ghostMsg: ChatMessage = {
        id: "g-" + Date.now(),
        sender: "ghost",
        text: resp.text,
        timestamp: new Date(),
        mood: resp.mood,
        dataCard: resp.dataCard,
        suggestedPrompts: resp.suggestedPrompts,
      };

      setMessages((prev) => [...prev, ghostMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    cachedTxRef.current = null;
    cachedBudgetsRef.current = null;
    cachedInvestmentsRef.current = null;
    setMessages(getInitialMessages(userName, userId));
    localStorage.removeItem(storageKey);
  };

  const handleDataCardAction = async (action: GhostDataCardAction) => {
    if (action.type === "quick_create_tx" && action.payload) {
      try {
        setIsTyping(true);
        await api.post("/api/transactions", action.payload);
        invalidateCache.afterTransactionChange();
        window.dispatchEvent(new CustomEvent("refresh-app-data"));
        toast.success("Transaksi berhasil dicatat!");

        cachedTxRef.current = null;
        cachedBudgetsRef.current = null;
        cachedInvestmentsRef.current = null;

        const replyMsg: ChatMessage = {
          id: `action-success-${Date.now()}`,
          sender: "ghost",
          text: `Boo! 👻 Transaksi **${action.payload.description || "Transaksi"}** sebesar **${formatIDR(
            action.payload.amount
          )}** sukses dibukukan! Saldo akunmu otomatis diperbarui.`,
          timestamp: new Date(),
          mood: "happy",
          suggestedPrompts: [
            "Hari ini habis berapa?",
            "Berapa total pengeluaranku?",
            "Bagaimana arus kasku (cash flow)?",
          ],
        };

        setMessages((prev) => {
          const next = [...prev, replyMsg];
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      } catch (err) {
        console.error("Gagal mencatat transaksi via chat:", err);
        toast.error("Gagal mencatat transaksi otomatis");
      } finally {
        setIsTyping(false);
      }
    }
  };

  // Get current active mood of ghost based on last ghost message
  const lastGhostMessage = [...messages].reverse().find((m) => m.sender === "ghost");
  const currentMood: GhostMood = isTyping
    ? "thinking"
    : lastGhostMessage?.mood || "idle";

  return (
    <>
      {/* ========================================================
          1. RIGHT-EDGE FLOATING DOCK (Tab samping di kanan tengah)
          ======================================================== */}
      <div
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center transition-[opacity,transform] duration-200",
          isOpen ? "opacity-0 pointer-events-none translate-x-12" : "opacity-100 translate-x-0"
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Buka Racks Asisten Finansial"
          className={cn(
            "group relative pl-2.5 pr-2 py-3.5 rounded-l-xl flex flex-col items-center justify-center gap-1.5 transition-[background-color,box-shadow,transform] duration-200",
            "bg-card hover:bg-elevated text-foreground border-l border-t border-b border-border",
            "shadow-md hover:shadow-lg",
            "active:scale-95 cursor-pointer select-none"
          )}
        >
          {/* Racks Mascot (Clean, no floating, no aura) */}
          <GhostAvatar mood={currentMood} size="xs" isFloating={false} withAura={false} />

          {/* Vertical Label */}
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground group-hover:text-foreground uppercase [writing-mode:vertical-rl] rotate-180 transition-colors">
            AI CHAT
          </span>

          {/* Solid status dot without glow/ping */}
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        </button>
      </div>

      {/* ========================================================
          2. MOBILE BACKDROP OVERLAY
          ======================================================== */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          3. RIGHT SIDEBAR PANEL
          ======================================================== */}
      <aside
        aria-label="Racks Sidebar"
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 flex flex-col h-screen",
          "bg-card/95 backdrop-blur-md border-l border-border",
          "shadow-2xl",
          "transition-[transform,width] duration-200 ease-out will-change-transform",
          isExpanded
            ? "w-full sm:w-[540px] md:w-[600px]"
            : "w-full sm:w-[420px] md:w-[460px]",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        {/* Header Bar */}
        <div className="px-4 py-3 bg-elevated/50 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <GhostAvatar mood={currentMood} size="xs" withAura={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-foreground">
                  Racks
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-muted text-muted-foreground border border-border">
                  AI ASSISTANT
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Asisten Finansial</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearChat}
              title="Hapus riwayat obrolan"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? "Perkecil sidebar" : "Perlebar sidebar"}
              className="hidden sm:inline-flex p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Tutup sidebar (Esc)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors flex items-center gap-0.5"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <>
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3.5 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1.5",
                      msg.sender === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-end gap-2 max-w-[92%]">
                      {msg.sender === "ghost" && (
                        <GhostAvatar mood={msg.mood || "idle"} size="xs" withAura={false} />
                      )}

                      <div
                        className={cn(
                          "p-3 rounded-2xl leading-relaxed text-xs",
                          msg.sender === "user"
                            ? "bg-accent text-accent-foreground rounded-br-xs shadow-sm font-medium"
                            : "bg-card border border-border/60 text-foreground rounded-bl-xs shadow-xs"
                        )}
                      >
                        {/* Text Message with basic bold rendering */}
                        <div className="space-y-1">
                          {msg.text.split("\n").map((line, idx) => (
                            <p key={idx} className="leading-snug">
                              {line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
                                  return (
                                    <strong key={i} className="font-bold text-foreground">
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return part;
                              })}
                            </p>
                          ))}
                        </div>

                        {/* Interactive Financial Data Card Widget */}
                        {msg.dataCard && (
                          <div className="mt-2.5 pt-2.5 border-t border-border/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                {msg.dataCard.title}
                              </span>
                              {msg.dataCard.statusBadge && (
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    msg.dataCard.statusBadge.isPositive
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                                  )}
                                >
                                  {msg.dataCard.statusBadge.label}
                                </span>
                              )}
                            </div>

                            {msg.dataCard.subtitle && (
                              <p className="text-[10px] text-muted-foreground">
                                {msg.dataCard.subtitle}
                              </p>
                            )}

                            {/* Total Highlight */}
                            {msg.dataCard.formattedTotal && (
                              <div className="p-2 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Total:</span>
                                <span className="text-sm font-black font-mono text-foreground">
                                  {msg.dataCard.formattedTotal}
                                </span>
                              </div>
                            )}

                            {/* Items / Breakdown list */}
                            {msg.dataCard.items && msg.dataCard.items.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                {msg.dataCard.items.map((item, itemIdx) => (
                                  <div
                                    key={itemIdx}
                                    className="p-1.5 rounded-lg bg-card/60 border border-border/30 space-y-1"
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-muted-foreground font-medium truncate max-w-[170px]">
                                        {item.label}
                                      </span>
                                      <span className="font-bold text-foreground font-mono">
                                        {item.formattedValue || item.value}
                                      </span>
                                    </div>

                                    {/* Progress percent bar if available */}
                                    {typeof item.percent === "number" && (
                                      <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-300"
                                          style={{
                                            width: `${Math.min(item.percent, 100)}%`,
                                            backgroundColor: item.color || "#a855f7",
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Pro-tip note from Kiro Ghost */}
                            {msg.dataCard.tip && (
                              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-[10px] text-accent-foreground leading-relaxed flex items-start gap-1.5">
                                <Sparkles size={12} className="shrink-0 mt-0.5 text-accent" />
                                <span>{msg.dataCard.tip}</span>
                              </div>
                            )}

                            {/* Action Button (e.g. 1-click Quick Add Transaction) */}
                            {msg.dataCard.action && (
                              <div className="pt-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleDataCardAction(msg.dataCard!.action!)}
                                  className="w-full text-xs font-semibold h-8 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <Sparkles size={13} />
                                  {msg.dataCard.action.label}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Suggested Quick Prompt Chips under ghost message */}
                    {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-6 pt-1 max-w-[96%]">
                        {msg.suggestedPrompts.map((promptText, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSendMessage(promptText)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-secondary hover:bg-elevated text-foreground/80 hover:text-foreground border border-border/70 transition-all active:scale-95 text-left cursor-pointer"
                          >
                            {promptText}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Ghost Animation Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-muted-foreground text-[11px] pl-1">
                    <GhostAvatar mood="thinking" size="xs" withAura={false} />
                    <span className="italic flex items-center gap-1">
                      Racks sedang memindai catatan...
                      <span className="inline-flex gap-0.5">
                        <span className="w-1 h-1 bg-muted-foreground/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-muted-foreground/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-muted-foreground/70 rounded-full animate-bounce" />
                      </span>
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Suggestion Bar (Above input) - Supports Mouse Wheel, Drag Pan & Scroll Arrows */}
              <div className="relative group/chips border-t border-border/40 bg-card/60 shrink-0 select-none">
                {/* Left Scroll Arrow */}
                <button
                  type="button"
                  onClick={() => scrollChips("left")}
                  title="Geser ke kiri"
                  className="absolute left-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-r from-card via-card/90 to-transparent flex items-center justify-start text-muted-foreground hover:text-foreground cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Geser ke kiri"
                >
                  <ChevronLeft size={13} />
                </button>

                {/* Chips Container */}
                <div
                  ref={chipsRef}
                  onMouseDown={handleChipsMouseDown}
                  onMouseMove={handleChipsMouseMove}
                  onMouseUp={handleChipsMouseUp}
                  onMouseLeave={handleChipsMouseUp}
                  className="px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
                >
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Catat makan siang 35rb dari BCA")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 shrink-0 transition-colors"
                  >
                    ⚡ Catat 35rb
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Cari transaksi Indomaret")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 border border-blue-500/30 shrink-0 transition-colors"
                  >
                    🔍 Cari Indomaret
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Saldo BCA berapa?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 shrink-0 transition-colors"
                  >
                    💳 Saldo BCA
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Boleh beli laptop 10jt gak?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 shrink-0 transition-colors"
                  >
                    🛍️ Boleh Beli Laptop?
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Cek transaksi pajak Coretax")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 shrink-0 transition-colors"
                  >
                    🏛️ Audit Pajak
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Aku lebih boros pas weekend atau weekday?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-pink-200 border border-pink-500/30 shrink-0 transition-colors"
                  >
                    ⚖️ Weekend vs Weekday
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa rasio tabunganku?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 shrink-0 transition-colors"
                  >
                    📊 Saving Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Kapan saya bisa pensiun?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 shrink-0 transition-colors"
                  >
                    🏖️ FIRE Pensiun
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Cek langganan zombie yang jarang kepake")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 border border-violet-500/30 shrink-0 transition-colors"
                  >
                    📺 Langganan Zombie
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa habis buat ongkir & GoFood?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 border border-orange-500/30 shrink-0 transition-colors"
                  >
                    🛵 Ongkir & GoFood
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Transaksi termahal bulan ini apa?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 shrink-0 transition-colors"
                  >
                    💎 Belanja Termahal
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Dapat THR 10jt enaknya diapain?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 shrink-0 transition-colors"
                  >
                    🎁 Alokasi THR
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Kalau hemat 500rb sebulan jadi berapa?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 shrink-0 transition-colors"
                  >
                    🪄 Simulasi Compound
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Strategi lunasi utang cepat")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 shrink-0 transition-colors"
                  >
                    🛡️ Lunasi Utang
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Apakah gaya hidupku naik dibanding bulan lalu?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-pink-200 border border-pink-500/30 shrink-0 transition-colors"
                  >
                    📈 Lifestyle Creep
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Apakah uang kasku aman?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 border border-teal-500/30 shrink-0 transition-colors"
                  >
                    🏦 Bantalan Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Hari ini habis berapa?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 shrink-0 transition-colors"
                  >
                    ☀️ Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa bulan dana daruratku bisa bertahan?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 shrink-0 transition-colors"
                  >
                    🛡️ Dana Darurat
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa proyeksi pengeluaranku akhir bulan?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 shrink-0 transition-colors"
                  >
                    🔮 Proyeksi
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa rata-rata pengeluaranku sehari?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 shrink-0 transition-colors"
                  >
                    ⚡ Burn Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa total pengeluaranku?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-elevated hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 shrink-0 transition-colors"
                  >
                    💸 Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Kondisi keuanganku sehat gak?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 shrink-0 transition-colors"
                  >
                    🩺 Skor Dompet
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Pengeluaran receh apa yang numpuk?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 shrink-0 transition-colors"
                  >
                    ☕ Bocor Halus
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Apakah pembagian gajiku 50/30/20 ideal?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 border border-blue-500/30 shrink-0 transition-colors"
                  >
                    ⚖️ Rasio 50/30/20
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Kapan saya bisa beli motor 20 juta?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 shrink-0 transition-colors"
                  >
                    🎯 Target Impian
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Ada transaksi mencurigakan atau duplikat gak?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 shrink-0 transition-colors"
                  >
                    🕵️ Cek Duplikat
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Kemarin saya habis berapa?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 hover:text-fuchsia-200 border border-fuchsia-500/30 shrink-0 transition-colors"
                  >
                    📅 Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa pengeluaran kopi saya bulan ini?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 shrink-0 transition-colors"
                  >
                    ☕ Kopi
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa pengeluaran makan di luar?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 border border-orange-500/30 shrink-0 transition-colors"
                  >
                    🍔 Makan
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa belanja online bulan ini?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-pink-200 border border-pink-500/30 shrink-0 transition-colors"
                  >
                    🛍️ Belanja
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa ongkos bensin dan transport?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 shrink-0 transition-colors"
                  >
                    🚗 Transport
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa tagihan listrik dan wifi?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 shrink-0 transition-colors"
                  >
                    ⚡ Tagihan
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Kategori apa yang paling boros?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 shrink-0 transition-colors"
                  >
                    🚨 Terboros
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa pemasukanku bulan ini?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 shrink-0 transition-colors"
                  >
                    💰 Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Arus kasku surplus atau defisit?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-sky-500/30 shrink-0 transition-colors"
                  >
                    ⚖️ Arus Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Apa yang bisa kamu lakukan?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 shrink-0 transition-colors"
                  >
                    🔮 Bantuan
                  </button>
                </div>

                {/* Right Scroll Arrow */}
                <button
                  type="button"
                  onClick={() => scrollChips("right")}
                  title="Geser ke kanan"
                  className="absolute right-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-l from-card via-card/90 to-transparent flex items-center justify-end text-muted-foreground hover:text-foreground cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Geser ke kanan"
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-card border-t border-border shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Tanya pengeluaran, pemasukan, atau apa saja..."
                    className="flex-1 bg-muted/40 border border-border focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputQuery.trim()}
                    className="h-8 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0 cursor-pointer disabled:opacity-40 transition-all active:scale-95"
                  >
                    <Send size={13} />
                  </Button>
                </form>
              </div>
            </>
          </aside>
    </>
  );
};
