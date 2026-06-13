import { api } from "@/lib/api";

export interface AIScanCandidate {
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string | null;
  description: string | null;
  note: string | null;
  accountId: string | null;
  transferToId: string | null;
  categoryId: string | null;
  confidence: number;
  reasoning: string | null;
}

export type AIScanResult =
  | { ok: true; candidate: AIScanCandidate }
  | { ok: false; error: string };

interface AIScanApiResponse {
  ok: boolean;
  candidate?: AIScanCandidate;
  error?: string;
}

export async function scanTransactionText(rawInput: string): Promise<AIScanResult> {
  try {
    const res = await api.post<AIScanApiResponse>("/api/ai/scan", { text: rawInput });
    if (!res.ok) {
      return { ok: false, error: res.error || "Gagal memindai teks." };
    }
    if (!res.candidate) {
      return { ok: false, error: "Gagal memproses AI scan." };
    }
    return { ok: true, candidate: res.candidate };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses AI scan.";
    return { ok: false, error: msg };
  }
}
