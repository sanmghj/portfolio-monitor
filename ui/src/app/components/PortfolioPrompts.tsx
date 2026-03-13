import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { promptTemplates, getTemplatesByCategory } from '../utils/promptTemplates';
import type { PromptTemplate } from '../utils/promptTemplates';

interface PortfolioPromptsProps {
  portfolioName: string;
  portfolioType: 'dividend' | 'general';
}

export function PortfolioPrompts({ portfolioName, portfolioType }: PortfolioPromptsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = getTemplatesByCategory();

  // 배당 포트폴리오면 배당 관련 템플릿 우선 표시
  const sortedTemplates = [...promptTemplates].sort((a, b) => {
    if (portfolioType === 'dividend') {
      if (a.category === '배당 전략') return -1;
      if (b.category === '배당 전략') return 1;
    }
    return 0;
  });

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompt(template.content);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 템플릿 목록 */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI 프롬프트 템플릿</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {portfolioName}에 최적화된 분석 프롬프트
            </p>
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {sortedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedTemplate?.id === template.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 text-sm">{template.title}</h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                    {template.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 프롬프트 상세 및 편집 */}
      <div className="lg:col-span-2">
        {selectedTemplate ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedTemplate.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded">
                  {selectedTemplate.category}
                </span>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프롬프트 내용 (필요시 수정 가능)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                rows={15}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleCopy(customPrompt, 'custom')}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copiedId === 'custom' ? (
                    <>
                      <Check className="w-5 h-5" />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      클립보드에 복사
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">💡 사용 방법</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 프롬프트를 복사하여 ChatGPT, Claude 등 AI 챗봇에 붙여넣으세요</li>
                  <li>• 현재 포트폴리오 정보(종목, 뉴스, 추세)를 함께 제공하면 더 정확한 분석을 받을 수 있습니다</li>
                  <li>• 필요에 따라 프롬프트를 수정하여 맞춤형 분석을 요청하세요</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center h-full flex items-center justify-center">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">프롬프트 템플릿을 선택하세요</h3>
              <p className="text-gray-600">
                왼쪽에서 분석하고 싶은 항목을 선택하면<br />
                최적화된 AI 프롬프트를 제공합니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
