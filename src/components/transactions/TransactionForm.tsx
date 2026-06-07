"use client";

import { useActionState, useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
	ArrowLeftRight,
	Check,
	Loader2,
	ScanLine,
	Sparkles,
	TrendingDown,
	TrendingUp,
	Upload,
	X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils/cn";
import { formatInputRupiah } from "@/lib/utils/formatters";
import { useLanguage } from "@/lib/contexts/LanguageContext";

import {
	createTransaction,
	updateTransaction,
} from "@/app/actions/transactions";
import { scanTransactionText } from "@/app/actions/ai";
import type { ActionResult } from "@/types";
import type { TransactionTypeInput } from "@/lib/utils/validators";

const TESSERACT_CDN = "https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js";
const FORM_ID = "transaction-modal-form";

export type AccountOption = { id: string; name: string };
export type CategoryOption = {
	id: string;
	name: string;
	type: "income" | "expense";
	icon: string | null;
};

export type TransactionFormInitial = {
	id?: string;
	type: TransactionTypeInput;
	accountId: string;
	categoryId: string | null;
	transferToId: string | null;
	amount: number;
	date: string; // YYYY-MM-DD
	description: string;
	note: string;
};

export type TransactionModalProps = {
	open: boolean;
	onClose: () => void;
	mode: "create" | "edit";
	initial: TransactionFormInitial;
	accounts: AccountOption[];
	categories: CategoryOption[];
	aiScanEnabled?: boolean;
	onSuccess?: () => void;
};

export function TransactionForm({
	open,
	onClose,
	mode,
	initial,
	accounts,
	categories,
	aiScanEnabled = false,
	onSuccess,
}: TransactionModalProps) {
	const { language } = useLanguage();
	const isId = language === "id";

	// ---- state field ----
	const [type, setType] = useState<TransactionTypeInput>(initial.type);
	const [amount, setAmount] = useState(
		initial.amount ? formatInputRupiah(String(initial.amount)) : "",
	);
	const [date, setDate] = useState(initial.date);
	const [accountId, setAccountId] = useState(initial.accountId);
	const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId);
	const [transferToId, setTransferToId] = useState<string | null>(
		initial.transferToId,
	);
	const [description, setDescription] = useState(initial.description);
	const [note, setNote] = useState(initial.note);

	const [tab, setTab] = useState<"manual" | "scan">("manual");
	const [scanning, setScanning] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// ---- server action (signature asli) ----
	// create: (prev, formData) ; update: (id, prev, formData) → bind id
	const boundAction = useMemo(
		() =>
			mode === "edit" && initial.id
				? updateTransaction.bind(null, initial.id)
				: createTransaction,
		[mode, initial.id],
	);

	const [state, formAction, pending] = useActionState<
		ActionResult<null> | undefined,
		FormData
	>(boundAction, undefined);

	// reset tiap modal dibuka (pola GoalModal)
	useEffect(() => {
		if (!open) return;
		setType(initial.type);
		setAmount(initial.amount ? formatInputRupiah(String(initial.amount)) : "");
		setDate(initial.date);
		setAccountId(initial.accountId);
		setCategoryId(initial.categoryId);
		setTransferToId(initial.transferToId);
		setDescription(initial.description);
		setNote(initial.note);
		setTab("manual");
		setScanning(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	// sukses → toast + tutup
	useEffect(() => {
		if (!state?.ok) return;
		toast.success(
			mode === "create"
				? isId
					? "Transaksi ditambahkan"
					: "Transaction added"
				: isId
					? "Transaksi diperbarui"
					: "Transaction updated",
		);
		onSuccess?.();
		onClose();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

	// Esc + lock scroll (pola GoalModal)
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [open, onClose]);

	const filteredCategories = useMemo(
		() =>
			categories.filter((c) =>
				type === "income" ? c.type === "income" : c.type === "expense",
			),
		[categories, type],
	);

	const fieldErrors = (state?.fieldErrors ?? {}) as Record<string, string[]>;

	// ---- Scan AI (OCR + parse) ----
	const handleScanFile = async (file: File) => {
    setScanning(true);
    try {
      // @ts-expect-error - dimuat dari CDN
      if (!window.Tesseract) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = TESSERACT_CDN;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Tesseract load failed"));
          document.body.appendChild(s);
        });
      }
      // @ts-expect-error - global Tesseract dari CDN
      const { data } = await window.Tesseract.recognize(file, "ind+eng");
      const text: string = data?.text ?? "";

      const result = await scanTransactionText(text);

      if (result.ok) {
        // result menyempit ke { ok: true; candidate: AIScanCandidate }
        const c = result.candidate;
        setType(c.type);
        if (typeof c.amount === "number") setAmount(formatInputRupiah(String(c.amount)));
        if (c.date) setDate(c.date);
        if (c.description) setDescription(c.description);
        if (c.accountId && accounts.some((a) => a.id === c.accountId)) setAccountId(c.accountId);
        if (c.transferToId) setTransferToId(c.transferToId);
        if (c.categoryId) setCategoryId(c.categoryId);
        setTab("manual");
        toast.success(isId ? "Struk berhasil dibaca" : "Receipt scanned");
      } else if ("error" in result) {
        toast.error(result.error || (isId ? "Gagal membaca struk" : "Couldn't read the receipt"));
      } else {
        toast.error(isId ? "Gagal membaca struk" : "Couldn't read the receipt");
      }
    } catch {
      toast.error(isId ? "Pemindaian gagal" : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

	if (!open) return null;

	const typeOptions: {
		value: TransactionTypeInput;
		label: string;
		icon: typeof TrendingUp;
		activeClass: string;
	}[] = [
		{
			value: "expense" as TransactionTypeInput,
			label: isId ? "Pengeluaran" : "Expense",
			icon: TrendingDown,
			activeClass: "data-[state=on]:bg-expense/15 data-[state=on]:text-expense",
		},
		{
			value: "income" as TransactionTypeInput,
			label: isId ? "Pemasukan" : "Income",
			icon: TrendingUp,
			activeClass: "data-[state=on]:bg-income/15 data-[state=on]:text-income",
		},
		{
			value: "transfer" as TransactionTypeInput,
			label: "Transfer",
			icon: ArrowLeftRight,
			activeClass: "data-[state=on]:bg-accent/15 data-[state=on]:text-accent",
		},
	];

	const labelCls =
		"text-xs font-bold text-muted-foreground/70 uppercase tracking-wider";

	const fields = (
		<div className="space-y-[18px]">
			{/* Tipe */}
			<div className="space-y-2.5">
				<Label className={labelCls}>{isId ? "Tipe" : "Type"}</Label>
				<ToggleGroup
					type="single"
					value={type}
					onValueChange={(v) => v && setType(v as TransactionTypeInput)}
					className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 h-11"
				>
					{typeOptions.map((opt) => {
						const Icon = opt.icon;
						return (
							<ToggleGroupItem
								key={opt.value}
								value={opt.value}
								className={cn(
									"rounded-lg text-xs font-bold transition-all duration-200 h-9 text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 data-[state=on]:border data-[state=on]:font-extrabold",
									opt.value === "expense" && "data-[state=on]:border-expense/20",
									opt.value === "income" && "data-[state=on]:border-income/20",
									opt.value === "transfer" && "data-[state=on]:border-accent/20",
									opt.activeClass,
								)}
							>
								<Icon className="h-3.5 w-3.5" />
								{opt.label}
							</ToggleGroupItem>
						);
					})}
				</ToggleGroup>
			</div>

			{/* Jumlah + Tanggal */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2.5">
					<Label className={labelCls}>{isId ? "Jumlah" : "Amount"}</Label>
					<div className="relative">
						<span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">
							Rp
						</span>
						<Input
							inputMode="numeric"
							value={amount}
							onChange={(e) => setAmount(formatInputRupiah(e.target.value))}
							placeholder="0"
							className="h-11 pl-10 font-mono font-semibold"
						/>
					</div>
					{fieldErrors.amount?.[0] ? <ErrText msg={fieldErrors.amount[0]} /> : null}
				</div>
				<div className="space-y-2.5">
					<Label className={labelCls}>{isId ? "Tanggal" : "Date"}</Label>
					<Input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="h-11"
					/>
				</div>
			</div>

			{/* Akun + (Kategori / Transfer ke) */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2.5">
					<Label className={labelCls}>
						{type === "transfer"
							? isId
								? "Dari Akun"
								: "From Account"
							: isId
								? "Akun"
								: "Account"}
					</Label>
					<Select value={accountId} onValueChange={setAccountId}>
						<SelectTrigger className="h-11">
							<SelectValue placeholder={isId ? "Pilih akun" : "Select account"} />
						</SelectTrigger>
						<SelectContent>
							{accounts.map((a) => (
								<SelectItem key={a.id} value={a.id}>
									{a.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{type === "transfer" ? (
					<div className="space-y-2.5">
						<Label className={labelCls}>{isId ? "Ke Akun" : "To Account"}</Label>
						<Select
							value={transferToId ?? ""}
							onValueChange={(v) => setTransferToId(v)}
						>
							<SelectTrigger className="h-11">
								<SelectValue placeholder={isId ? "Pilih akun" : "Select account"} />
							</SelectTrigger>
							<SelectContent>
								{accounts
									.filter((a) => a.id !== accountId)
									.map((a) => (
										<SelectItem key={a.id} value={a.id}>
											{a.name}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>
				) : (
					<div className="space-y-2.5">
						<Label className={labelCls}>{isId ? "Kategori" : "Category"}</Label>
						<Select
							value={categoryId ?? ""}
							onValueChange={(v) => setCategoryId(v)}
						>
							<SelectTrigger className="h-11">
								<SelectValue placeholder={isId ? "Pilih kategori" : "Select category"} />
							</SelectTrigger>
							<SelectContent>
								{filteredCategories.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.icon ? `${c.icon} ` : ""}
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Deskripsi */}
			<div className="space-y-2.5">
				<Label className={labelCls}>{isId ? "Deskripsi" : "Description"}</Label>
				<Input
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder={isId ? "mis. Makan siang" : "e.g. Lunch"}
					className="h-11"
				/>
			</div>

			{/* Catatan */}
			<div className="space-y-2.5">
				<Label className={labelCls}>
					{isId ? "Catatan (opsional)" : "Note (optional)"}
				</Label>
				<Textarea
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder={isId ? "Tambahkan catatan…" : "Add a note…"}
					className="min-h-[70px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
				/>
			</div>
		</div>
	);

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				className="flex max-h-[calc(100dvh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl"
				role="dialog"
				aria-modal="true"
			>
				{/* ===== STICKY HEADER ===== */}
				<div className="flex items-start gap-4 border-b border-border px-7 py-5">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white shadow-lg">
						<Sparkles className="h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1">
						<h2 className="text-[17px] font-semibold leading-tight text-foreground">
							{mode === "create"
								? isId
									? "Tambah Transaksi"
									: "Add Transaction"
								: isId
									? "Edit Transaksi"
									: "Edit Transaction"}
						</h2>
						<p className="mt-0.5 text-[13px] text-muted-foreground/70">
							{isId
								? "Catat pemasukan, pengeluaran, atau transfer."
								: "Record an income, expense, or transfer."}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="-mr-1.5 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-white/[0.06] hover:text-foreground"
						aria-label={isId ? "Tutup" : "Close"}
					>
						<X className="h-[18px] w-[18px]" />
					</button>
				</div>

				{/* ===== SCROLLABLE BODY ===== */}
				<div className="flex-1 overflow-y-auto px-7 py-6">
					{mode === "create" && aiScanEnabled ? (
						<Tabs
							value={tab}
							onValueChange={(v) => setTab(v as "manual" | "scan")}
							className="w-full"
						>
							<TabsList className="mb-5 grid w-full grid-cols-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 h-11">
								<TabsTrigger
									value="manual"
									className="rounded-lg text-xs font-bold transition-all duration-200 h-9 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border data-[state=active]:border-accent/20 data-[state=active]:font-extrabold text-muted-foreground hover:text-foreground"
								>
									Manual
								</TabsTrigger>
								<TabsTrigger
									value="scan"
									className="rounded-lg text-xs font-bold transition-all duration-200 h-9 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border data-[state=active]:border-accent/20 data-[state=active]:font-extrabold text-muted-foreground hover:text-foreground gap-1.5"
								>
									<ScanLine className="h-3.5 w-3.5" />
									{isId ? "Scan AI" : "AI Scan"}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="manual" className="mt-0">
								{fields}
							</TabsContent>

							<TabsContent value="scan" className="mt-0">
								<div
									className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-10 text-center"
									onClick={() => !scanning && fileInputRef.current?.click()}
									role="button"
								>
									{scanning ? (
										<>
											<Loader2 className="mb-3 h-7 w-7 animate-spin text-accent" />
											<p className="text-sm text-muted-foreground">
												{isId ? "Membaca struk…" : "Reading receipt…"}
											</p>
										</>
									) : (
										<>
											<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
												<Upload className="h-6 w-6" />
											</div>
											<p className="text-sm font-medium text-foreground">
												{isId ? "Unggah foto struk" : "Upload a receipt photo"}
											</p>
											<p className="mt-1 text-xs text-muted-foreground/70">
												{isId
													? "AI akan mengisi form otomatis"
													: "AI will fill the form for you"}
											</p>
											<Badge variant="secondary" className="mt-3 gap-1">
												<Sparkles className="h-3 w-3" /> AI
											</Badge>
										</>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => {
											const f = e.target.files?.[0];
											if (f) handleScanFile(f);
											e.target.value = "";
										}}
									/>
								</div>
							</TabsContent>
						</Tabs>
					) : (
						fields
					)}

					{/* form asli yang di-submit; tombolnya di footer via form="" */}
					<form id={FORM_ID} action={formAction} className="hidden">
						<input type="hidden" name="type" value={type} />
						<input type="hidden" name="amount" value={amount} />
						<input type="hidden" name="date" value={date} />
						<input type="hidden" name="accountId" value={accountId} />
						<input
							type="hidden"
							name="categoryId"
							value={type === "transfer" ? "" : categoryId ?? ""}
						/>
						<input
							type="hidden"
							name="transferToId"
							value={type === "transfer" ? transferToId ?? "" : ""}
						/>
						<input type="hidden" name="description" value={description} />
						<input type="hidden" name="note" value={note} />
					</form>

					{state && !state.ok && state.error ? (
						<div className="mt-4">
							<ErrText msg={state.error} />
						</div>
					) : null}
				</div>

				{/* ===== STICKY FOOTER ===== */}
				<div className="flex items-center justify-end gap-3 border-t border-border px-7 py-5">
					<Button
						type="button"
						variant="ghost"
						onClick={onClose}
						className="h-10 text-[13px]"
						disabled={pending}
					>
						{isId ? "Batal" : "Cancel"}
					</Button>
					<Button
						type="submit"
						form={FORM_ID}
						className="h-10 gap-1.5 text-[13px]"
						disabled={pending || scanning}
					>
						{pending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Check className="h-4 w-4" />
						)}
						{mode === "create"
							? isId
								? "Simpan"
								: "Save"
							: isId
								? "Perbarui"
								: "Update"}
					</Button>
				</div>
			</div>
		</div>,
		document.body,
	);
}

function ErrText({ msg }: { msg: string }) {
	return (
		<p className="flex items-center gap-1.5 text-xs text-destructive">
			<span className="h-1.5 w-1.5 rounded-full bg-destructive" />
			{msg}
		</p>
	);
}