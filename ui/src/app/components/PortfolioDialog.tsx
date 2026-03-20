import { useEffect, useState } from 'react';
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
    if (!name.trim()) {
      return;
    }

    onSave(name.trim(), type, description.trim() || undefined);
    setName('');
    setType('general');
    setDescription('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">{portfolio ? '포트폴리오 수정' : '포트폴리오 추가'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label htmlFor="portfolio-name" className="mb-2 block text-sm font-medium text-gray-700">
              포트폴리오 이름
            </label>
            <input
              id="portfolio-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="예: 배당 포트폴리오"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">포트폴리오 유형</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('general')}
                className={`rounded-lg border-2 px-4 py-3 transition-colors ${
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
                className={`rounded-lg border-2 px-4 py-3 transition-colors ${
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
            <label htmlFor="portfolio-description" className="mb-2 block text-sm font-medium text-gray-700">
              설명(선택)
            </label>
            <textarea
              id="portfolio-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="포트폴리오에 대한 간단한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              {portfolio ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}