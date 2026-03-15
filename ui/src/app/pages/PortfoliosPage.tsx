import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { getCurrentUser, getPortfolios, savePortfolio, deletePortfolio } from '../utils/storage';
import type { Portfolio, PortfolioType } from '../types';
import { PortfolioDialog } from '../components/PortfolioDialog';

export function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState('');

  const loadPortfolios = async () => {
    const user = getCurrentUser();
    if (!user) return;
    try {
      const userPortfolios = await getPortfolios(user.id);
      setPortfolios(userPortfolios);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    void loadPortfolios();
  }, []);

  const handleCreatePortfolio = async (name: string, type: PortfolioType, description?: string) => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      if (editingPortfolio) {
        await savePortfolio({
          ...editingPortfolio,
          name,
          type,
          description,
        });
      } else {
        await savePortfolio({
          id: '',
          userId: user.id,
          name,
          type,
          description,
          createdAt: new Date().toISOString(),
          baseCurrency: 'KRW',
          monthlyBudget: null,
          targetWeight: null,
        });
      }

      await loadPortfolios();
      setIsDialogOpen(false);
      setEditingPortfolio(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오 저장에 실패했습니다.');
    }
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setIsDialogOpen(true);
  };

  const handleDelete = async (portfolioId: string) => {
    if (!confirm('포트폴리오를 삭제하시겠습니까? 관련 종목도 함께 삭제됩니다.')) {
      return;
    }

    try {
      await deletePortfolio(portfolioId);
      await loadPortfolios();
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">포트폴리오</h1>
          <p className="text-gray-600 mt-2">내 포트폴리오를 관리하고 종목을 추가해 보세요</p>
        </div>
        <button
          onClick={() => {
            setEditingPortfolio(null);
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          포트폴리오 추가
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">포트폴리오가 없습니다</h3>
          <p className="text-gray-600 mb-6">첫 번째 포트폴리오를 만들어 보세요</p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            포트폴리오 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => {
            const isProfitable = (portfolio.profit ?? 0) >= 0;

            return (
              <div
                key={portfolio.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{portfolio.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            portfolio.type === 'dividend'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {portfolio.type === 'dividend' ? '배당' : '일반'}
                        </span>
                      </div>
                      {portfolio.description && (
                        <p className="text-sm text-gray-600">{portfolio.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(portfolio)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleDelete(portfolio.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">보유 종목</span>
                      <span className="font-medium text-gray-900">{portfolio.stockCount ?? 0}개</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">평가 금액</span>
                      <span className="font-medium text-gray-900">
                        {(portfolio.totalValue ?? 0).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">손익</span>
                      <div className="text-right">
                        <div className={`font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                          {isProfitable ? '+' : ''}{(portfolio.profit ?? 0).toLocaleString()}원
                        </div>
                        <div className={`text-sm ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                          {isProfitable ? '+' : ''}{(portfolio.profitRate ?? 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/portfolio/${portfolio.id}`}
                    className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-900 py-2 rounded-lg transition-colors"
                  >
                    상세 보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PortfolioDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPortfolio(null);
        }}
        onSave={(name, type, description) => {
          void handleCreatePortfolio(name, type, description);
        }}
        portfolio={editingPortfolio}
      />
    </div>
  );
}
