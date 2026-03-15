import { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Info, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchQuote, getHoldingInsights, getPriceHistory, refreshHoldingInsights } from '../utils/storage';
import type { NewsItem, PriceData, QuoteSnapshot, Stock } from '../types';

const METRIC_HELP = [
  { label: '거래량', description: '해당 기간 동안 거래된 주식 수량입니다. 거래가 얼마나 활발한지 볼 때 참고합니다.' },
  { label: '52주 최고/최저', description: '최근 1년 동안 기록한 최고가와 최저가입니다. 현재 가격의 상대적 위치를 파악할 때 유용합니다.' },
  { label: '시가총액', description: '현재 주가에 상장 주식 수를 곱한 기업 가치입니다. 화면에는 조/억 단위로 축약해 표시합니다.' },
  { label: '시가/고가/저가', description: '당일 시작 가격, 가장 높았던 가격, 가장 낮았던 가격입니다. 하루 흐름을 볼 수 있습니다.' },
  { label: 'PER', description: '주가수익비율입니다. 현재 주가가 이익 대비 어느 수준인지 볼 때 참고합니다.' },
  { label: 'PBR', description: '주가순자산비율입니다. 현재 주가가 순자산 대비 어느 수준인지 볼 때 참고합니다.' },
];

interface PortfolioAnalysisProps {
  stocks: Stock[];
}

function formatMetric(value?: number, suffix = '') {
  if (value === undefined || value === null) return '-';
  return `${value.toLocaleString()}${suffix}`;
}

function formatMarketCap(value?: number, currency = 'KRW') {
  if (value === undefined || value === null) return '-';

  if (currency === 'KRW') {
    const trillion = 1_0000_0000_0000;
    const hundredMillion = 1_0000_0000;

    if (value >= trillion) {
      const jo = Math.floor(value / trillion);
      const eok = Math.round((value % trillion) / hundredMillion);
      return eok > 0 ? `${jo}조 ${eok.toLocaleString()}억` : `${jo}조`;
    }

    if (value >= hundredMillion) {
      return `${Math.round(value / hundredMillion).toLocaleString()}억`;
    }
  }

  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T ${currency}`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B ${currency}`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
  }
  return `${value.toLocaleString()} ${currency}`;
}

export function PortfolioAnalysis({ stocks }: PortfolioAnalysisProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [quote, setQuote] = useState<QuoteSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (stocks.length > 0 && !selectedStock) {
      setSelectedStock(stocks[0]);
    }
    if (stocks.length === 0) {
      setSelectedStock(null);
    }
  }, [stocks, selectedStock]);

  useEffect(() => {
    const loadInsights = async () => {
      if (!selectedStock) return;
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
        setError(err instanceof Error ? err.message : '종목 분석 데이터를 불러오지 못했습니다.');
      }
    };

    void loadInsights();
  }, [selectedStock?.id]);

  if (stocks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">등록된 종목이 없습니다</h3>
        <p className="text-gray-600">먼저 종목을 추가해 주세요</p>
      </div>
    );
  }

  if (!selectedStock) return null;

  const profit = (selectedStock.currentPrice - selectedStock.purchasePrice) * selectedStock.quantity;
  const profitRate = selectedStock.purchasePrice > 0
    ? ((selectedStock.currentPrice - selectedStock.purchasePrice) / selectedStock.purchasePrice) * 100
    : 0;
  const isProfitable = profit >= 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <div className="sticky top-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900">종목 선택</h3>
          </div>
          <div className="max-h-[600px] divide-y divide-gray-200 overflow-y-auto">
            {stocks.map((stock) => {
              const stockProfit = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
              const stockProfitRate = stock.purchasePrice > 0
                ? ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100
                : 0;
              const isStockProfitable = stockProfit >= 0;

              return (
                <button
                  key={stock.id}
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                    selectedStock.id === stock.id ? 'border-l-4 border-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{stock.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{stock.symbol}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">{stock.currentPrice.toLocaleString()}원</div>
                    <div className={`text-xs font-medium ${isStockProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                      {isStockProfitable ? '+' : ''}{stockProfitRate.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-3">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedStock.name}</h2>
              <p className="text-gray-600">{selectedStock.symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{selectedStock.currentPrice.toLocaleString()}원</div>
              <div className={`text-lg font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                {isProfitable ? '+' : ''}{profit.toLocaleString()}원({isProfitable ? '+' : ''}{profitRate.toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 border-t border-gray-200 pt-4">
            <div><div className="mb-1 text-sm text-gray-600">보유 수량</div><div className="font-semibold text-gray-900">{selectedStock.quantity.toLocaleString()}주</div></div>
            <div><div className="mb-1 text-sm text-gray-600">평균 단가</div><div className="font-semibold text-gray-900">{selectedStock.purchasePrice.toLocaleString()}원</div></div>
            <div><div className="mb-1 text-sm text-gray-600">평가 금액</div><div className="font-semibold text-gray-900">{(selectedStock.currentPrice * selectedStock.quantity).toLocaleString()}원</div></div>
            <div><div className="mb-1 text-sm text-gray-600">매입 금액</div><div className="font-semibold text-gray-900">{(selectedStock.purchasePrice * selectedStock.quantity).toLocaleString()}원</div></div>
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
              시가총액은 너무 긴 숫자 대신 조/억 단위로 요약해 보여줍니다. 자세한 값은 마우스를 올리면 원본 숫자로 볼 수 있습니다.
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div><div className="text-sm text-gray-500">거래량</div><div className="font-medium text-gray-900">{formatMetric(quote.volume)}</div></div>
              <div><div className="text-sm text-gray-500">52주 최고</div><div className="font-medium text-gray-900">{formatMetric(quote.fiftyTwoWeekHigh, ` ${quote.currency}`)}</div></div>
              <div><div className="text-sm text-gray-500">52주 최저</div><div className="font-medium text-gray-900">{formatMetric(quote.fiftyTwoWeekLow, ` ${quote.currency}`)}</div></div>
              <div>
                <div className="text-sm text-gray-500">시가총액</div>
                <div
                  className="font-medium text-gray-900"
                  title={quote.marketCap ? `${quote.marketCap.toLocaleString()} ${quote.currency}` : undefined}
                >
                  {formatMarketCap(quote.marketCap, quote.currency)}
                </div>
              </div>
              <div><div className="text-sm text-gray-500">시가</div><div className="font-medium text-gray-900">{formatMetric(quote.openPrice, ` ${quote.currency}`)}</div></div>
              <div><div className="text-sm text-gray-500">고가</div><div className="font-medium text-gray-900">{formatMetric(quote.highPrice, ` ${quote.currency}`)}</div></div>
              <div><div className="text-sm text-gray-500">저가</div><div className="font-medium text-gray-900">{formatMetric(quote.lowPrice, ` ${quote.currency}`)}</div></div>
              <div><div className="text-sm text-gray-500">PER / PBR</div><div className="font-medium text-gray-900">{formatMetric(quote.per)} / {formatMetric(quote.pbr)}</div></div>
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
                  <a href={item.url} className="flex-shrink-0 text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-600">표시할 뉴스가 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
