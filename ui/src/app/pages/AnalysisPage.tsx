import { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Info, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStocks } from '../utils/storage';
import type { Stock } from '../types';
import { METRIC_HELP } from '../constants/analysis';
import { useHoldingAnalysis } from '../hooks/useHoldingAnalysis';
import { formatMarketCap, formatMetric } from '../utils/formatters';

export function AnalysisPage() {
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [initialStock, setInitialStock] = useState<Stock | null>(null);
  const [stocksError, setStocksError] = useState('');
  const {
    news,
    priceData,
    quote,
    error: analysisError,
    selectedStock,
    setSelectedStock,
  } = useHoldingAnalysis(initialStock);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await getStocks();
        setAllStocks(stocks);
        setInitialStock((current) => current ?? stocks[0] ?? null);
        setStocksError('');
      } catch (err) {
        setStocksError(err instanceof Error ? err.message : '종목 목록을 불러오지 못했습니다.');
      }
    };

    void loadStocks();
  }, []);

  if (allStocks.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">등록된 종목이 없습니다</h3>
        <p className="text-gray-600">포트폴리오에서 종목을 먼저 추가해 주세요</p>
      </div>
    );
  }

  const error = stocksError || analysisError;
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">종목 분석</h1>
        <p className="text-gray-600">보유 중인 종목의 가격 흐름, 뉴스, 참고 지표를 확인해 보세요</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 p-4">
              <h2 className="font-semibold text-gray-900">종목 선택</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {allStocks.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                    selectedStock?.id === stock.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{stock.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{stock.symbol}</div>
                  <div className="mt-2 text-sm font-medium text-gray-900">{stock.currentPrice.toLocaleString()}원</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {selectedStock && (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStock.name}</h2>
                    <p className="text-gray-600">{selectedStock.symbol}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{selectedStock.currentPrice.toLocaleString()}원</div>
                    <div className={`text-lg font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                      {isProfitable ? '+' : ''}{profit.toLocaleString()}원 ({isProfitable ? '+' : ''}{profitRate.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                  <div>
                    <div className="mb-1 text-sm text-gray-600">보유 수량</div>
                    <div className="font-semibold text-gray-900">{selectedStock.quantity.toLocaleString()}주</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">평균 단가</div>
                    <div className="font-semibold text-gray-900">{selectedStock.purchasePrice.toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-gray-600">평가 금액</div>
                    <div className="font-semibold text-gray-900">
                      {(selectedStock.currentPrice * selectedStock.quantity).toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>

              {quote && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">기본 참고 지표</h3>
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400" />
                          <div className="pointer-events-none absolute left-0 top-6 z-10 hidden w-80 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-600 shadow-lg group-hover:block">
                            {METRIC_HELP.map((item) => (
                              <p key={item.label} className="mb-2 last:mb-0">
                                <span className="font-semibold text-gray-900">{item.label}</span>
                                {' '}
                                {item.description}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{quote.exchangeName ?? quote.market} · {quote.asOf}</p>
                    </div>
                    <div className={`text-right text-sm font-medium ${(quote.change ?? 0) >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {(quote.change ?? 0) >= 0 ? '+' : ''}{formatMetric(quote.change, ` ${quote.currency}`)}
                      {' '}
                      ({(quote.changePercent ?? 0) >= 0 ? '+' : ''}{formatMetric(quote.changePercent, '%')})
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                    시가총액은 너무 긴 숫자 대신 읽기 쉬운 단위로 요약해 보여줍니다. 자세한 값이 필요하면 브라우저 기본 툴팁에서 원래 숫자를 확인할 수 있습니다.
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-sm text-gray-500">거래량</div>
                      <div className="font-medium text-gray-900">{formatMetric(quote.volume)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">52주 최고</div>
                      <div className="font-medium text-gray-900">{formatMetric(quote.fiftyTwoWeekHigh, ` ${quote.currency}`)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">52주 최저</div>
                      <div className="font-medium text-gray-900">{formatMetric(quote.fiftyTwoWeekLow, ` ${quote.currency}`)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">시가총액</div>
                      <div
                        className="font-medium text-gray-900"
                        title={quote.marketCap ? `${quote.marketCap.toLocaleString()} ${quote.currency}` : undefined}
                      >
                        {formatMarketCap(quote.marketCap, quote.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">시가</div>
                      <div className="font-medium text-gray-900">{formatMetric(quote.openPrice, ` ${quote.currency}`)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">고가</div>
                      <div className="font-medium text-gray-900">{formatMetric(quote.highPrice, ` ${quote.currency}`)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">저가</div>
                      <div className="font-medium text-gray-900">{formatMetric(quote.lowPrice, ` ${quote.currency}`)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">PER / PBR</div>
                      <div className="font-medium text-gray-900">{formatMetric(quote.per)} / {formatMetric(quote.pbr)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">가격 추이 (30일)</h3>
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

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">관련 뉴스</h3>
                <div className="space-y-4">
                  {news.length ? news.map((item) => (
                    <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="mb-1 font-medium text-gray-900">{item.title}</h4>
                          {item.summary && <p className="mb-2 text-sm text-gray-600">{item.summary}</p>}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{item.source}</span>
                            <span>·</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.publishedAt).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                        <a
                          href={item.url}
                          className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
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
