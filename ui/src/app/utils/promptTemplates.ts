// 정형화된 AI 프롬프트 템플릿
export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
  description: string;
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: 'rebalancing',
    title: '포트폴리오 리밸런싱 분석',
    category: '포트폴리오 관리',
    description: '현재 포트폴리오의 균형을 분석하고 리밸런싱 제안',
    content: `현재 포트폴리오를 분석하여 다음 사항을 제안해주세요:

1. 각 종목의 현재 비중 분석
2. 리밸런싱이 필요한 종목과 이유
3. 추천 매수/매도 수량 및 금액
4. 리밸런싱 후 예상 포트폴리오 구성

최근 뉴스와 주가 추세를 고려하여 답변해주세요.`,
  },
  {
    id: 'dividend_strategy',
    title: '배당 수익률 최적화',
    category: '배당 전략',
    description: '배당 수익을 극대화하기 위한 전략 제안',
    content: `배당주 포트폴리오의 수익률을 높이기 위한 전략을 제안해주세요:

1. 현재 포트폴리오의 예상 배당 수익률
2. 배당 수익률 개선을 위한 종목별 조정 방안
3. 추가 고려할 만한 고배당주 추천
4. 배당 지급 시기를 고려한 포트폴리오 관리 팁

각 종목의 배당 성향과 배당 성장률을 고려해주세요.`,
  },
  {
    id: 'news_analysis',
    title: '뉴스 기반 매매 타이밍 분석',
    category: '시장 분석',
    description: '최근 뉴스를 바탕으로 매수/매도 타이밍 제안',
    content: `최근 뉴스와 시장 동향을 분석하여 다음을 제안해주세요:

1. 긍정적 뉴스가 있는 종목과 매수 타이밍
2. 부정적 이슈가 있는 종목과 매도 고려 여부
3. 단기/중기/장기 관점의 보유 전략
4. 주의해야 할 리스크 요인

구체적인 뉴스 내용과 함께 근거를 제시해주세요.`,
  },
  {
    id: 'risk_analysis',
    title: '포트폴리오 리스크 분석',
    category: '리스크 관리',
    description: '현재 포트폴리오의 리스크 평가 및 대응 방안',
    content: `현재 포트폴리오의 리스크를 종합적으로 분석해주세요:

1. 업종/섹터 집중도 분석
2. 개별 종목 리스크 평가
3. 시장 변동성에 대한 민감도
4. 리스크 완화를 위한 구체적 방안

분산투자 관점에서 개선점을 제시해주세요.`,
  },
  {
    id: 'performance_review',
    title: '수익률 분석 및 개선 방안',
    category: '성과 분석',
    description: '현재까지의 수익률을 분석하고 개선 전략 제안',
    content: `포트폴리오의 성과를 분석하고 개선 방안을 제시해주세요:

1. 종목별 수익률 및 기여도 분석
2. 손실 종목에 대한 손절/보유 판단 기준
3. 수익 종목의 추가 매수 또는 익절 타이밍
4. 전체 수익률 개선을 위한 전략

손익률과 주가 추세를 고려하여 답변해주세요.`,
  },
  {
    id: 'sector_rotation',
    title: '섹터 로테이션 전략',
    category: '전략 제안',
    description: '시장 상황에 따른 섹터별 투자 비중 조정 제안',
    content: `현재 시장 상황을 고려한 섹터 로테이션 전략을 제안해주세요:

1. 현재 포트폴리오의 섹터별 구성 분석
2. 시장 사이클 상 유망한 섹터 제시
3. 비중 확대/축소가 필요한 섹터와 이유
4. 구체적인 종목 교체 또는 추가 방안

거시경제 동향과 업종별 전망을 반영해주세요.`,
  },
  {
    id: 'value_growth',
    title: '가치주 vs 성장주 밸런스',
    category: '투자 스타일',
    description: '가치주와 성장주의 적정 비율 분석 및 조정',
    content: `포트폴리오의 가치주와 성장주 비중을 분석해주세요:

1. 현재 가치주/성장주 비중 평가
2. 시장 상황을 고려한 적정 비율 제안
3. 비중 조정을 위한 구체적 종목 제안
4. 각 스타일의 장단점 및 투자 전략

현재 금리 환경과 시장 밸류에이션을 고려해주세요.`,
  },
  {
    id: 'tax_efficiency',
    title: '세금 효율적 매매 전략',
    category: '세무 전략',
    description: '양도소득세를 고려한 매매 타이밍 제안',
    content: `세금 효율을 고려한 매매 전략을 제안해주세요:

1. 손익 실현 시 세금 영향 분석
2. 손익 통산을 활용한 절세 방안
3. 보유 기간을 고려한 매매 타이밍
4. 배당소득세 최적화 전략

현행 세법을 반영하여 구체적으로 제안해주세요.`,
  },
];

export const getTemplatesByCategory = () => {
  const categories = new Map<string, PromptTemplate[]>();
  
  promptTemplates.forEach((template) => {
    const existing = categories.get(template.category) || [];
    categories.set(template.category, [...existing, template]);
  });
  
  return categories;
};
