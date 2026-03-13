import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AIPrompt, Portfolio } from '../types';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, portfolioId?: string) => void;
  prompt?: AIPrompt | null;
  portfolios: Portfolio[];
}

export function PromptDialog({ isOpen, onClose, onSave, prompt, portfolios }: PromptDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [portfolioId, setPortfolioId] = useState<string>('');

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setPortfolioId(prompt.portfolioId || '');
    } else {
      setTitle('');
      setContent('');
      setPortfolioId('');
    }
  }, [prompt, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSave(title.trim(), content.trim(), portfolioId || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {prompt ? '프롬프트 수정' : '새 프롬프트'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="prompt-title" className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              id="prompt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="예: 배당주 포트폴리오 분석 요청"
              required
            />
          </div>

          <div>
            <label htmlFor="prompt-portfolio" className="block text-sm font-medium text-gray-700 mb-2">
              대상 포트폴리오 (선택사항)
            </label>
            <select
              id="prompt-portfolio"
              value={portfolioId}
              onChange={(e) => setPortfolioId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">전체</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name} ({portfolio.type === 'dividend' ? '배당' : '일반'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prompt-content" className="block text-sm font-medium text-gray-700 mb-2">
              프롬프트 내용
            </label>
            <textarea
              id="prompt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="AI에게 질문할 내용을 입력하세요. 예:&#10;&#10;현재 보유 중인 배당주 포트폴리오를 분석하고, 최근 뉴스와 주가 추세를 고려하여 다음 사항을 제안해주세요:&#10;1. 포트폴리오 리밸런싱 필요 여부&#10;2. 추가 매수 또는 매도 추천&#10;3. 배당 수익률 전망"
              rows={12}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 프롬프트 작성 팁</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 구체적인 분석 요청사항을 명시하세요</li>
              <li>• 뉴스, 주가 추세, 재무 데이터 등 고려할 요소를 지정하세요</li>
              <li>• 원하는 출력 형식(리스트, 표 등)을 명확히 하세요</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {prompt ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
