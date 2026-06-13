export interface AssetHolding {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}
