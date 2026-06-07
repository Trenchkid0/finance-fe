"use client";

import { useActionState, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Inbox, Key, Loader2, Plus, Shapes, Shield, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";
import { createCategory, deleteCategory } from "@/app/actions/categories";
import type { ActionResult } from "@/types";
import type { CategoryTypeInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApiKeysCard } from "./ApiKeysCard";
import type { ApiKeyListItem } from "@/app/actions/api-keys";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface CategoryItem {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  isDefault: boolean;
}

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
  } | null;
  categories: CategoryItem[];
  apiKeys: ApiKeyListItem[];
}

const PRESET_EMOJIS = [
  "🍔", "🚗", "🎮", "💡", "💰", "📈", "🛍️", "🏠",
  "🍕", "🏥", "📚", "✈️", "👔", "🎁", "☕",
];

type Tab = "categories" | "api";

export function SettingsClient({ user, categories, apiKeys }: Props) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CategoryItem | null>(null);
  const [type, setType] = useState<CategoryTypeInput>("expense");
  const [selectedEmoji, setSelectedEmoji] = useState(PRESET_EMOJIS[0]);

  const [state, formAction, pending] = useActionState<
    ActionResult<null> | undefined,
    FormData
  >(async (prev, formData) => {
    const result = await createCategory(prev, formData);
    if (result.ok) {
      toast.success(
        language === "id"
          ? "Kategori kustom berhasil ditambahkan"
          : "Custom category added successfully"
      );
      setCreating(false);
    } else if (result.error) {
      toast.error(result.error);
    }
    return result;
  }, undefined);

  const customCategories = categories.filter((c) => !c.isDefault);
  const defaultCategories = categories.filter((c) => c.isDefault);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "categories", label: language === "id" ? "Kategori" : "Categories", icon: <Shapes size={14} /> },
    { id: "api", label: language === "id" ? "API & Integrasi" : "API & Integrations", icon: <Key size={14} /> },
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

      {/* Profile Section — always visible */}
      <Card className="p-5">
        <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
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

        {/* Tab: Kategori */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-medium text-foreground flex items-center gap-2">
                    <Shield size={14} className="text-muted-foreground" />
                    {language === "id" ? "Pengelolaan kategori" : "Category management"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "id"
                      ? "Kategori default disediakan sistem. Tambahkan kategori kustom sendiri."
                      : "Default categories are system provided. Add your own custom categories."}
                  </p>
                </div>
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus size={12} /> {language === "id" ? "Tambah" : "Add"}
                </Button>
              </div>

              {/* Custom categories */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {language === "id" ? "Kategori kustom" : "Custom categories"} ({customCategories.length})
                </h3>
                {customCategories.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title={language === "id" ? "Belum ada kategori kustom" : "No custom categories yet"}
                    description={
                      language === "id"
                        ? "Klik tombol Tambah untuk membuat kategori sendiri."
                        : "Click the Add button to create your own category."
                    }
                    size="sm"
                    className="rounded-md border border-dashed border-border bg-elevated"
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {customCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span aria-hidden>{cat.icon ?? "📂"}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {cat.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {cat.type === "expense"
                                ? (language === "id" ? "Pengeluaran" : "Expense")
                                : (language === "id" ? "Pemasukan" : "Income")}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setConfirmDelete(cat)}
                          className="h-7 w-7 hover:text-destructive"
                          aria-label={language === "id" ? `Hapus ${cat.name}` : `Delete ${cat.name}`}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Default categories — collapsible */}
              <div className="mt-6">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="group flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      <ChevronDown
                        size={12}
                        className="transition-transform duration-200 -rotate-90 group-data-[state=open]:rotate-0"
                      />
                      {language === "id" ? "Kategori sistem" : "System categories"} ({defaultCategories.length})
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                      {defaultCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-3 flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <span aria-hidden>{cat.icon ?? "📂"}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground truncate">
                              {cat.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {cat.type === "expense"
                                ? (language === "id" ? "Pengeluaran" : "Expense")
                                : (language === "id" ? "Pemasukan" : "Income")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </Card>
          </div>
        )}

        {/* Tab: API & Integrasi */}
        {activeTab === "api" && (
          <ApiKeysCard apiKeys={apiKeys} />
        )}
      </div>

      {/* Add category modal */}
      {creating && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreating(false);
          }}
        >
          <div
            className="flex max-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl animate-fade-in-up"
            role="dialog"
            aria-modal="true"
          >
            {/* ===== STICKY HEADER ===== */}
            <div className="flex items-start gap-4 border-b border-border px-7 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg animate-pulse-subtle">
                <Shapes className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-semibold leading-tight text-foreground">
                  {language === "id" ? "Tambah Kategori Baru" : "Add New Category"}
                </h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground/70">
                  {language === "id"
                    ? "Buat kategori kustom untuk mengelompokkan transaksi Anda."
                    : "Create a custom category to organize your transactions."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="-mr-1.5 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-white/[0.06] hover:text-foreground"
                aria-label={language === "id" ? "Tutup" : "Close"}
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <form action={formAction} className="flex flex-1 flex-col overflow-hidden" noValidate>
              {/* ===== SCROLLABLE BODY ===== */}
              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                    {language === "id" ? "Tipe Kategori" : "Category Type"}
                  </Label>
                  <ToggleGroup
                    type="single"
                    value={type}
                    onValueChange={(v) => v && setType(v as CategoryTypeInput)}
                    className="grid grid-cols-2 w-full"
                    aria-label={language === "id" ? "Tipe kategori" : "Category type"}
                  >
                    <ToggleGroupItem value="expense">
                      {language === "id" ? "Pengeluaran" : "Expense"}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="income">
                      {language === "id" ? "Pemasukan" : "Income"}
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <input type="hidden" name="type" value={type} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                    {language === "id" ? "Nama Kategori" : "Category Name"}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder={language === "id" ? "Mis. Makanan, Hadiah" : "e.g. Food, Gifts"}
                    aria-invalid={!!state?.fieldErrors?.name}
                  />
                  {state?.fieldErrors?.name?.[0] ? (
                    <p className="text-xs text-destructive">
                      {state.fieldErrors.name[0]}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="icon" className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                    {language === "id" ? "Ikon" : "Icon"}
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="icon"
                      name="icon"
                      value={selectedEmoji}
                      onChange={(e) => setSelectedEmoji(e.target.value)}
                      maxLength={2}
                      className="w-12 h-12 text-center text-lg p-0 flex items-center justify-center leading-none"
                    />
                    <span className="text-xs text-muted-foreground self-center">
                      {language === "id"
                        ? "Pilih preset di bawah atau ketik emoji."
                        : "Select preset below or type emoji."}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`w-8 h-8 rounded-md bg-elevated border flex items-center justify-center hover:bg-background transition-colors ${
                          selectedEmoji === emoji
                            ? "border-primary"
                            : "border-border"
                        }`}
                        aria-label={`Pilih emoji ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {state?.error && !state.fieldErrors ? (
                  <p className="text-xs text-destructive">{state.error}</p>
                ) : null}
              </div>

              {/* ===== FOOTER ACTIONS ===== */}
              <div className="flex items-center gap-3 border-t border-border px-7 py-4">
                <Button type="submit" disabled={pending} className="h-10 flex-1 gap-2 text-xs font-semibold px-4">
                  {pending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                  {language === "id" ? "Tambah kategori" : "Add category"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCreating(false)}
                  disabled={pending}
                  className="h-10 rounded-xl px-5 text-xs font-semibold"
                >
                  {language === "id" ? "Batal" : "Cancel"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation */}
      <ConfirmDelete
        target={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function ConfirmDelete({
  target,
  onClose,
}: {
  target: CategoryItem | null;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (!target) return;
    startTransition(async () => {
      const result = await deleteCategory(target.id);
      if (result.ok) {
        toast.success(
          language === "id" ? "Kategori berhasil dihapus" : "Category deleted successfully"
        );
        onClose();
      } else {
        toast.error(
          result.error ?? (language === "id" ? "Gagal menghapus kategori" : "Failed to delete category")
        );
      }
    });
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === "id" ? "Hapus kategori" : "Delete category"}
          </DialogTitle>
          <DialogDescription>
            {language === "id"
              ? "Transaksi yang menggunakan kategori ini akan dikosongkan kategorinya (data transaksi tetap aman)."
              : "Transactions using this category will have their category cleared (transaction data remains safe)."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-foreground">
            {language === "id" ? "Apakah Anda yakin ingin menghapus " : "Are you sure you want to delete "}
            <span className="font-medium">&quot;{target?.name}&quot;</span>?
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {language === "id" ? "Batal" : "Cancel"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending
              ? (language === "id" ? "Menghapus…" : "Deleting...")
              : (language === "id" ? "Hapus" : "Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
