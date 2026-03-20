import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Edit2, Plus, Trash2, TrendingUp } from 'lucide-react';
import { PortfolioDialog } from '../components/PortfolioDialog';
import type { Portfolio, PortfolioType } from '../types';
import { deletePortfolio, getCurrentUser, getPortfolios, savePortfolio } from '../utils/storage';

export function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState('');

  const loadPortfolios = async () => {
    const user = getCurrentUser();
    if (!user) {
      return;
    }

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
    if (!user) {
      return;
    }

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">포트폴리오</h1>
          <p className="mt-2 text-gray-600">내 포트폴리오를 관리하고 종목을 추가해 보세요</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingPortfolio(null);
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          포트폴리오 추가
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">포트폴리오가 없습니다</h3>
          <p className="mb-6 text-gray-600">첫 번째 포트폴리오를 만들어 보세요.</p>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            포트폴리오 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => {
            const profit = portfolio.profit ?? 0;
            const profitRate = portfolio.profitRate ?? 0;
            const isProfitable = profit >= 0;

            return (
              <div key={portfolio.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{portfolio.name}</h3>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          portfolio.type === 'dividend'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {portfolio.type === 'dividend' ? '배당' : '일반'}
                      </span>
                    </div>
                    {portfolio.description && <p className="text-sm text-gray-600">{portfolio.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(portfolio)}
                      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(portfolio.id)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">보유 종목</span>
                    <span className="font-medium text-gray-900">{portfolio.stockCount ?? 0}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">평가 금액</span>
                    <span className="font-medium text-gray-900">{(portfolio.totalValue ?? 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">손익</span>
                    <div className="text-right">
                      <div className={`font-medium ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                        {isProfitable ? '+' : ''}
                        {profit.toLocaleString()}원
                      </div>
                      <div className={`text-sm ${isProfitable ? 'text-red-600' : 'text-blue-600'}`}>
                        {isProfitable ? '+' : ''}
                        {profitRate.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/portfolio/${portfolio.id}`}
                  className="mt-6 block rounded-lg bg-gray-50 px-4 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-100"
                >
                  상세 보기
                </Link>
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