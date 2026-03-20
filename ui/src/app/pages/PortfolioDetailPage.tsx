import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, BarChart3, Edit2, List, Plus, RefreshCw, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import { PortfolioAnalysis } from '../components/PortfolioAnalysis';
import { PortfolioPrompts } from '../components/PortfolioPrompts';
import { StockDialog } from '../components/StockDialog';
import type { FxRateSnapshot, MarketType, Portfolio, Stock } from '../types';
import {
  formatKrw,
  formatUsd,
  getStockCost,
  getStockKrwCost,
  getStockKrwProfit,
  getStockKrwValue,
  getStockValue,
  isUsdStock,
  toKrwAmount,
} from '../utils/currency';
import { deleteStock, fetchFxRate, getPortfolioById, getStocks, refreshHoldingInsights, saveStock } from '../utils/storage';

type TabType = 'stocks' | 'analysis' | 'prompts';

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

export function PortfolioDetailPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [usdKrw, setUsdKrw] = useState<FxRateSnapshot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('stocks');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingStock, setIsSavingStock] = useState(false);

  const loadData = async () => {
    if (!portfolioId) {
      return;
    }

    const [portfolioResult, stocksResult, fxResult] = await Promise.allSettled([
      getPortfolioById(portfolioId),
      getStocks(portfolioId),
      fetchFxRate('USD', 'KRW'),
    ]);

    if (portfolioResult.status === 'rejected' || stocksResult.status === 'rejected') {
      const reason = portfolioResult.status === 'rejected' ? portfolioResult.reason : stocksResult.reason;
      setError(reason instanceof Error ? reason.message : '\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.');
      return;
    }

    setPortfolio(portfolioResult.value || null);
    setStocks(stocksResult.value);
    setError('');

    if (fxResult.status === 'fulfilled') {
      setUsdKrw(fxResult.value);
    } else {
      setUsdKrw(null);
    }
  };

  useEffect(() => {
    void loadData();
  }, [portfolioId]);

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setIsDialogOpen(true);
  };

  const handleDelete = async (stockId: string) => {
    if (!confirm('\uC774 \uC885\uBAA9\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) {
      return;
    }

    try {
      await deleteStock(stockId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\uC885\uBAA9 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    }
  };

  const handleSaveStock = async (
    symbol: string,
    name: string,
    market: MarketType,
    quantity: number,
    purchasePrice: number
  ) => {
    if (!portfolioId || isSavingStock) {
      return;
    }

    try {
      setIsSavingStock(true);
      const currency = market === 'US' ? 'USD' : 'KRW';
      const savedStock = editingStock
        ? await saveStock({
            ...editingStock,
            symbol,
            name,
            market,
            currency,
            quantity,
            purchasePrice,
          })
        : await saveStock({
            id: '',
            portfolioId,
            symbol,
            name,
            quantity,
            purchasePrice,
            addedAt: new Date().toISOString(),
            market,
            currency,
            currentPrice: purchasePrice,
          });

      await refreshHoldingInsights(savedStock.id);
      await loadData();
      setIsDialogOpen(false);
      setEditingStock(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '\uC885\uBAA9 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    } finally {
      setIsSavingStock(false);
    }
  };

  const handleRefreshPortfolio = async () => {
    if (stocks.length === 0 || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all(stocks.map((stock) => refreshHoldingInsights(stock.id)));
      await loadData();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '\uC885\uBAA9 \uC2DC\uC138 \uC0C8\uB85C\uACE0\uCE68\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasUsdStocks = useMemo(() => stocks.some((stock) => isUsdStock(stock)), [stocks]);
  const usdKrwRate = usdKrw?.rate;

  const totalValue = stocks.reduce((sum, stock) => sum + getStockKrwValue(stock, usdKrwRate), 0);
  const totalCost = stocks.reduce((sum, stock) => sum + getStockKrwCost(stock, usdKrwRate), 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const tabs = [
    { id: 'stocks' as TabType, label: '\uC885\uBAA9 \uBAA9\uB85D', icon: List },
    { id: 'analysis' as TabType, label: '\uC885\uBAA9 \uBD84\uC11D', icon: BarChart3 },
    { id: 'prompts' as TabType, label: 'AI \uD504\uB86C\uD504\uD2B8', icon: Sparkles },
  ];

  if (!portfolio && !error) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">{'\uD3EC\uD2B8\uD3F4\uB9AC\uC624\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.'}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          {'\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uBAA9\uB85D\uC73C\uB85C'}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        {'\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uBAA9\uB85D'}
      </Link>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {portfolio && (
        <>
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
                  <span
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      portfolio.type === 'dividend' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {portfolio.type === 'dividend' ? '\uBC30\uB2F9' : '\uC77C\uBC18'}
                  </span>
                </div>
                {portfolio.description && <p className="text-gray-600">{portfolio.description}</p>}
                {hasUsdStocks && usdKrw && (
                  <p className="mt-2 text-sm text-gray-500">
                    {`\uD574\uC678 \uC885\uBAA9 \uD658\uC0B0 \uAE30\uC900: USD/KRW ${usdKrw.rate.toLocaleString('ko-KR', {
                      maximumFractionDigits: 2,
                    })} \u00B7 ${formatDateTime(usdKrw.asOf)}`}
                  </p>
                )}
              </div>

              {activeTab === 'stocks' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRefreshPortfolio()}
                    disabled={isRefreshing || stocks.length === 0}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? '\uC0C8\uB85C\uACE0\uCE68 \uC911' : '\uC0C8\uB85C\uACE0\uCE68'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStock(null);
                      setIsDialogOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    {'\uC885\uBAA9 \uCD94\uAC00'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-3">
              <div>
                <div className="mb-1 text-sm text-gray-600">{'\uD3C9\uAC00 \uAE08\uC561'}</div>
                <div className="text-2xl font-bold text-gray-900">{formatKrw(totalValue)}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-gray-600">{'\uB9E4\uC785 \uAE08\uC561'}</div>
                <div className="text-2xl font-bold text-gray-900">{formatKrw(totalCost)}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-gray-600">{'\uC190\uC775'}</div>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {totalProfit >= 0 ? '+' : '-'}
                  {formatKrw(Math.abs(totalProfit))}
                  <span className="ml-2 text-lg">
                    ({totalProfit >= 0 ? '+' : '-'}
                    {Math.abs(totalProfitRate).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-t-lg border border-b-0 border-gray-200 bg-white shadow-sm">
            <div className="flex gap-1 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-b-lg border border-gray-200 bg-white p-6 shadow-sm">
            {activeTab === 'stocks' && (
              <>
                {stocks.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{'\uB4F1\uB85D\uB41C \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</h3>
                    <p className="mb-6 text-gray-600">{'\uCCAB \uBC88\uC9F8 \uC885\uBAA9\uC744 \uCD94\uAC00\uD574 \uBCF4\uC138\uC694.'}</p>
                    <button
                      type="button"
                      onClick={() => setIsDialogOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
                    >
                      <Plus className="h-5 w-5" />
                      {'\uC885\uBAA9 \uCD94\uAC00'}
                    </button>
                  </div>
                ) : (
                  <div className="-mx-6 overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">{'\uC885\uBAA9\uBA85'}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">{'\uBCF4\uC720 \uC218\uB7C9'}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">{'\uD3C9\uADE0 \uB2E8\uAC00'}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">{'\uD604\uC7AC\uAC00'}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">{'\uD3C9\uAC00 \uAE08\uC561'}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">{'\uC190\uC775'}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">{'\uAD00\uB9AC'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stocks.map((stock) => {
                          const usdStock = isUsdStock(stock);
                          const value = getStockValue(stock);
                          const cost = getStockCost(stock);
                          const profit = value - cost;
                          const profitRate = cost > 0 ? (profit / cost) * 100 : 0;
                          const isProfitable = profit >= 0;
                          const krwCurrentPrice = toKrwAmount(stock.currentPrice, stock.currency, usdKrwRate);
                          const krwPurchasePrice = toKrwAmount(stock.purchasePrice, stock.currency, usdKrwRate);
                          const krwValue = getStockKrwValue(stock, usdKrwRate);
                          const krwProfit = getStockKrwProfit(stock, usdKrwRate);

                          return (
                            <tr key={stock.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">{stock.name}</div>
                                  <div className="text-sm text-gray-600">{stock.symbol}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">{`${stock.quantity.toLocaleString()}\uC8FC`}</td>
                              <td className="px-6 py-4 text-right text-gray-900">
                                <div>{formatKrw(krwPurchasePrice)}</div>
                                {usdStock && <div className="text-xs text-gray-500">{formatUsd(stock.purchasePrice)}</div>}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">
                                <div>{formatKrw(krwCurrentPrice)}</div>
                                {usdStock && <div className="text-xs text-gray-500">{formatUsd(stock.currentPrice)}</div>}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">
                                <div>{formatKrw(krwValue)}</div>
                                {usdStock && <div className="text-xs text-gray-500">{formatUsd(value)}</div>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className={`font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                                  {isProfitable ? '+' : '-'}
                                  {formatKrw(Math.abs(krwProfit))}
                                </div>
                                <div className={`text-sm ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                                  {isProfitable ? '+' : '-'}
                                  {Math.abs(profitRate).toFixed(2)}%
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(stock)}
                                    className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(stock.id)}
                                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'analysis' && (
              <PortfolioAnalysis stocks={stocks} usdKrwRate={usdKrwRate} fxAsOf={usdKrw?.asOf} />
            )}

            {activeTab === 'prompts' && (
              <PortfolioPrompts portfolioName={portfolio.name} portfolioType={portfolio.type} />
            )}
          </div>
        </>
      )}

      <StockDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingStock(null);
        }}
        onSave={handleSaveStock}
        stock={editingStock}
      />
    </div>
  );
}
