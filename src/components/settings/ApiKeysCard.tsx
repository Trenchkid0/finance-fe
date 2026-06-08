"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Copy,
  Inbox,
  KeyRound,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  createApiKey,
  deleteApiKey,
  revokeApiKey,
  type ApiKeyListItem,
} from "@/app/actions/api-keys";
import { formatDate } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/contexts/LanguageContext";
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

interface Props {
  apiKeys: ApiKeyListItem[];
}

/**
 * Manajemen API key untuk akses programatik (bot, integrasi).
 *
 * Plain key SEKALI saja dimunculkan saat baru dibuat, lewat dialog
 * "PlainKeyDialog". Setelah ditutup, hanya prefix yang tersimpan dan
 * tidak bisa dilihat lagi — user wajib salin dulu.
 */
export function ApiKeysCard({ apiKeys }: Props) {
  const { language } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{
    plain: string;
    name: string;
  } | null>(null);

  const activeCount = apiKeys.filter((k) => !k.revokedAt).length;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-foreground flex items-center gap-2">
            <KeyRound size={14} /> {language === "id" ? "Kunci API" : "API Keys"}
          </h2>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={12} /> {language === "id" ? "Buat kunci" : "Create key"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {language === "id"
            ? "Kunci API dipakai untuk akses programatik (mis. bot Telegram, script otomasi). Kirim header "
            : "API keys are used for programmatic access (e.g. Telegram bots, automation scripts). Send the header "}
          <code className="bg-elevated px-1.5 py-0.5 rounded text-foreground font-mono">
            Authorization: Bearer &lt;key&gt;
          </code>{" "}
          {language === "id" ? "ke " : "to "}
          <code className="font-mono">/api/v1/*</code>.{" "}
          {language === "id"
            ? "Kunci hanya ditampilkan sekali — simpan baik-baik setelah dibuat."
            : "The key is only shown once — save it carefully after creation."}
        </p>

        {apiKeys.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={language === "id" ? "Belum ada kunci" : "No keys yet"}
            description={
              language === "id"
                ? "Buat kunci pertama untuk mulai mengintegrasikan bot atau otomasi."
                : "Create your first key to start integrating bots or automation."
            }
            size="sm"
            className="rounded-md border border-dashed border-border bg-elevated"
          />
        ) : (
          <ul className="space-y-2">
            {apiKeys.map((key) => (
              <ApiKeyRow key={key.id} item={key} />
            ))}
          </ul>
        )}

        {activeCount >= 10 ? (
          <p className="text-xs text-warning mt-3">
            {language === "id"
              ? "Sudah ada 10 kunci aktif (batas maksimal). Cabut yang tidak dipakai untuk membuat kunci baru."
              : "There are already 10 active keys (maximum limit). Revoke unused keys to create a new one."}
          </p>
        ) : null}
      </Card>

      <CreateKeyDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(name, plain) => {
          setCreating(false);
          setNewKey({ name, plain });
        }}
      />

      <PlainKeyDialog
        target={newKey}
        onClose={() => setNewKey(null)}
      />
    </>
  );
}

// --- Single row ----------------------------------------------------------

function ApiKeyRow({ item }: { item: ApiKeyListItem }) {
  const { language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] =
    useState<"revoke" | "delete" | null>(null);

  const isRevoked = !!item.revokedAt;

  function handleConfirm() {
    if (!confirmAction) return;
    startTransition(async () => {
      const result =
        confirmAction === "delete"
          ? await deleteApiKey(item.id)
          : await revokeApiKey(item.id);
      if (result.ok) {
        toast.success(
          confirmAction === "delete"
            ? (language === "id" ? "Kunci dihapus" : "Key deleted")
            : (language === "id" ? "Kunci dicabut" : "Key revoked")
        );
        setConfirmAction(null);
      } else {
        toast.error(
          result.error ?? (language === "id" ? "Gagal memproses permintaan." : "Failed to process request.")
        );
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3.5 hover:border-white/[0.12] transition-all duration-200"
      style={{
        borderRadius: 'var(--card-radius)',
        borderWidth: 'var(--card-border-width)',
        borderColor: 'var(--border)',
        backgroundColor: 'color-mix(in srgb, var(--card-bg) calc(var(--card-opacity) * 100%), transparent)',
        backdropFilter: 'var(--card-backdrop-filter)',
        WebkitBackdropFilter: 'var(--card-backdrop-filter)',
      }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">
            {item.name}
          </p>
          {isRevoked ? (
            <Badge variant="outline" className="font-normal">
              {language === "id" ? "Dicabut" : "Revoked"}
            </Badge>
          ) : (
            <Badge variant="income" className="font-normal">
              {language === "id" ? "Aktif" : "Active"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          {item.prefix}…••••••••
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {language === "id" ? "Dibuat" : "Created"} {formatDate(item.createdAt)}
          {item.lastUsedAt
            ? ` · ${language === "id" ? "Terakhir dipakai" : "Last used"} ${formatDate(item.lastUsedAt)}`
            : ` · ${language === "id" ? "Belum pernah dipakai" : "Never used"}`}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isRevoked ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setConfirmAction("revoke")}
            aria-label={language === "id" ? "Cabut kunci" : "Revoke key"}
            title={language === "id" ? "Cabut kunci" : "Revoke key"}
          >
            <XCircle size={14} />
          </Button>
        ) : null}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 hover:text-destructive"
          onClick={() => setConfirmAction("delete")}
          aria-label={language === "id" ? "Hapus kunci" : "Delete key"}
          title={language === "id" ? "Hapus permanen" : "Delete permanently"}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "delete"
                ? (language === "id" ? "Hapus kunci" : "Delete key")
                : (language === "id" ? "Cabut kunci" : "Revoke key")}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "delete"
                ? (language === "id"
                  ? "Kunci akan dihapus permanen dari sistem. Aksi ini tidak bisa dibatalkan."
                  : "The key will be permanently deleted from the system. This action cannot be undone.")
                : (language === "id"
                  ? "Kunci akan langsung tidak valid. Anda bisa menghapusnya sepenuhnya nanti."
                  : "The key will immediately become invalid. You can delete it fully later.")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-foreground">
              <span className="font-medium">{item.name}</span>{" "}
              <span className="text-muted-foreground font-mono">
                ({item.prefix}…)
              </span>
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmAction(null)}
              disabled={pending}
            >
              {language === "id" ? "Batal" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending
                ? (language === "id" ? "Memproses…" : "Processing...")
                : confirmAction === "delete"
                  ? (language === "id" ? "Hapus" : "Delete")
                  : (language === "id" ? "Cabut" : "Revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

// --- Create dialog -------------------------------------------------------

function CreateKeyDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string, plain: string) => void;
}) {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createApiKey(name);
      if (!result.ok) {
        setError(result.fieldErrors?.name?.[0] ?? result.error ?? (language === "id" ? "Gagal membuat kunci." : "Failed to create key."));
        return;
      }
      const created = result.data;
      if (created) {
        toast.success(
          language === "id" ? "Kunci API berhasil dibuat" : "API key created successfully"
        );
        onCreated(name, created.plain);
        reset();
      }
    });
  }

  function handleGenerateName() {
    const randomHex = Math.random().toString(16).substring(2, 6);
    setName(language === "id" ? `bot-keuangan-${randomHex}` : `finance-bot-${randomHex}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === "id" ? "Buat kunci API baru" : "Create new API key"}
          </DialogTitle>
          <DialogDescription>
            {language === "id"
              ? "Beri nama yang membantu Anda mengingat di mana kunci ini dipakai."
              : "Give it a name that helps you remember where this key is used."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="key-name">
                {language === "id" ? "Nama kunci" : "Key name"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === "id" ? "Mis. Telegram bot personal" : "e.g. Personal Telegram bot"}
                  maxLength={64}
                  autoFocus
                  aria-invalid={!!error}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerateName}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  Generate
                </Button>
              </div>
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {language === "id" ? "Buat kunci" : "Create key"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  onClose();
                }}
                disabled={pending}
              >
                {language === "id" ? "Batal" : "Cancel"}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// --- Plain key reveal dialog --------------------------------------------

function PlainKeyDialog({
  target,
  onClose,
}: {
  target: { name: string; plain: string } | null;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.plain);
      setCopied(true);
      toast.success(
        language === "id" ? "Kunci disalin ke clipboard" : "Key copied to clipboard"
      );
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error(
        language === "id"
          ? "Gagal menyalin. Salin manual dari kotak teks."
          : "Failed to copy. Copy manually from the text box."
      );
    }
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(o) => {
        if (!o) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === "id" ? "Salin kunci sekarang" : "Copy key now"}
          </DialogTitle>
          <DialogDescription>
            {language === "id"
              ? "Ini satu-satunya kesempatan untuk menyalin kunci. Setelah dialog ditutup, kunci tidak bisa dilihat lagi."
              : "This is the only opportunity to copy the key. Once closed, you will not be able to see it again."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {target ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {language === "id" ? "Untuk kunci" : "For key"}{" "}
                <span className="text-foreground font-medium">
                  {target.name}
                </span>
                :
              </p>
              <div className="rounded-md border border-border bg-elevated p-3 flex items-start gap-2">
                <code className="text-xs font-mono text-foreground break-all flex-1">
                  {target.plain}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={handleCopy}
                  aria-label={language === "id" ? "Salin kunci" : "Copy key"}
                >
                  {copied ? (
                    <Check size={14} className="text-income" />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "id" ? "Pakai sebagai header" : "Use as header"}{" "}
                <code className="bg-elevated px-1.5 py-0.5 rounded text-foreground font-mono">
                  Authorization: Bearer {target.plain.slice(0, 12)}…
                </code>
              </p>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>
            {language === "id" ? "Saya sudah menyalin" : "I have copied it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
