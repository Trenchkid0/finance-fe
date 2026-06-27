export interface AssetHolding {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  type: "stock" | "mutual_fund" | "bond" | "crypto" | "gold" | "p2p" | "property";
  account?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}
