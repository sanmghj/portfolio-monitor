import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Plus, Edit2, Trash2, TrendingUp, BarChart3, Sparkles, List } from 'lucide-react';
import { getPortfolioById, getStocks, saveStock, deleteStock } from '../utils/storage';
import type { Portfolio, Stock } from '../types';
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
      setError(err instanceof Error ? err.message : '포트폴리오를 불러오지 못했습니다.');
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
    quantity: number,
    purchasePrice: number,
    currentPrice: number
  ) => {
    if (!portfolioId) return;

    try {
      if (editingStock) {
        await saveStock({
          ...editingStock,
          symbol,
          name,
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
          market: 'KR',
          currency: 'KRW',
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
      <div className="text-center py-12">
        <p className="text-gray-600">포트폴리오를 찾을 수 없습니다.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        포트폴리오 목록
      </Link>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {portfolio && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
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
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  종목 추가
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-sm text-gray-600 mb-1">평가 금액</div>
                <div className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()}원</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">투자 금액</div>
                <div className="text-2xl font-bold text-gray-900">{totalCost.toLocaleString()}원</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}원
                  <span className="text-lg ml-2">({totalProfit >= 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-t-lg shadow-sm border border-b-0 border-gray-200">
            <div className="flex gap-1 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'stocks' && (
              <>
                {stocks.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">보유 종목이 없습니다</h3>
                    <p className="text-gray-600 mb-6">첫 번째 종목을 추가해 보세요</p>
                    <button
                      onClick={() => setIsDialogOpen(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      종목 추가
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">종목명</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">보유 수량</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">평균 단가</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">현재가</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">평가 금액</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">손익</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">관리</th>
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
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => void handleDelete(stock.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
        onSave={(symbol, name, quantity, purchasePrice, currentPrice) => {
          void handleSaveStock(symbol, name, quantity, purchasePrice, currentPrice);
        }}
        stock={editingStock}
      />
    </div>
  );
}
