import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import { getCurrentUser, getPrompts, getPortfolios, savePrompt, deletePrompt } from '../utils/storage';
import type { AIPrompt, Portfolio } from '../types';
import { PromptDialog } from '../components/PromptDialog';

export function PromptsPage() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [error, setError] = useState('');

  const loadPrompts = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const [userPrompts, userPortfolios] = await Promise.all([
        getPrompts(user.id),
        getPortfolios(user.id),
      ]);
      setPrompts(userPrompts);
      setPortfolios(userPortfolios);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '프롬프트를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    void loadPrompts();
  }, []);

  const handleSavePrompt = async (title: string, content: string, portfolioId?: string) => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      if (editingPrompt) {
        await savePrompt({
          ...editingPrompt,
          title,
          content,
          portfolioId,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await savePrompt({
          id: '',
          userId: user.id,
          title,
          content,
          portfolioId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await loadPrompts();
      setIsDialogOpen(false);
      setEditingPrompt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프롬프트 저장에 실패했습니다.');
    }
  };

  const handleEdit = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setIsDialogOpen(true);
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm('이 프롬프트를 삭제하시겠습니까?')) {
      return;
    }
    try {
      await deletePrompt(promptId);
      await loadPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프롬프트 삭제에 실패했습니다.');
    }
  };

  const getPortfolioName = (portfolioId?: string) => {
    if (!portfolioId) return '전체';
    const portfolio = portfolios.find((p) => p.id === portfolioId);
    return portfolio ? portfolio.name : '연결 없음';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 프롬프트 관리</h1>
          <p className="text-gray-600">AI에게 질문할 프롬프트를 관리해 보세요</p>
        </div>
        <button
          onClick={() => {
            setEditingPrompt(null);
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          프롬프트 추가
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">프롬프트가 없습니다</h3>
          <p className="text-gray-600 mb-6">AI에게 질문할 프롬프트를 만들어 보세요</p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            프롬프트 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{prompt.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">포트폴리오</span>
                      <span className="text-sm font-medium text-blue-600">
                        {getPortfolioName(prompt.portfolioId)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => void handleDelete(prompt.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.content}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>생성: {new Date(prompt.createdAt).toLocaleDateString('ko-KR')}</span>
                  <span>수정: {new Date(prompt.updatedAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PromptDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPrompt(null);
        }}
        onSave={(title, content, portfolioId) => {
          void handleSavePrompt(title, content, portfolioId);
        }}
        prompt={editingPrompt}
        portfolios={portfolios}
      />
    </div>
  );
}
