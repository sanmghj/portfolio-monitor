import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStocks, getHoldingInsights, getPriceHistory, refreshHoldingInsights } from '../utils/storage';
import type { Stock, NewsItem, PriceData } from '../types';

export function AnalysisPage() {
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await getStocks();
        setAllStocks(stocks);
        if (stocks.length > 0) {
          setSelectedStock((current) => current ?? stocks[0]);
        }
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : '분석용 종목을 불러오지 못했습니다.');
      }
    };

    void loadStocks();
  }, []);

  useEffect(() => {
    const loadInsights = async () => {
      if (!selectedStock) return;

      try {
        await refreshHoldingInsights(selectedStock.id);
        const [insights, history] = await Promise.all([
          getHoldingInsights(selectedStock.id),
          getPriceHistory(selectedStock.id),
        ]);
        setNews(insights.news);
        setPriceData(history);
        if (insights.latestPrice !== null) {
          setSelectedStock((current) =>
            current ? { ...current, currentPrice: insights.latestPrice ?? current.currentPrice } : current
          );
        }
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : '종목 분석 데이터를 불러오지 못했습니다.');
      }
    };

    void loadInsights();
  }, [selectedStock?.id]);

  if (allStocks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">분석할 종목이 없습니다</h3>
        <p className="text-gray-600">포트폴리오에 종목을 먼저 추가해 주세요</p>
      </div>
    );
  }

  const profit = selectedStock
    ? (selectedStock.currentPrice - selectedStock.purchasePrice) * selectedStock.quantity
    : 0;
  const profitRate = selectedStock && selectedStock.purchasePrice > 0
    ? ((selectedStock.currentPrice - selectedStock.purchasePrice) / selectedStock.purchasePrice) * 100
    : 0;
  const isProfitable = profit >= 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">종목 분석</h1>
        <p className="text-gray-600">보유 종목의 뉴스와 가격 흐름을 확인해 보세요</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">보유 종목</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {allStocks.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedStock?.id === stock.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{stock.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{stock.symbol}</div>
                  <div className="text-sm font-medium text-gray-900 mt-2">
                    {stock.currentPrice.toLocaleString()}원
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedStock && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStock.name}</h2>
                    <p className="text-gray-600">{selectedStock.symbol}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {selectedStock.currentPrice.toLocaleString()}원
                    </div>
                    <div className={`text-lg font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                      {isProfitable ? '+' : ''}{profit.toLocaleString()}원({isProfitable ? '+' : ''}{profitRate.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">보유 수량</div>
                    <div className="font-semibold text-gray-900">{selectedStock.quantity.toLocaleString()}주</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">매입가</div>
                    <div className="font-semibold text-gray-900">{selectedStock.purchasePrice.toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">평가 금액</div>
                    <div className="font-semibold text-gray-900">
                      {(selectedStock.currentPrice * selectedStock.quantity).toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">가격 추이 (30일)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()}원`, '가격']}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('ko-KR')}
                    />
                    <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 뉴스</h3>
                <div className="space-y-4">
                  {news.length ? news.map((item) => (
                    <div key={item.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                          {item.summary && <p className="text-sm text-gray-600 mb-2">{item.summary}</p>}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{item.source}</span>
                            <span>?</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.publishedAt).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                        <a
                          href={item.url}
                          className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-600">표시할 뉴스가 없습니다.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
