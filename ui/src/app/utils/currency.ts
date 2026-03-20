import type { Stock } from '../types';

export const DEFAULT_USD_KRW_RATE = 1300;

export function getUsdKrwRate(rate?: number | null): number {
  return rate && Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_KRW_RATE;
}

export function isUsdStock(stock: Pick<Stock, 'market' | 'currency'>): boolean {
  return stock.market === 'US' || stock.currency === 'USD';
}

export function toKrwAmount(amount: number, currency: string | undefined, usdKrwRate?: number | null): number {
  if (currency === 'USD') {
    return amount * getUsdKrwRate(usdKrwRate);
  }

  return amount;
}

export function formatKrw(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}\uC6D0`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrimaryAmount(amount: number, currency: string | undefined): string {
  return currency === 'USD' ? formatUsd(amount) : formatKrw(amount);
}

export function getStockCost(stock: Stock): number {
  return stock.purchasePrice * stock.quantity;
}

export function getStockValue(stock: Stock): number {
  return stock.currentPrice * stock.quantity;
}

export function getStockProfit(stock: Stock): number {
  return getStockValue(stock) - getStockCost(stock);
}

export function getStockKrwCost(stock: Stock, usdKrwRate?: number | null): number {
  return toKrwAmount(getStockCost(stock), stock.currency, usdKrwRate);
}

export function getStockKrwValue(stock: Stock, usdKrwRate?: number | null): number {
  return toKrwAmount(getStockValue(stock), stock.currency, usdKrwRate);
}

export function getStockKrwProfit(stock: Stock, usdKrwRate?: number | null): number {
  return getStockKrwValue(stock, usdKrwRate) - getStockKrwCost(stock, usdKrwRate);
}
