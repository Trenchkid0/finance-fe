import { api } from "@/lib/api";

export interface AIScanCandidate {
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string | null;
  description: string | null;
  accountId: string | null;
  transferToId: string | null;
  categoryId: string | null;
  confidence: number;
  reasoning: string | null;
}

export type AIScanResult =
  | { ok: true; candidate: AIScanCandidate }
  | { ok: false; error: string };

export async function scanTransactionText(rawInput: string): Promise<AIScanResult> {
  try {
    const res = await api.post<any>("/api/ai/scan", { text: rawInput });
    if (!res.ok) {
      return { ok: false, error: res.error || "Gagal memindai teks." };
    }
    return { ok: true, candidate: res.candidate };
  } catch (err: any) {
    return { ok: false, error: err.message || "Gagal memproses AI scan." };
  }
}
