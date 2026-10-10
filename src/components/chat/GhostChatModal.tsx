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
  type FinancialContext,
} from "@/lib/chat/ghostFinancialEngine";
import { useApp } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { SummaryApiResponse } from "@/types";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

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
    text: `Boo! 👻 Halo **${name || "Sobat"}**! Aku **Kiro Ghost**, roh asisten finansial pribadimu! Aku melayang di sini untuk mengawasi pengeluaran, pemasukan, dan kesehatan dompetmu. Mau cek kondisi keuanganmu hari ini?`,
    timestamp: new Date(),
    mood: "happy",
    suggestedPrompts: [
      "Berapa total pengeluaranku?",
      "Berapa pengeluaran kopi saya bulan ini?",
      "Berapa pemasukanku bulan ini?",
      "Bagaimana arus kasku (cash flow)?",
      "Apa yang bisa kamu lakukan?",
    ],
  },
];

export const GhostChatModal: React.FC = () => {
  const { user, accounts } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Unique key per user (isolated storage for User A, User B, etc.)
  const userId = user?.id || user?.email || "anonymous";
  const userName =
    user?.name?.trim().split(" ")[0] ||
    user?.email?.split("@")?.[0] ||
    "Sobat";
  const storageKey = `kiro_ghost_chat_history_${userId}`;

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
  const [showTooltip, setShowTooltip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const isDraggingChipsRef = useRef(false);
  const startXChipsRef = useRef(0);
  const scrollLeftChipsRef = useRef(0);
  const hasMovedChipsRef = useRef(false);

  // Switch chat history when logged-in user changes (User A -> User B)
  useEffect(() => {
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

  // Save chat to user-specific localStorage key
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Hide initial floating tooltip after 8s
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Convert mouse wheel vertical scroll into horizontal scroll for chips
  useEffect(() => {
    const el = chipsRef.current;
    if (!el || !isOpen || isMinimized) return;

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
  }, [isOpen, isMinimized]);

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

      // Fetch live transactions if needed for category queries
      const needsTx =
        qLower.includes("kopi") || qLower.includes("coffee") || qLower.includes("ngopi") ||
        qLower.includes("makan") || qLower.includes("food") || qLower.includes("kuliner") ||
        qLower.includes("shopee") || qLower.includes("tokopedia") || qLower.includes("belanja") ||
        qLower.includes("bensin") || qLower.includes("transport") || qLower.includes("gojek") ||
        qLower.includes("listrik") || qLower.includes("tagihan") || qLower.includes("wifi") ||
        qLower.includes("langganan") || qLower.includes("netflix") || qLower.includes("spotify") ||
        qLower.includes("cicilan") || qLower.includes("paylater") || qLower.includes("terbesar") ||
        transactionsList.length <= 5;

      if (needsTx) {
        try {
          const res = await api.get<{ transactions: any[] }>(
            "/api/transactions?type=expense&limit=500"
          );
          if (res && res.transactions) {
            transactionsList = res.transactions;
          }
        } catch {
          // fallback to summaryData.recent
        }
      }

      // Fetch budgets if queried
      let budgetsList = undefined;
      if (qLower.includes("budget") || qLower.includes("anggaran")) {
        try {
          budgetsList = await api.get<any[]>("/api/budgets");
        } catch {
          // ignore
        }
      }

      // Fetch investments if queried
      let investmentsList = undefined;
      if (
        qLower.includes("investasi") ||
        qLower.includes("portofolio") ||
        qLower.includes("saham") ||
        qLower.includes("reksa")
      ) {
        try {
          investmentsList = await api.get<any[]>("/api/investments");
        } catch {
          // ignore
        }
      }

      // Small natural delay so user sees Kiro Ghost thinking
      await new Promise((r) => setTimeout(r, 380));

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
    setMessages(getInitialMessages(userName, userId));
    localStorage.removeItem(storageKey);
  };

  // Get current active mood of ghost based on last ghost message
  const lastGhostMessage = [...messages].reverse().find((m) => m.sender === "ghost");
  const currentMood: GhostMood = isTyping
    ? "thinking"
    : lastGhostMessage?.mood || "idle";

  return (
    <>
      {/* ========================================================
          1. FLOATING GHOST LAUNCHER (Kiro Floating Widget)
          ======================================================== */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2.5">
        {/* Floating Speech Bubble Teaser (when closed) */}
        {!isOpen && showTooltip && (
          <div
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-card/95 border border-purple-500/30 text-xs text-foreground shadow-xl shadow-purple-950/30 backdrop-blur-md cursor-pointer hover:border-purple-500/60 transition-all duration-200 animate-in fade-in slide-in-from-right-4 whitespace-nowrap select-none"
          >
            <span className="text-purple-400 font-extrabold shrink-0">Boo!</span>
            <span className="font-semibold text-foreground shrink-0">
              Tanya pengeluaranmu yuk 👻
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-muted-foreground hover:text-foreground ml-1 p-0.5 rounded-full hover:bg-muted/50 transition-colors shrink-0 flex items-center justify-center"
              aria-label="Tutup balon teks"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Floating Mascot Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsMinimized(false);
            setShowTooltip(false);
          }}
          aria-label="Kiro Ghost Chatbot"
          className={cn(
            "group relative p-2.5 rounded-2xl flex items-center justify-center transition-all duration-300",
            "bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-900 border border-purple-500/40",
            "shadow-[0_4px_24px_rgba(168,85,247,0.35),0_0_12px_rgba(56,189,248,0.2)]",
            "hover:border-purple-400 hover:shadow-[0_4px_32px_rgba(168,85,247,0.55),0_0_20px_rgba(56,189,248,0.35)]",
            "active:scale-95 cursor-pointer"
          )}
        >
          {/* Inner spectral aura pulsing */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 via-cyan-500/15 to-purple-500/10 opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Kiro Ghost Mascot */}
          <GhostAvatar mood={currentMood} size="sm" isFloating={true} />

          {/* Glowing spiritual online dot */}
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 ring-2 ring-slate-950" />
          </span>
        </button>
      </div>

      {/* ========================================================
          2. CHAT MODAL / DOCKED WINDOW
          ======================================================== */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 flex flex-col transition-all duration-200 overflow-hidden",
            "bg-card/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl",
            "shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_35px_rgba(168,85,247,0.22)]",
            // Responsive positioning & size
            isMinimized
              ? "bottom-20 right-4 md:bottom-20 md:right-6 w-72 h-14"
              : "bottom-4 right-4 md:bottom-20 md:right-6 w-[94vw] sm:w-[420px] h-[580px] max-h-[86vh]"
          )}
        >
          {/* Top Ghostly Ambient Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-80" />

          {/* Header Bar */}
          <div className="p-3.5 bg-elevated/70 border-b border-purple-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <GhostAvatar mood={currentMood} size="xs" withAura={false} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-foreground">
                    Kiro Ghost
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    AI SPIRIT
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Siap audit keuangan</span>
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
                onClick={() => setIsMinimized((prev) => !prev)}
                title={isMinimized ? "Perbesar" : "Perkecil"}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup asisten"
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Main Body (Only when not minimized) */}
          {!isMinimized && (
            <>
              {/* Scrollable Messages Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3.5 text-xs">
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
                            : "bg-elevated/90 border border-purple-500/20 text-foreground rounded-bl-xs shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
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
                              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 leading-relaxed flex items-start gap-1.5">
                                <Sparkles size={12} className="shrink-0 mt-0.5 text-purple-400" />
                                <span>{msg.dataCard.tip}</span>
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
                            className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-all active:scale-95 text-left cursor-pointer"
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
                      Kiro Ghost sedang memindai catatan...
                      <span className="inline-flex gap-0.5">
                        <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
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
                    onClick={() => !hasMovedChipsRef.current && handleSendMessage("Berapa total pengeluaranku?")}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-elevated hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 shrink-0 transition-colors"
                  >
                    💸 Pengeluaran
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
              <div className="p-3 bg-elevated/80 border-t border-purple-500/20 shrink-0">
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
                    className="flex-1 bg-card border border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputQuery.trim()}
                    className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    <Send size={13} />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
