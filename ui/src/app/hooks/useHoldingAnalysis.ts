import { useEffect, useState } from 'react';
import type { NewsItem, PriceData, QuoteSnapshot, Stock } from '../types';
import { fetchQuote, getHoldingInsights, getPriceHistory, refreshHoldingInsights } from '../utils/storage';

export function useHoldingAnalysis(initialStock: Stock | null) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(initialStock);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [quote, setQuote] = useState<QuoteSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedStock(initialStock);
  }, [initialStock]);

  useEffect(() => {
    const loadInsights = async () => {
      if (!selectedStock) {
        setNews([]);
        setPriceData([]);
        setQuote(null);
        setError('');
        return;
      }

      try {
        await refreshHoldingInsights(selectedStock.id);
        const [insights, history, fetchedQuote] = await Promise.all([
          getHoldingInsights(selectedStock.id),
          getPriceHistory(selectedStock.id),
          fetchQuote(selectedStock.symbol, selectedStock.market ?? 'KR'),
        ]);

        setNews(insights.news);
        setPriceData(history);
        setQuote(fetchedQuote);

        if (insights.latestPrice !== null) {
          setSelectedStock((current) =>
            current ? { ...current, currentPrice: insights.latestPrice ?? current.currentPrice } : current
          );
        }

        setError('');
      } catch (err) {
        setQuote(null);
        setError(
          err instanceof Error ? err.message : '\uC885\uBAA9 \uBD84\uC11D \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'
        );
      }
    };

    void loadInsights();
  }, [selectedStock?.id]);

  return {
    selectedStock,
    setSelectedStock,
    news,
    priceData,
    quote,
    error,
  };
}
