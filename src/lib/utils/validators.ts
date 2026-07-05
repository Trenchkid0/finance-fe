/**
 * Zod schemas for form & Server Action input validation.
 * AGENTS.md §5.4.
 */
import { z } from "zod";

// --- Bilingual helpers ----------------------------------------------------

/** Read current language from localStorage (set by LanguageContext). */
function isId(): boolean {
  if (typeof window === "undefined") return true;
  return (localStorage.getItem("app-language") || "id") === "id";
}

/** Return a message based on current language. */
function msg(id: string, en: string): string {
  return isId() ? id : en;
}

// --- Reusable primitives -------------------------------------------------

/** Positive monetary amount in IDR (whole rupiah). */
export const moneyAmount = z
  .number({ invalid_type_error: msg("Jumlah harus berupa angka", "Amount must be a number") })
  .positive(msg("Jumlah harus lebih besar dari nol", "Amount must be greater than zero"))
  .finite();

/** Non-empty trimmed string. */
export const requiredString = (labelId: string, labelEn: string) =>
  z
    .string()
    .trim()
    .min(1, msg(`${labelId} wajib diisi`, `${labelEn} is required`));

// --- Auth ----------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().email(msg("Format email tidak valid", "Invalid email format")),
  password: z.string().min(1, msg("Kata sandi wajib diisi", "Password is required")),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, msg("Nama minimal 2 karakter", "Name must be at least 2 characters")).max(80),
  email: z.string().trim().email(msg("Format email tidak valid", "Invalid email format")),
  password: z.string().min(8, msg("Kata sandi minimal 8 karakter", "Password must be at least 8 characters")).max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(msg("Format email tidak valid", "Invalid email format")),
  oldPassword: z.string().min(1, msg("Kata sandi lama wajib diisi", "Old password is required")),
  password: z.string().min(8, msg("Kata sandi baru minimal 8 karakter", "Password must be at least 8 characters")).max(72),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, msg("Token wajib diisi", "Token is required")),
  email: z.string().trim().email(msg("Format email tidak valid", "Invalid email format")),
  password: z.string().min(8, msg("Kata sandi minimal 8 karakter", "Password must be at least 8 characters")).max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// --- Transactions --------------------------------------------------------

export const transactionTypeEnum = z.enum(["income", "expense", "transfer"]);
export type TransactionTypeInput = z.infer<typeof transactionTypeEnum>;

const transactionFields = z.object({
  type: transactionTypeEnum,
  accountId: requiredString("Akun sumber", "Source account"),
  amount: z.coerce
    .number({ invalid_type_error: msg("Jumlah harus berupa angka", "Amount must be a number") })
    .positive(msg("Jumlah harus lebih dari 0", "Amount must be greater than 0"))
    .finite()
    .max(999_999_999_999, msg("Jumlah terlalu besar", "Amount is too large")),
  /** ISO date string from `<input type="date">`. Coerced to local-noon Date in the action. */
  date: z.coerce.date({ invalid_type_error: msg("Tanggal tidak valid", "Invalid date") }),
  description: z.string().trim().max(200).optional(),
  note: z.string().trim().max(2000).optional(),
  categoryId: z.string().trim().optional(),
  transferToId: z.string().trim().optional(),
  taxDeductible: z.boolean().optional(),
});

/**
 * Cross-field rules:
 *  - Transfer must specify a destination account, distinct from the source.
 *  - Income / expense must specify a category.
 */
function applyCrossFieldRules(data: z.infer<typeof transactionFields>, ctx: z.RefinementCtx) {
  if (data.type === "transfer") {
    if (!data.transferToId) {
      ctx.addIssue({
        code: "custom",
        path: ["transferToId"],
        message: msg("Akun tujuan wajib dipilih", "Destination account is required"),
      });
    } else if (data.transferToId === data.accountId) {
      ctx.addIssue({
        code: "custom",
        path: ["transferToId"],
        message: msg("Akun tujuan harus berbeda dari akun sumber", "Destination account must differ from source account"),
      });
    }
  } else {
    if (!data.categoryId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: msg("Kategori wajib dipilih", "Category is required"),
      });
    }
  }
}

export const createTransactionSchema = transactionFields.superRefine(applyCrossFieldRules);
export const updateTransactionSchema = transactionFields.superRefine(applyCrossFieldRules);

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// --- Accounts ------------------------------------------------------------

export const accountTypeEnum = z.enum(["bank", "wallet", "cash", "investment"]);
export type AccountTypeInput = z.infer<typeof accountTypeEnum>;

const accountFields = z.object({
  name: requiredString("Nama akun", "Account name").max(80),
  type: accountTypeEnum,
  /** Optional hex color; UI picks from a curated swatch list. */
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, msg("Format warna tidak valid", "Invalid color format"))
    .optional(),
  /** Single emoji or short token used as the account avatar. */
  icon: z.string().trim().max(8).optional(),
});

export const createAccountSchema = accountFields.extend({
  /** Saldo awal — nol dibolehkan, negatif tidak. Hanya berlaku saat create. */
  startingBalance: z.coerce
    .number({ invalid_type_error: msg("Saldo harus berupa angka", "Balance must be a number") })
    .min(0, msg("Saldo awal tidak boleh negatif", "Starting balance cannot be negative"))
    .max(999_999_999_999, msg("Saldo terlalu besar", "Balance is too large"))
    .default(0),
});

/** Update saldo juga bisa dilakukan lewat edit form. */
export const updateAccountSchema = accountFields.extend({
  /** Toggle aktif/nonaktif lewat form edit. */
  isActive: z.coerce.boolean().optional(),
  balance: z.coerce
    .number({ invalid_type_error: msg("Saldo harus berupa angka", "Balance must be a number") })
    .max(999_999_999_999, msg("Saldo terlalu besar", "Balance is too large"))
    .default(0),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// --- Categories ---------------------------------------------------------

export const categoryTypeEnum = z.enum(["income", "expense"]);
export type CategoryTypeInput = z.infer<typeof categoryTypeEnum>;

export const createCategorySchema = z.object({
  name: requiredString("Nama kategori", "Category name"),
  type: categoryTypeEnum,
  icon: z.string().trim().max(10).optional().or(z.literal("")),
  taxDeductible: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
