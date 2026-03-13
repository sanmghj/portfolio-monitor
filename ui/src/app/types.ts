export interface User {
  id: string;
  name: string;
  birthDate: string;
  email?: string;
}

export type PortfolioType = 'dividend' | 'general';

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  type: PortfolioType;
  description?: string;
  createdAt?: string;
  baseCurrency?: string;
  monthlyBudget?: number | null;
  targetWeight?: number | null;
  stockCount?: number;
  totalValue?: number;
  profit?: number;
  profitRate?: number;
}

export interface Stock {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  addedAt: string;
  market?: string;
  currency?: string;
  priceAsOf?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
}

export interface PriceData {
  date: string;
  price: number;
  volume: number;
}

export interface AIPrompt {
  id: string;
  userId: string;
  title: string;
  content: string;
  portfolioId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingInsights {
  latestPrice: number | null;
  latestPriceCurrency?: string;
  latestPriceAsOf?: string;
  earningsEvents: Array<{
    id: string;
    eventType: string;
    eventDate: string;
    source?: string;
  }>;
  news: NewsItem[];
}
