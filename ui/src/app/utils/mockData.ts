import { NewsItem, PriceData } from '../types';

export const generateMockNews = (symbol: string): NewsItem[] => {
  const newsTemplates = [
    {
      title: `${symbol}, 분기 실적 예상 상회`,
      summary: '시장 예상치를 웃도는 실적 발표로 투자 심리가 개선되고 있습니다.',
      source: '경제일보',
    },
    {
      title: `${symbol} 신규 사업 진출 발표`,
      summary: '새로운 성장 동력 확보 기대감으로 중장기 전망이 긍정적으로 평가됩니다.',
      source: '비즈니스데일리',
    },
    {
      title: `애널리스트, ${symbol} 목표가 상향`,
      summary: '주요 증권사들이 목표주가를 잇달아 높여 잡고 있습니다.',
      source: '증권리포트',
    },
    {
      title: `${symbol}, 주주환원 정책 발표`,
      summary: '배당 및 자사주 정책 강화 기대감이 반영되고 있습니다.',
      source: '머니뉴스',
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

export const generateMockPriceData = (currentPrice: number): PriceData[] => {
  const data: PriceData[] = [];
  const days = 30;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const variation = 0.95 + Math.random() * 0.1;
    const price = currentPrice * variation;
    const volume = Math.floor(1_000_000 + Math.random() * 5_000_000);

    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price),
      volume,
    });
  }

  return data;
};

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
