import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Sparkles, X, User as UserIcon, Camera, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { api, normalizeImageUrl } from "@/lib/api";
import { useApp } from "@/components/layout/AppLayout";
import { AvatarCropper } from "./AvatarCropper";
import type { User } from "@/types";

export type EditProfileModalProps = {
	open: boolean;
	onClose: () => void;
	user: User;
	onSuccess?: () => void;
};

export function EditProfileModal({ open, onClose, user, onSuccess }: EditProfileModalProps) {
	const { language } = useLanguage();
	const isId = language === "id";
	const { refresh } = useApp();

	// Form field states
	const [name, setName] = useState(user.name || "");
	const [telegramChatId, setTelegramChatId] = useState(user.telegramChatId || "");
	const [avatarPreview, setAvatarPreview] = useState<string | null>(normalizeImageUrl(user.image) || null);
	
	// Upload & Crop states
	const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
	const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
	
	const [pending, setPending] = useState(false);
	const [uploading, setUploading] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	// Reset form when modal opens
	useEffect(() => {
		if (open) {
			setName(user.name || "");
			setTelegramChatId(user.telegramChatId || "");
			setAvatarPreview(normalizeImageUrl(user.image) || null);
			setSelectedImageSrc(null);
			setCroppedBlob(null);
		}
	}, [open, user]);

	// Esc key + lock body scroll
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

	if (!open) return null;

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			setSelectedImageSrc(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleCropComplete = (blob: Blob, previewUrl: string) => {
		setCroppedBlob(blob);
		setAvatarPreview(previewUrl);
		setSelectedImageSrc(null); // Return to main form
	};

	const uploadAvatar = async (blob: Blob): Promise<string | null> => {
		const formData = new FormData();
		// Save photo as WebP in "avatar" form key
		formData.append("avatar", blob, "avatar.webp");

		try {
			const data = await api.post<{ url: string }>("/api/upload/avatar", formData);
			return data.url;
		} catch (error) {
			console.error("Failed to upload avatar:", error);
			toast.error(isId ? "Gagal mengunggah foto profil" : "Failed to upload profile photo");
			return null;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error(isId ? "Nama lengkap tidak boleh kosong" : "Name cannot be empty");
			return;
		}

		setPending(true);
		try {
			let finalAvatarUrl = normalizeImageUrl(user.image) || "";

			// 1. Upload avatar if changed
			if (croppedBlob) {
				setUploading(true);
				const uploadedUrl = await uploadAvatar(croppedBlob);
				setUploading(false);
				if (!uploadedUrl) {
					setPending(false);
					return;
				}
				finalAvatarUrl = uploadedUrl;
			}

			// 2. Update profile details
			await api.put<User>("/api/auth/me", {
				name: name.trim(),
				telegramChatId: telegramChatId.trim(),
				image: finalAvatarUrl,
			});

			toast.success(isId ? "Profil berhasil diperbarui" : "Profile successfully updated");
			
			// Refresh app context (forces re-fetch of /api/auth/me)
			await refresh();
			
			if (onSuccess) onSuccess();
			onClose();
		} catch (err: any) {
			console.error("Failed to save profile:", err);
			toast.error(err.message || (isId ? "Gagal menyimpan perubahan" : "Failed to save profile"));
		} finally {
			setPending(false);
		}
	};

	const labelCls = "text-xs font-bold text-muted-foreground/70 uppercase tracking-wider";

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget && !selectedImageSrc) onClose();
			}}
		>
			<div
				className="flex max-h-[calc(100dvh-48px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-2xl"
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
							{selectedImageSrc 
								? (isId ? "Atur Foto Profil" : "Adjust Profile Photo")
								: (isId ? "Edit Profil" : "Edit Profile")}
						</h2>
						<p className="mt-0.5 text-[13px] text-muted-foreground/70">
							{selectedImageSrc
								? (isId ? "Geser dan atur perbesaran foto profil Anda." : "Drag and adjust zoom for your profile photo.")
								: (isId ? "Perbarui informasi identitas dan foto akun Anda." : "Update your identity information and account photo.")}
						</p>
					</div>
					{!selectedImageSrc && (
						<button
							type="button"
							onClick={onClose}
							className="-mr-1.5 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-white/[0.06] hover:text-foreground"
							aria-label={isId ? "Tutup" : "Close"}
						>
							<X className="h-[18px] w-[18px]" />
						</button>
					)}
				</div>

				{/* ===== SCROLLABLE BODY ===== */}
				<div className="flex-1 overflow-y-auto px-7 py-6">
					{selectedImageSrc ? (
						<AvatarCropper
							imageSrc={selectedImageSrc}
							onCropComplete={handleCropComplete}
							onCancel={() => setSelectedImageSrc(null)}
						/>
					) : (
						<form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-6">
							{/* Photo Profile Section */}
							<div className="flex flex-col items-center justify-center space-y-3">
								<div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
									<div className="w-24 h-24 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden transition-all group-hover:border-accent">
										{avatarPreview ? (
											<img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full bg-elevated flex items-center justify-center text-text-muted">
												<UserIcon size={32} />
											</div>
										)}
									</div>
									<div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
										<Camera className="w-6 h-6 text-white" />
									</div>
								</div>
								
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									accept="image/png, image/jpeg, image/jpg, image/webp"
									className="hidden"
								/>
								
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="text-xs font-semibold text-accent hover:underline"
								>
									{isId ? "Ubah Foto Profil" : "Change Profile Photo"}
								</button>
							</div>

							{/* Nama Lengkap */}
							<div className="space-y-2.5">
								<Label className={labelCls}>{isId ? "Nama Lengkap" : "Full Name"}</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder={isId ? "Masukkan nama lengkap" : "Enter your full name"}
									className="h-11 border-border bg-white/[0.03]"
									required
								/>
							</div>

							{/* Telegram Chat ID */}
							<div className="space-y-2.5">
								<Label className={labelCls}>Telegram Chat ID</Label>
								<div className="relative">
									<Input
										value={telegramChatId}
										onChange={(e) => setTelegramChatId(e.target.value)}
										placeholder="e.g. 123456789"
										className="h-11 border-border bg-white/[0.03] pl-10"
									/>
									<Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
								</div>
								<p className="text-[11px] text-text-muted leading-normal">
									{isId
										? "Digunakan untuk notifikasi pengingat pembayaran tagihan via Telegram Bot."
										: "Used for recurring bill payment reminder alerts via the Telegram Bot."}
								</p>
							</div>
						</form>
					)}
				</div>

				{/* ===== STICKY FOOTER ===== */}
				{!selectedImageSrc && (
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
							form="profile-edit-form"
							className="h-10 gap-1.5 text-[13px]"
							disabled={pending || uploading}
						>
							{pending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Check className="h-4 w-4" />
							)}
							{isId ? "Simpan" : "Save"}
						</Button>
					</div>
				)}
			</div>
		</div>,
		document.body
	);
}
