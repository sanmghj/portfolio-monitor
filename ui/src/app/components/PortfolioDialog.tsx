import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Portfolio, PortfolioType } from '../types';

interface PortfolioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, type: PortfolioType, description?: string) => void;
  portfolio?: Portfolio | null;
}

export function PortfolioDialog({ isOpen, onClose, onSave, portfolio }: PortfolioDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PortfolioType>('general');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (portfolio) {
      setName(portfolio.name);
      setType(portfolio.type);
      setDescription(portfolio.description || '');
    } else {
      setName('');
      setType('general');
      setDescription('');
    }
  }, [portfolio, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), type, description.trim() || undefined);
      setName('');
      setType('general');
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {portfolio ? '포트폴리오 수정' : '새 포트폴리오'}
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
            <label htmlFor="portfolio-name" className="block text-sm font-medium text-gray-700 mb-2">
              포트폴리오 이름
            </label>
            <input
              type="text"
              id="portfolio-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="예: 배당주 포트폴리오"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              포트폴리오 유형
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('general')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  type === 'general'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                일반
              </button>
              <button
                type="button"
                onClick={() => setType('dividend')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  type === 'dividend'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                배당
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="portfolio-description" className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택사항)
            </label>
            <textarea
              id="portfolio-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="포트폴리오에 대한 간단한 설명을 입력하세요"
              rows={3}
            />
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
              {portfolio ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
