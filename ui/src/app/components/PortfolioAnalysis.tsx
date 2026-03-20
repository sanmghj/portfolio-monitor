import { useEffect } from 'react';
import { Calendar, ExternalLink, Info, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { METRIC_HELP } from '../constants/analysis';
import { useHoldingAnalysis } from '../hooks/useHoldingAnalysis';
import type { Stock } from '../types';
import {
  formatKrw,
  formatPrimaryAmount,
  formatUsd,
  getStockCost,
  getStockKrwCost,
  getStockKrwProfit,
  getStockKrwValue,
  getStockProfit,
  getStockValue,
  isUsdStock,
  toKrwAmount,
} from '../utils/currency';
import { formatMarketCap, formatMetric } from '../utils/formatters';

interface PortfolioAnalysisProps {
  stocks: Stock[];
  usdKrwRate?: number | null;
  fxAsOf?: string;
}

function SecondaryKrw({ amount }: { amount: number }) {
  return <div className="mt-1 text-xs text-gray-500">{`\uC57D ${formatKrw(amount)}`}</div>;
}

function formatDateTime(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ko-KR');
}

export function PortfolioAnalysis({ stocks, usdKrwRate, fxAsOf }: PortfolioAnalysisProps) {
  const { news, priceData, quote, error, selectedStock, setSelectedStock } = useHoldingAnalysis(null);

  useEffect(() => {
    if (stocks.length === 0) {
      setSelectedStock(null);
      return;
    }

    if (!selectedStock) {
      setSelectedStock(stocks[0]);
      return;
    }

    const matchedStock = stocks.find((stock) => stock.id === selectedStock.id);
    setSelectedStock(matchedStock ?? stocks[0]);
  }, [selectedStock, setSelectedStock, stocks]);

  if (stocks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">{'\uB4F1\uB85D\uB41C \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</h3>
        <p className="text-gray-600">{'\uBA3C\uC800 \uC885\uBAA9\uC744 \uCD94\uAC00\uD574 \uC8FC\uC138\uC694.'}</p>
      </div>
    );
  }

  if (!selectedStock) {
    return null;
  }

  const showUsd = isUsdStock(selectedStock);
  const cost = getStockCost(selectedStock);
  const value = getStockValue(selectedStock);
  const profit = getStockProfit(selectedStock);
  const profitRate = cost > 0 ? (profit / cost) * 100 : 0;
  const isProfitable = profit >= 0;

  const krwCost = getStockKrwCost(selectedStock, usdKrwRate);
  const krwValue = getStockKrwValue(selectedStock, usdKrwRate);
  const krwProfit = getStockKrwProfit(selectedStock, usdKrwRate);
  const krwCurrentPrice = toKrwAmount(selectedStock.currentPrice, selectedStock.currency, usdKrwRate);
  const krwPurchasePrice = toKrwAmount(selectedStock.purchasePrice, selectedStock.currency, usdKrwRate);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <div className="sticky top-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900">{'\uC885\uBAA9 \uC120\uD0DD'}</h3>
          </div>
          <div className="max-h-[600px] divide-y divide-gray-200 overflow-y-auto">
            {stocks.map((stock) => {
              const usdStock = isUsdStock(stock);
              const stockProfit = getStockProfit(stock);
              const stockProfitRate = getStockCost(stock) > 0 ? (stockProfit / getStockCost(stock)) * 100 : 0;
              const isStockProfitable = stockProfit >= 0;

              return (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                    selectedStock.id === stock.id ? 'border-l-4 border-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{stock.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{stock.symbol}</div>
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      {usdStock
                        ? formatUsd(stock.currentPrice)
                        : formatPrimaryAmount(stock.currentPrice, stock.currency)}
                      {usdStock && (
                        <div className="mt-1 text-xs text-gray-500">
                          {formatKrw(toKrwAmount(stock.currentPrice, stock.currency, usdKrwRate))}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs font-medium ${isStockProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                      {isStockProfitable ? '+' : ''}
                      {stockProfitRate.toFixed(2)}%
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
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedStock.name}</h2>
              <p className="text-gray-600">{selectedStock.symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {showUsd
                  ? formatUsd(selectedStock.currentPrice)
                  : formatPrimaryAmount(selectedStock.currentPrice, selectedStock.currency)}
              </div>
              {showUsd && <SecondaryKrw amount={krwCurrentPrice} />}
              <div className={`mt-2 text-lg font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                {isProfitable ? '+' : '-'}
                {showUsd ? formatUsd(Math.abs(profit)) : formatKrw(Math.abs(profit))}
                <span className="ml-2">
                  ({isProfitable ? '+' : '-'}
                  {Math.abs(profitRate).toFixed(2)}%)
                </span>
              </div>
              {showUsd && (
                <div className={`text-sm ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                  {`\uC57D ${isProfitable ? '+' : '-'}${formatKrw(Math.abs(krwProfit))}`}
                </div>
              )}
            </div>
          </div>

          {showUsd && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              {
                '\uD574\uC678 \uC885\uBAA9 \uAE08\uC561\uC740 \uB2EC\uB7EC \uAE30\uC900\uC73C\uB85C \uD45C\uC2DC\uD558\uACE0, \uAC19\uC740 \uC2DC\uC810\uC758 \uC6D0\uD654 \uD658\uC0B0 \uAE08\uC561\uB3C4 \uD568\uAED8 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.'
              }
              {fxAsOf && (
                <div className="mt-1 text-xs text-blue-700">
                  {`\uD658\uC728 \uAE30\uC900 \uC2DC\uAC01: ${formatDateTime(fxAsOf)}`}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 md:grid-cols-4">
            <div>
              <div className="mb-1 text-sm text-gray-600">{'\uBCF4\uC720 \uC218\uB7C9'}</div>
              <div className="font-semibold text-gray-900">{`${selectedStock.quantity.toLocaleString()}\uC8FC`}</div>
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">{'\uD3C9\uADE0 \uB2E8\uAC00'}</div>
              <div className="font-semibold text-gray-900">
                {showUsd ? formatUsd(selectedStock.purchasePrice) : formatKrw(selectedStock.purchasePrice)}
              </div>
              {showUsd && <SecondaryKrw amount={krwPurchasePrice} />}
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">{'\uD3C9\uAC00 \uAE08\uC561'}</div>
              <div className="font-semibold text-gray-900">{showUsd ? formatUsd(value) : formatKrw(value)}</div>
              {showUsd && <SecondaryKrw amount={krwValue} />}
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">{'\uB9E4\uC785 \uAE08\uC561'}</div>
              <div className="font-semibold text-gray-900">{showUsd ? formatUsd(cost) : formatKrw(cost)}</div>
              {showUsd && <SecondaryKrw amount={krwCost} />}
            </div>
          </div>
        </div>

        {quote && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{'\uAE30\uBCF8 \uCC38\uACE0 \uC9C0\uD45C'}</h3>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400" />
                    <div className="pointer-events-none absolute left-0 top-6 z-10 hidden w-80 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-600 shadow-lg group-hover:block">
                      {METRIC_HELP.map((item) => (
                        <p key={item.label} className="mb-2 last:mb-0">
                          <span className="font-semibold text-gray-900">{item.label}</span> {item.description}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {`${quote.exchangeName ?? quote.market} \u00B7 ${formatDateTime(quote.asOf)}`}
                </p>
              </div>
              <div
                className={`text-right text-sm font-medium ${(quote.change ?? 0) >= 0 ? 'text-red-600' : 'text-blue-600'}`}
              >
                {(quote.change ?? 0) >= 0 ? '+' : ''}
                {formatMetric(quote.change, ` ${quote.currency}`)} ({(quote.changePercent ?? 0) >= 0 ? '+' : ''}
                {formatMetric(quote.changePercent, '%')})
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
              {
                '\uC2DC\uAC00\uCD1D\uC561\uC740 \uB108\uBB34 \uD070 \uC22B\uC790 \uB300\uC2E0 \uC77D\uAE30 \uC26C\uC6B4 \uB2E8\uC704\uB85C \uC694\uC57D\uD574 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4. \uC790\uC138\uD55C \uAC12\uC740 \uD234\uD301\uC73C\uB85C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
              }
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm text-gray-500">{'\uAC70\uB798\uB7C9'}</div>
                <div className="font-medium text-gray-900">{formatMetric(quote.volume)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{'\u0035\u0032\uC8FC \uCD5C\uACE0'}</div>
                <div className="font-medium text-gray-900">{formatMetric(quote.fiftyTwoWeekHigh, ` ${quote.currency}`)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{'\u0035\u0032\uC8FC \uCD5C\uC800'}</div>
                <div className="font-medium text-gray-900">{formatMetric(quote.fiftyTwoWeekLow, ` ${quote.currency}`)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{'\uC2DC\uAC00\uCD1D\uC561'}</div>
                <div
                  className="font-medium text-gray-900"
                  title={quote.marketCap ? `${quote.marketCap.toLocaleString()} ${quote.currency}` : undefined}
                >
                  {formatMarketCap(quote.marketCap, quote.currency)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{'\uC2DC\uAC00'}</div>
                <div className="font-medium text-gray-900">{formatMetric(quote.openPrice, ` ${quote.currency}`)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{'\uACE0\uAC00'}</div>
                <div className="font-medium text-gray-900">{formatMetric(quote.highPrice, ` ${quote.currency}`)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{'\uC800\uAC00'}</div>
                <div className="font-medium text-gray-900">{formatMetric(quote.lowPrice, ` ${quote.currency}`)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">PER / PBR</div>
                <div className="font-medium text-gray-900">
                  {formatMetric(quote.per)} / {formatMetric(quote.pbr)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">{'\uAC00\uACA9 \uCD94\uC774 (30\uC77C)'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const currentDate = new Date(date);
                  return `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
                }}
              />
              <YAxis tickFormatter={(value) => (showUsd ? `${value.toFixed(0)}` : `${(value / 1000).toFixed(0)}k`)} />
              <Tooltip
                formatter={(value: number) => [formatPrimaryAmount(value, selectedStock.currency), '\uAC00\uACA9']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('ko-KR')}
              />
              <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">{'\uAD00\uB828 \uB274\uC2A4'}</h3>
          <div className="space-y-4">
            {news.length ? (
              news.map((item) => (
                <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="mb-1 font-medium text-gray-900">{item.title}</h4>
                      {item.summary && <p className="mb-2 text-sm text-gray-600">{item.summary}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{item.source}</span>
                        <span>{'\u00B7'}</span>
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
              ))
            ) : (
              <div className="text-sm text-gray-600">{'\uD45C\uC2DC\uD560 \uB274\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
