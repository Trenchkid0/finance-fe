export interface MarketItem {
  symbol: string;
  name: string;
  category: "indo_stock" | "world_stock" | "currency";
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  highDay: number;
  lowDay: number;
  high52w: number;
  low52w: number;
  cagr1y?: number;
  maxDrawdown?: number;
  expenseRatio?: number;
  avgYield?: number;
  totalAum?: string;
  sparkline: number[];
  logoUrl: string;
  updatedAt: string;
}

export interface MutualFundItem {
  symbol: string;
  name: string;
  fundType: string; // "Pasar Uang" | "Saham" | "Pendapatan Tetap"
  manager: string;
  price: number; // NAB per Unit
  currency: string;
  change: number;
  changePercent: number;
  cagr1y: number;
  maxDrawdown: number;
  expenseRatio: number;
  avgYield: number;
  totalAum: string;
  sparkline: number[];
  logoUrl: string;
  updatedAt: string;
}

export interface GoldWeightPrice {
  weight: number;
  unit: string;
  sellPrice: number;
}

export interface GoldData {
  antamPrice1g: number;
  antamBuyback1g: number;
  pegadaianPrice1g: number;
  date: string;
  change1g: number;
  changePercent1g: number;
  cagr1y?: number;
  maxDrawdown?: number;
  antamDenoms: GoldWeightPrice[];
  pegadaianDenoms: GoldWeightPrice[];
  updatedAt: string;
}

export interface ChartDataPoint {
  date: string;
  price: number;
}

export interface AssetDetailResponse {
  symbol: string;
  name: string;
  category: "gold" | "mutual_fund" | "indo_stock" | "world_stock" | "currency";
  currentPrice: number;
  currency: string;
  change: number;
  changePercent: number;
  cagr1y: number;
  maxDrawdown: number;
  expenseRatio: number;
  avgYield: number;
  totalAum: string;
  highDay: number;
  lowDay: number;
  high52w: number;
  low52w: number;
  series: ChartDataPoint[];
  range: string;
  logoUrl: string;
  description: string;
}

export interface MarketOverviewData {
  gold: GoldData;
  mutualFunds: MutualFundItem[];
  stocksIndo: MarketItem[];
  stocksWorld: MarketItem[];
  currencies: MarketItem[];
  lastRefreshed: string;
}
