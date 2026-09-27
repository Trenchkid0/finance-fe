import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Check, Users, Receipt, Calculator, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BillItem {
  id: string;
  name: string;
  price: number;
  assignedMemberIds: string[];
}

interface Member {
  id: string;
  name: string;
}

interface SplitBillModalProps {
  open: boolean;
  onClose: () => void;
}

export function SplitBillModal({ open, onClose }: SplitBillModalProps) {
  const [billTitle, setBillTitle] = useState("Makan Bersama");
  const [bankDetails, setBankDetails] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { id: "1", name: "Saya" },
    { id: "2", name: "Budi" },
    { id: "3", name: "Andi" },
  ]);
  const [newMemberName, setNewMemberName] = useState("");
  const [items, setItems] = useState<BillItem[]>([
    { id: "item-1", name: "Nasi Goreng Special", price: 35000, assignedMemberIds: ["1"] },
    { id: "item-2", name: "Es Teh Manis", price: 8000, assignedMemberIds: ["1", "2"] },
    { id: "item-3", name: "Ayam Bakar", price: 42000, assignedMemberIds: ["2", "3"] },
  ]);

  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [servicePercent, setServicePercent] = useState<number>(5);
  const [copied, setCopied] = useState<boolean>(false);

  if (!open) return null;

  const addMember = () => {
    if (!newMemberName.trim()) return;
    setMembers((prev) => [...prev, { id: `m-${Date.now()}`, name: newMemberName.trim() }]);
    setNewMemberName("");
  };

  const removeMember = (id: string) => {
    if (members.length <= 1) {
      toast.error("Minimal harus ada 1 anggota");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        assignedMemberIds: item.assignedMemberIds.filter((mId) => mId !== id),
      }))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: "Pesanan Baru",
        price: 15000,
        assignedMemberIds: members.map((m) => m.id),
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItemMember = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignedMemberIds.includes(memberId);
        const nextIds = exists
          ? item.assignedMemberIds.filter((id) => id !== memberId)
          : [...item.assignedMemberIds, memberId];
        return { ...item, assignedMemberIds: nextIds };
      })
    );
  };

  // Calculations
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);
  const taxAmount = useMemo(() => (subtotal * taxPercent) / 100, [subtotal, taxPercent]);
  const serviceAmount = useMemo(() => (subtotal * servicePercent) / 100, [subtotal, servicePercent]);
  const grandTotal = subtotal + taxAmount + serviceAmount;

  // Breakdown per member
  const memberBreakdowns = useMemo(() => {
    const map: Record<string, { memberName: string; subtotal: number; tax: number; service: number; total: number; itemsList: string[] }> = {};

    members.forEach((m) => {
      map[m.id] = {
        memberName: m.name,
        subtotal: 0,
        tax: 0,
        service: 0,
        total: 0,
        itemsList: [],
      };
    });

    items.forEach((item) => {
      if (item.assignedMemberIds.length === 0) return;
      const splitPrice = item.price / item.assignedMemberIds.length;
      item.assignedMemberIds.forEach((mId) => {
        if (map[mId]) {
          map[mId].subtotal += splitPrice;
          map[mId].itemsList.push(`${item.name} (${formatIDR(splitPrice, { compact: false })})`);
        }
      });
    });

    const taxServiceRate = (taxPercent + servicePercent) / 100;
    Object.keys(map).forEach((mId) => {
      const sub = map[mId].subtotal;
      const extra = sub * taxServiceRate;
      map[mId].tax = (sub * taxPercent) / 100;
      map[mId].service = (sub * servicePercent) / 100;
      map[mId].total = sub + extra;
    });

    return Object.values(map);
  }, [members, items, taxPercent, servicePercent]);

  const generateWASummary = () => {
    let text = `🧾 *RINGKASAN PATUNGAN: ${billTitle}*\n`;
    text += `------------------------------------\n`;
    memberBreakdowns.forEach((mb) => {
      text += `• *${mb.memberName}*: ${formatIDR(mb.total)}\n`;
      text += `   ↳ Subtotal: ${formatIDR(mb.subtotal)} (+Pajak/Service ${taxPercent + servicePercent}%)\n`;
    });
    text += `------------------------------------\n`;
    text += `*Total Tagihan:* ${formatIDR(grandTotal)}\n`;
    if (bankDetails.trim()) {
      text += `\n💳 *Pembayaran via:* ${bankDetails.trim()}\n`;
    }
    text += `\n_Dihitung otomatis via Racks Finance_ 🚀`;
    return text;
  };

  const copyToClipboard = () => {
    const text = generateWASummary();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Ringkasan berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Kalkulator Patungan (Split Bill)</h3>
              <p className="text-xs text-muted-foreground">Hitung bagi tagihan & pajak/service proporsional</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bill Info & Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Nama Acara / Resto</label>
              <Input
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="Contoh: Makan Malam Resto A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Info Rekening Transfer (Opsional)</label>
              <Input
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Contoh: BCA 1234567890 a.n Andi"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users size={14} className="text-accent" /> Anggota Patungan ({members.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-elevated/40 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <span>{m.name}</span>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="text-muted-foreground hover:text-expense ml-1"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-1">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMember())}
                  placeholder="Nama anggota..."
                  className="h-8 text-xs w-32"
                />
                <Button size="sm" onClick={addMember} className="h-8 px-2.5 rounded-lg">
                  <Plus size={13} />
                </Button>
              </div>
            </div>
          </div>

          {/* Items & Assignments */}
          <div className="space-y-3 pt-3 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Receipt size={14} className="text-accent" /> Daftar Pesanan
              </span>
              <Button size="sm" variant="outline" onClick={addItem} className="h-7 text-xs rounded-lg gap-1">
                <Plus size={12} /> Tambah Item
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/50 bg-elevated/20 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, name: e.target.value } : it))
                        )
                      }
                      placeholder="Nama pesanan..."
                      className="h-8 text-xs font-semibold flex-1"
                    />
                    <Input
                      type="number"
                      value={item.price || ""}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, price: Number(e.target.value) } : it))
                        )
                      }
                      placeholder="Harga"
                      className="h-8 text-xs font-mono w-28 text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-expense p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Assignees chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-muted-foreground mr-1">Dipesan oleh:</span>
                    {members.map((m) => {
                      const isAssigned = item.assignedMemberIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleItemMember(item.id, m.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            isAssigned
                              ? "bg-accent/20 text-accent border border-accent/30 font-semibold"
                              : "bg-surface/50 text-muted-foreground hover:text-foreground border border-border/30"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Service Charges */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Pajak / Tax (%)</label>
              <Input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Service Charge (%)</label>
              <Input
                type="number"
                value={servicePercent}
                onChange={(e) => setServicePercent(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Individual Breakdown Result */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <span className="text-xs font-bold text-foreground">Hasil Pembagian Per Anggota</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {memberBreakdowns.map((mb, idx) => (
                <div key={idx} className="rounded-xl border border-accent/20 bg-accent/5 p-3 space-y-1">
                  <span className="text-xs font-bold text-foreground">{mb.memberName}</span>
                  <p className="text-lg font-extrabold font-mono text-accent">{formatIDR(mb.total)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Subtotal {formatIDR(mb.subtotal)} (+Pajak {formatIDR(mb.tax + mb.service)})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-6 py-4 bg-surface/80">
          <div className="text-xs">
            <span className="text-muted-foreground">Total Tagihan: </span>
            <span className="font-extrabold font-mono text-foreground text-sm">{formatIDR(grandTotal)}</span>
          </div>

          <Button onClick={copyToClipboard} className="gap-2 text-xs font-bold bg-accent text-black hover:bg-accent/90">
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? "Tersalin!" : "Salin Ringkasan WA"}</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
