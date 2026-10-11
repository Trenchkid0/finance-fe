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
    text: `Boo! 👻 Halo **${name || "Sobat"}**! Aku **Racks**, roh asisten finansial pribadimu! Aku melayang di sini untuk mengawasi pengeluaran, pemasukan, dan kesehatan dompetmu. Mau cek kondisi keuanganmu hari ini?`,
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

      // Fetch live transactions if needed for category queries
      const needsTx =
        qLower.includes("kopi") || qLower.includes("coffee") || qLower.includes("ngopi") ||
        qLower.includes("makan") || qLower.includes("food") || qLower.includes("kuliner") ||
        qLower.includes("shopee") || qLower.includes("tokopedia") || qLower.includes("belanja") ||
        qLower.includes("bensin") || qLower.includes("transport") || qLower.includes("gojek") ||
        qLower.includes("listrik") || qLower.includes("tagihan") || qLower.includes("wifi") ||
        qLower.includes("langganan") || qLower.includes("netflix") || qLower.includes("spotify") ||
        qLower.includes("cicilan") || qLower.includes("paylater") || qLower.includes("terbesar") ||
        qLower.includes("sehat") || qLower.includes("skor") || qLower.includes("checkup") ||
        qLower.includes("latte") || qLower.includes("bocor") || qLower.includes("receh") ||
        qLower.includes("target") || qLower.includes("goal") || qLower.includes("50/30/20") ||
        qLower.includes("50 30 20") || qLower.includes("duplikat") || qLower.includes("mencurigakan") ||
        qLower.includes("kemarin") ||
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
        qLower.includes("reksa") ||
        qLower.includes("sehat") ||
        qLower.includes("skor")
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
          1. RIGHT-EDGE FLOATING DOCK (Tab samping di kanan tengah)
          ======================================================== */}
      <div
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center transition-all duration-300",
          isOpen ? "opacity-0 pointer-events-none translate-x-12" : "opacity-100 translate-x-0"
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Buka Racks Asisten Finansial"
          className={cn(
            "group relative pl-2.5 pr-1.5 py-3 rounded-l-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300",
            "bg-gradient-to-b from-slate-950 via-purple-950/90 to-slate-900 border-l border-t border-b border-purple-500/40",
            "shadow-[-4px_4px_20px_rgba(168,85,247,0.35),0_0_12px_rgba(56,189,248,0.15)]",
            "hover:pl-3 hover:border-purple-400 hover:shadow-[-6px_6px_28px_rgba(168,85,247,0.55)]",
            "active:scale-95 cursor-pointer select-none"
          )}
        >
          {/* Inner spectral aura pulsing */}
          <div className="absolute inset-0 rounded-l-2xl bg-gradient-to-b from-purple-500/15 via-cyan-500/20 to-purple-500/15 opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Racks Ghost Mascot */}
          <GhostAvatar mood={currentMood} size="xs" isFloating={true} />

          {/* Vertical Label */}
          <span className="text-[9px] font-black tracking-widest text-purple-300 uppercase [writing-mode:vertical-rl] rotate-180 opacity-90 group-hover:opacity-100">
            RACKS
          </span>

          {/* Glowing spiritual online dot */}
          <span className="flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500 ring-2 ring-slate-950" />
          </span>
        </button>
      </div>

      {/* ========================================================
          2. MOBILE BACKDROP OVERLAY
          ======================================================== */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
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
          "bg-card/98 backdrop-blur-2xl border-l border-purple-500/30",
          "shadow-[-16px_0_50px_rgba(0,0,0,0.65),0_0_35px_rgba(168,85,247,0.18)]",
          "transition-all duration-300 ease-in-out",
          isExpanded
            ? "w-full sm:w-[540px] md:w-[600px]"
            : "w-full sm:w-[420px] md:w-[460px]",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        {/* Top Ghostly Ambient Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-80 shrink-0" />

        {/* Header Bar */}
        <div className="px-4 py-3 bg-elevated/70 border-b border-purple-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <GhostAvatar mood={currentMood} size="xs" withAura={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-foreground">
                  Racks
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  AI ASSISTANT
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                      Racks sedang memindai catatan...
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
          </aside>
    </>
  );
};
