import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, BarChart3, Edit2, List, Plus, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import { deleteStock, getPortfolioById, getStocks, saveStock } from '../utils/storage';
import type { MarketType, Portfolio, Stock } from '../types';
import { StockDialog } from '../components/StockDialog';
import { PortfolioAnalysis } from '../components/PortfolioAnalysis';
import { PortfolioPrompts } from '../components/PortfolioPrompts';

type TabType = 'stocks' | 'analysis' | 'prompts';

export function PortfolioDetailPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('stocks');
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!portfolioId) return;
    try {
      const [loadedPortfolio, loadedStocks] = await Promise.all([
        getPortfolioById(portfolioId),
        getStocks(portfolioId),
      ]);
      setPortfolio(loadedPortfolio || null);
      setStocks(loadedStocks);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오 정보를 불러오지 못했습니다.');
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
    if (!confirm('이 종목을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await deleteStock(stockId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '종목 삭제에 실패했습니다.');
    }
  };

  const handleSaveStock = async (
    symbol: string,
    name: string,
    market: MarketType,
    quantity: number,
    purchasePrice: number,
    currentPrice: number
  ) => {
    if (!portfolioId) return;

    try {
      const currency = market === 'US' ? 'USD' : 'KRW';

      if (editingStock) {
        await saveStock({
          ...editingStock,
          symbol,
          name,
          market,
          currency,
          quantity,
          purchasePrice,
          currentPrice,
        });
      } else {
        await saveStock({
          id: '',
          portfolioId,
          symbol,
          name,
          quantity,
          purchasePrice,
          currentPrice,
          addedAt: new Date().toISOString(),
          market,
          currency,
        });
      }

      await loadData();
      setIsDialogOpen(false);
      setEditingStock(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '종목 저장에 실패했습니다.');
    }
  };

  const totalValue = stocks.reduce((sum, stock) => sum + stock.currentPrice * stock.quantity, 0);
  const totalCost = stocks.reduce((sum, stock) => sum + stock.purchasePrice * stock.quantity, 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const tabs = [
    { id: 'stocks' as TabType, label: '종목 목록', icon: List },
    { id: 'analysis' as TabType, label: '종목 분석', icon: BarChart3 },
    { id: 'prompts' as TabType, label: 'AI 프롬프트', icon: Sparkles },
  ];

  if (!portfolio && !error) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">포트폴리오를 찾을 수 없습니다.</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          포트폴리오 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        포트폴리오 목록
      </Link>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {portfolio && (
        <>
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
                  <span
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      portfolio.type === 'dividend'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {portfolio.type === 'dividend' ? '배당' : '일반'}
                  </span>
                </div>
                {portfolio.description && <p className="text-gray-600">{portfolio.description}</p>}
              </div>
              {activeTab === 'stocks' && (
                <button
                  onClick={() => {
                    setEditingStock(null);
                    setIsDialogOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  종목 추가
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-3">
              <div>
                <div className="mb-1 text-sm text-gray-600">평가 금액</div>
                <div className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()}원</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-gray-600">투자 금액</div>
                <div className="text-2xl font-bold text-gray-900">{totalCost.toLocaleString()}원</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}원
                  <span className="ml-2 text-lg">({totalProfit >= 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%)</span>
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
                    <h3 className="mb-2 text-lg font-medium text-gray-900">등록된 종목이 없습니다</h3>
                    <p className="mb-6 text-gray-600">첫 번째 종목을 추가해 보세요</p>
                    <button
                      onClick={() => setIsDialogOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus className="h-5 w-5" />
                      종목 추가
                    </button>
                  </div>
                ) : (
                  <div className="-mx-6 overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">종목명</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">보유 수량</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">평균 단가</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">현재가</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">평가 금액</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">손익</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stocks.map((stock) => {
                          const value = stock.currentPrice * stock.quantity;
                          const cost = stock.purchasePrice * stock.quantity;
                          const profit = value - cost;
                          const profitRate = cost > 0 ? (profit / cost) * 100 : 0;
                          const isProfitable = profit >= 0;

                          return (
                            <tr key={stock.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">{stock.name}</div>
                                  <div className="text-sm text-gray-600">{stock.symbol}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">{stock.quantity.toLocaleString()}주</td>
                              <td className="px-6 py-4 text-right text-gray-900">{stock.purchasePrice.toLocaleString()}원</td>
                              <td className="px-6 py-4 text-right text-gray-900">{stock.currentPrice.toLocaleString()}원</td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">{value.toLocaleString()}원</td>
                              <td className="px-6 py-4 text-right">
                                <div className={`font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                                  {isProfitable ? '+' : ''}{profit.toLocaleString()}원
                                </div>
                                <div className={`text-sm ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                                  {isProfitable ? '+' : ''}{profitRate.toFixed(2)}%
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(stock)}
                                    className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => void handleDelete(stock.id)}
                                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
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

            {activeTab === 'analysis' && <PortfolioAnalysis stocks={stocks} />}

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
        onSave={(symbol, name, market, quantity, purchasePrice, currentPrice) => {
          void handleSaveStock(symbol, name, market, quantity, purchasePrice, currentPrice);
        }}
        stock={editingStock}
      />
    </div>
  );
}
