import { NewsItem, PriceData } from '../types';

// 모의 뉴스 데이터 생성
export const generateMockNews = (symbol: string): NewsItem[] => {
  const newsTemplates = [
    {
      title: `${symbol}, 분기 실적 예상 상회`,
      summary: '시장 예상을 뛰어넘는 실적 발표로 주가 상승세 예상',
      source: '경제일보',
    },
    {
      title: `${symbol} 신규 사업 진출 발표`,
      summary: '새로운 성장 동력 확보로 중장기 전망 긍정적',
      source: '투자뉴스',
    },
    {
      title: `애널리스트 ${symbol} 목표가 상향`,
      summary: '주요 증권사들이 목표가를 일제히 상향 조정',
      source: '증권타임즈',
    },
    {
      title: `${symbol}, 배당 확대 방침 발표`,
      summary: '주주환원 정책 강화로 투자 매력도 상승',
      source: '재무신문',
    },
  ];

  return newsTemplates.slice(0, 3).map((template, index) => ({
    id: `news-${symbol}-${index}`,
    title: template.title,
    summary: template.summary,
    source: template.source,
    publishedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    url: '#',
  }));
};

// 모의 주가 데이터 생성
export const generateMockPriceData = (currentPrice: number): PriceData[] => {
  const data: PriceData[] = [];
  const days = 30;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 랜덤 변동 (-5% ~ +5%)
    const variation = 0.95 + Math.random() * 0.1;
    const price = currentPrice * variation;
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price),
      volume,
    });
  }
  
  return data;
};

// 한국 주식 샘플
export const koreanStockSamples = [
  { symbol: '005930', name: '삼성전자', price: 72000 },
  { symbol: '000660', name: 'SK하이닉스', price: 135000 },
  { symbol: '035420', name: 'NAVER', price: 185000 },
  { symbol: '005380', name: '현대차', price: 245000 },
  { symbol: '051910', name: 'LG화학', price: 390000 },
  { symbol: '006400', name: '삼성SDI', price: 425000 },
  { symbol: '035720', name: '카카오', price: 42500 },
  { symbol: '068270', name: '셀트리온', price: 178000 },
  { symbol: '028260', name: '삼성물산', price: 145000 },
  { symbol: '012330', name: '현대모비스', price: 235000 },
];
