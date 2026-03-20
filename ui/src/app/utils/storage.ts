import type { AIPrompt, FxRateSnapshot, HoldingInsights, MarketType, NewsItem, Portfolio, PriceData, QuoteSnapshot, SecuritySearchItem, Stock, User } from '../types';

const API_PREFIX = '/api/v1';
const KEYS = {
  CURRENT_USER: 'current_user',
};

type ApiUser = {
  id: number;
  name: string;
  birth_date: string;
  email?: string | null;
};

type ApiPortfolio = {
  id: number;
  user_id: number;
  name: string;
  portfolio_type: 'dividend' | 'general';
  description?: string | null;
  base_currency?: string;
  monthly_budget?: number | string | null;
  target_weight?: number | string | null;
  created_at?: string | null;
  stock_count?: number | string;
  total_value?: number | string;
  pnl?: number | string;
  pnl_percent?: number | string;
};

type ApiHolding = {
  id: number;
  portfolio_id: number;
  symbol: string;
  name: string;
  quantity: number | string;
  avg_price: number | string;
  current_price?: number | string;
  market?: string;
  currency?: string;
  created_at: string;
  price_as_of?: string | null;
};

type ApiPrompt = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  portfolio_id?: number | null;
  created_at: string;
  updated_at: string;
};


type ApiSecuritySearchItem = {
  symbol: string;
  name: string;
  market: string;
  exchange_name?: string | null;
  currency?: string | null;
  type?: string | null;
};
type ApiFxRateSnapshot = {
  base_currency: string;
  quote_currency: string;
  rate: number | string;
  as_of: string;
  source?: string | null;
};

type ApiQuoteSnapshot = {
  symbol: string;
  market: string;
  price: number | string;
  currency: string;
  as_of: string;
  stock_name?: string | null;
  exchange_name?: string | null;
  change?: number | string | null;
  change_percent?: number | string | null;
  open_price?: number | string | null;
  high_price?: number | string | null;
  low_price?: number | string | null;
  volume?: number | string | null;
  market_cap?: number | string | null;
  fifty_two_week_high?: number | string | null;
  fifty_two_week_low?: number | string | null;
  per?: number | string | null;
  pbr?: number | string | null;
  source?: string | null;
};

type ApiHoldingInsights = {
  latest_price: {
    price: number | string;
    currency: string;
    as_of: string;
  } | null;
  earnings_events: Array<{
    id: number;
    event_type: string;
    event_date: string;
    source?: string | null;
  }>;
  news_headlines: Array<{
    id: number;
    headline: string;
    url: string;
    source?: string | null;
    published_at: string;
  }>;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = typeof errorBody.detail === 'string' ? errorBody.detail : 'Request failed';
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapUser(dto: ApiUser): User {
  return {
    id: String(dto.id),
    name: dto.name,
    birthDate: dto.birth_date,
    email: dto.email ?? undefined,
  };
}

function mapPortfolio(dto: ApiPortfolio): Portfolio {
  return {
    id: String(dto.id),
    userId: String(dto.user_id),
    name: dto.name,
    type: dto.portfolio_type,
    description: dto.description ?? undefined,
    createdAt: dto.created_at ?? undefined,
    baseCurrency: dto.base_currency ?? 'KRW',
    monthlyBudget: dto.monthly_budget === null || dto.monthly_budget === undefined ? null : toNumber(dto.monthly_budget),
    targetWeight: dto.target_weight === null || dto.target_weight === undefined ? null : toNumber(dto.target_weight),
    stockCount: toNumber(dto.stock_count),
    totalValue: toNumber(dto.total_value),
    profit: toNumber(dto.pnl),
    profitRate: toNumber(dto.pnl_percent),
  };
}

function mapStock(dto: ApiHolding): Stock {
  return {
    id: String(dto.id),
    portfolioId: String(dto.portfolio_id),
    symbol: dto.symbol,
    name: dto.name,
    quantity: toNumber(dto.quantity),
    purchasePrice: toNumber(dto.avg_price),
    currentPrice: toNumber(dto.current_price ?? dto.avg_price),
    addedAt: dto.created_at,
    market: dto.market ?? 'KR',
    currency: dto.currency ?? 'KRW',
    priceAsOf: dto.price_as_of ?? undefined,
  };
}

function mapPrompt(dto: ApiPrompt): AIPrompt {
  return {
    id: String(dto.id),
    userId: String(dto.user_id),
    title: dto.title,
    content: dto.content,
    portfolioId: dto.portfolio_id ? String(dto.portfolio_id) : undefined,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}


function mapSecuritySearchItem(dto: ApiSecuritySearchItem): SecuritySearchItem {
  return {
    symbol: dto.symbol,
    name: dto.name,
    market: dto.market,
    exchangeName: dto.exchange_name ?? undefined,
    currency: dto.currency ?? undefined,
    type: dto.type ?? undefined,
  };
}
function mapFxRate(dto: ApiFxRateSnapshot): FxRateSnapshot {
  return {
    baseCurrency: dto.base_currency,
    quoteCurrency: dto.quote_currency,
    rate: toNumber(dto.rate),
    asOf: dto.as_of,
    source: dto.source ?? undefined,
  };
}

function mapQuote(dto: ApiQuoteSnapshot): QuoteSnapshot {
  return {
    symbol: dto.symbol,
    market: dto.market,
    price: toNumber(dto.price),
    currency: dto.currency,
    asOf: dto.as_of,
    stockName: dto.stock_name ?? undefined,
    exchangeName: dto.exchange_name ?? undefined,
    change: toOptionalNumber(dto.change),
    changePercent: toOptionalNumber(dto.change_percent),
    openPrice: toOptionalNumber(dto.open_price),
    highPrice: toOptionalNumber(dto.high_price),
    lowPrice: toOptionalNumber(dto.low_price),
    volume: toOptionalNumber(dto.volume),
    marketCap: toOptionalNumber(dto.market_cap),
    fiftyTwoWeekHigh: toOptionalNumber(dto.fifty_two_week_high),
    fiftyTwoWeekLow: toOptionalNumber(dto.fifty_two_week_low),
    per: toOptionalNumber(dto.per),
    pbr: toOptionalNumber(dto.pbr),
    source: dto.source ?? undefined,
  };
}

export const saveCurrentUser = (user: User) => {
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const clearCurrentUser = () => {
  localStorage.removeItem(KEYS.CURRENT_USER);
};

export const getUsers = async (): Promise<User[]> => {
  const users = await api<ApiUser[]>('/users');
  return users.map(mapUser);
};

export const saveUser = async (user: Pick<User, 'name' | 'birthDate' | 'email'>): Promise<User> => {
  const created = await api<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: user.name,
      birth_date: user.birthDate,
      email: user.email,
    }),
  });
  return mapUser(created);
};

export const findUser = async (name: string, birthDate: string): Promise<User | undefined> => {
  try {
    const user = await api<ApiUser>('/users/enter', {
      method: 'POST',
      body: JSON.stringify({ name, birth_date: birthDate }),
    });
    return mapUser(user);
  } catch {
    return undefined;
  }
};

export const getPortfolios = async (userId?: string): Promise<Portfolio[]> => {
  if (!userId) return [];
  const portfolios = await api<ApiPortfolio[]>(`/users/${userId}/portfolios`);
  return portfolios.map(mapPortfolio);
};

export const savePortfolio = async (portfolio: Portfolio): Promise<Portfolio> => {
  const method = portfolio.id ? 'PUT' : 'POST';
  const path = portfolio.id
    ? `/users/${portfolio.userId}/portfolios/${portfolio.id}`
    : `/users/${portfolio.userId}/portfolios`;
  const saved = await api<ApiPortfolio>(path, {
    method,
    body: JSON.stringify({
      name: portfolio.name,
      portfolio_type: portfolio.type,
      description: portfolio.description,
      base_currency: portfolio.baseCurrency ?? 'KRW',
      monthly_budget: portfolio.monthlyBudget,
      target_weight: portfolio.targetWeight,
    }),
  });
  return mapPortfolio(saved);
};

export const deletePortfolio = async (portfolioId: string) => {
  const user = getCurrentUser();
  if (!user) return;
  await api<void>(`/users/${user.id}/portfolios/${portfolioId}`, { method: 'DELETE' });
};

export const getPortfolioById = async (portfolioId: string): Promise<Portfolio | undefined> => {
  const user = getCurrentUser();
  if (!user) return undefined;
  const portfolio = await api<ApiPortfolio>(`/users/${user.id}/portfolios/${portfolioId}`);
  return mapPortfolio(portfolio);
};

export const getStocks = async (portfolioId?: string): Promise<Stock[]> => {
  const user = getCurrentUser();
  if (!user) return [];
  const suffix = portfolioId ? `?portfolio_id=${portfolioId}` : '';
  const stocks = await api<ApiHolding[]>(`/users/${user.id}/holdings${suffix}`);
  return stocks.map(mapStock);
};

export const saveStock = async (stock: Stock): Promise<Stock> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Current user is missing');
  }

  const method = stock.id ? 'PUT' : 'POST';
  const path = stock.id
    ? `/users/${user.id}/holdings/${stock.id}`
    : `/users/${user.id}/holdings`;
  const saved = await api<ApiHolding>(path, {
    method,
    body: JSON.stringify({
      portfolio_id: Number(stock.portfolioId),
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market ?? 'KR',
      currency: stock.currency ?? (stock.market === 'US' ? 'USD' : 'KRW'),
      quantity: stock.quantity,
      avg_price: stock.purchasePrice,
      current_price: stock.currentPrice,
    }),
  });
  return mapStock(saved);
};


export const searchSecurities = async (
  query: string,
  market: MarketType | 'ALL' = 'ALL',
  limit = 10
): Promise<SecuritySearchItem[]> => {
  const params = new URLSearchParams({ q: query, market, limit: String(limit) });
  const items = await api<ApiSecuritySearchItem[]>(`/securities/search?${params.toString()}`);
  return items.map(mapSecuritySearchItem);
};
export const fetchFxRate = async (baseCurrency: string, quoteCurrency: string): Promise<FxRateSnapshot> => {
  const params = new URLSearchParams({ base_currency: baseCurrency, quote_currency: quoteCurrency });
  const snapshot = await api<ApiFxRateSnapshot>(`/quotes/fx-rate?${params.toString()}`);
  return mapFxRate(snapshot);
};

export const fetchQuote = async (symbol: string, market: string): Promise<QuoteSnapshot> => {
  const params = new URLSearchParams({ symbol, market });
  const quote = await api<ApiQuoteSnapshot>(`/quotes?${params.toString()}`);
  return mapQuote(quote);
};

export const deleteStock = async (stockId: string) => {
  const user = getCurrentUser();
  if (!user) return;
  await api<void>(`/users/${user.id}/holdings/${stockId}`, { method: 'DELETE' });
};

export const getStockById = async (stockId: string): Promise<Stock | undefined> => {
  const user = getCurrentUser();
  if (!user) return undefined;
  const stocks = await api<ApiHolding[]>(`/users/${user.id}/holdings`);
  const stock = stocks.find((item) => String(item.id) === stockId);
  return stock ? mapStock(stock) : undefined;
};

export const getPrompts = async (userId?: string): Promise<AIPrompt[]> => {
  if (!userId) return [];
  const prompts = await api<ApiPrompt[]>(`/users/${userId}/prompts`);
  return prompts.map(mapPrompt);
};

export const savePrompt = async (prompt: AIPrompt): Promise<AIPrompt> => {
  const method = prompt.id ? 'PUT' : 'POST';
  const path = prompt.id
    ? `/users/${prompt.userId}/prompts/${prompt.id}`
    : `/users/${prompt.userId}/prompts`;
  const saved = await api<ApiPrompt>(path, {
    method,
    body: JSON.stringify({
      title: prompt.title,
      content: prompt.content,
      portfolio_id: prompt.portfolioId ? Number(prompt.portfolioId) : null,
    }),
  });
  return mapPrompt(saved);
};

export const deletePrompt = async (promptId: string) => {
  const user = getCurrentUser();
  if (!user) return;
  await api<void>(`/users/${user.id}/prompts/${promptId}`, { method: 'DELETE' });
};

export const getHoldingInsights = async (stockId: string): Promise<HoldingInsights> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Current user is missing');
  }
  const data = await api<ApiHoldingInsights>(`/users/${user.id}/holdings/${stockId}/insights`);
  return {
    latestPrice: data.latest_price ? toNumber(data.latest_price.price) : null,
    latestPriceCurrency: data.latest_price?.currency,
    latestPriceAsOf: data.latest_price?.as_of,
    earningsEvents: data.earnings_events.map((event) => ({
      id: String(event.id),
      eventType: event.event_type,
      eventDate: event.event_date,
      source: event.source ?? undefined,
    })),
    news: data.news_headlines.map((item) => ({
      id: String(item.id),
      title: item.headline,
      summary: item.source ?? '',
      source: item.source ?? 'unknown',
      publishedAt: item.published_at,
      url: item.url,
    } satisfies NewsItem)),
  };
};

export const refreshHoldingInsights = async (stockId: string) => {
  const user = getCurrentUser();
  if (!user) return;
  await api(`/users/${user.id}/holdings/${stockId}/refresh`, { method: 'POST' });
};

export const getPriceHistory = async (stockId: string): Promise<PriceData[]> => {
  const user = getCurrentUser();
  if (!user) return [];
  const history = await api<Array<{ date: string; price: number | string; volume: number | string }>>(
    `/users/${user.id}/holdings/${stockId}/price-history`
  );
  return history.map((item) => ({
    date: item.date,
    price: toNumber(item.price),
    volume: toNumber(item.volume),
  }));
};

export const generateId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;




