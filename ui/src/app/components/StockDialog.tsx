import { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw, Search, X } from 'lucide-react';
import type { MarketType, QuoteSnapshot, Stock } from '../types';
import { fetchQuote } from '../utils/storage';
import { koreanStockSamples } from '../utils/mockData';

interface StockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    symbol: string,
    name: string,
    market: MarketType,
    quantity: number,
    purchasePrice: number,
    currentPrice: number
  ) => void;
  stock?: Stock | null;
}

function formatMetric(value?: number, suffix = '') {
  if (value === undefined || value === null) {
    return '-';
  }
  return `${value.toLocaleString()}${suffix}`;
}

export function StockDialog({ isOpen, onClose, onSave, stock }: StockDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<MarketType>('KR');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quote, setQuote] = useState<QuoteSnapshot | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);

  useEffect(() => {
    if (stock) {
      setSymbol(stock.symbol);
      setName(stock.name);
      setMarket((stock.market as MarketType) || 'KR');
      setQuantity(stock.quantity.toString());
      setPurchasePrice(stock.purchasePrice.toString());
      setCurrentPrice(stock.currentPrice.toString());
      setSearchQuery(stock.name);
    } else {
      setSymbol('');
      setName('');
      setMarket('KR');
      setQuantity('');
      setPurchasePrice('');
      setCurrentPrice('');
      setSearchQuery('');
    }
    setShowSuggestions(false);
    setQuote(null);
    setQuoteError('');
    setIsFetchingQuote(false);
  }, [stock, isOpen]);

  const filteredStocks = market === 'KR'
    ? koreanStockSamples.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.symbol.includes(searchQuery)
      )
    : [];

  const handleLookupQuote = async (symbolOverride?: string, marketOverride?: MarketType) => {
    const resolvedSymbol = (symbolOverride ?? symbol).trim().toUpperCase();
    const resolvedMarket = marketOverride ?? market;

    if (!resolvedSymbol) {
      setQuoteError('종목 코드를 먼저 입력해 주세요.');
      return null;
    }

    setIsFetchingQuote(true);
    setQuoteError('');

    try {
      const fetched = await fetchQuote(resolvedSymbol, resolvedMarket);
      setQuote(fetched);
      setCurrentPrice(String(fetched.price));
      if (!name.trim() && fetched.stockName) {
        setName(fetched.stockName);
      }
      return fetched;
    } catch (err) {
      setQuote(null);
      setQuoteError(err instanceof Error ? err.message : '현재가 조회에 실패했습니다.');
      return null;
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleSelectStock = async (selectedStock: typeof koreanStockSamples[number]) => {
    const resolvedSymbol = selectedStock.symbol.toUpperCase();
    setSymbol(resolvedSymbol);
    setName(selectedStock.name);
    setMarket('KR');
    setSearchQuery(selectedStock.name);
    setShowSuggestions(false);
    if (!purchasePrice) {
      setPurchasePrice(selectedStock.price.toString());
    }
    await handleLookupQuote(resolvedSymbol, 'KR');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedSymbol = symbol.trim().toUpperCase();
    const resolvedName = name.trim();
    const resolvedQuantity = Number(quantity);
    const resolvedPurchasePrice = Number(purchasePrice);
    let resolvedCurrentPrice = Number(currentPrice);

    if (!resolvedSymbol || !resolvedName || !Number.isFinite(resolvedQuantity) || !Number.isFinite(resolvedPurchasePrice)) {
      return;
    }

    if (!Number.isFinite(resolvedCurrentPrice) || resolvedCurrentPrice <= 0) {
      const fetched = await handleLookupQuote(resolvedSymbol, market);
      if (!fetched) {
        return;
      }
      resolvedCurrentPrice = fetched.price;
    }

    onSave(
      resolvedSymbol,
      resolvedName,
      market,
      resolvedQuantity,
      resolvedPurchasePrice,
      resolvedCurrentPrice
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {stock ? '종목 수정' : '종목 추가'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="market" className="mb-2 block text-sm font-medium text-gray-700">
                시장
              </label>
              <select
                id="market"
                value={market}
                onChange={(e) => {
                  setMarket(e.target.value as MarketType);
                  setQuote(null);
                  setQuoteError('');
                  setSearchQuery('');
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="KR">국내 주식</option>
                <option value="US">해외 주식</option>
              </select>
            </div>

            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                종목 검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder={market === 'KR' ? '삼성전자 또는 종목코드 검색' : '해외 종목은 코드로 직접 입력'}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              {market === 'KR' && showSuggestions && searchQuery && filteredStocks.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredStocks.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => void handleSelectStock(item)}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{item.symbol}</span>
                        <span>{item.price.toLocaleString()}원</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="stock-symbol" className="mb-2 block text-sm font-medium text-gray-700">
                종목 코드
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="stock-symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder={market === 'KR' ? '005930' : 'AAPL.O'}
                  required
                />
                <button
                  type="button"
                  onClick={() => void handleLookupQuote()}
                  disabled={isFetchingQuote}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
                >
                  {isFetchingQuote ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  현재가 조회
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="stock-name" className="mb-2 block text-sm font-medium text-gray-700">
                종목명
              </label>
              <input
                type="text"
                id="stock-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder={market === 'KR' ? '삼성전자' : 'Apple Inc.'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="stock-quantity" className="mb-2 block text-sm font-medium text-gray-700">
                보유 수량
              </label>
              <input
                type="number"
                id="stock-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="10"
                min="1"
                required
              />
            </div>
            <div>
              <label htmlFor="purchase-price" className="mb-2 block text-sm font-medium text-gray-700">
                평균 단가
              </label>
              <input
                type="number"
                id="purchase-price"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder={market === 'KR' ? '70000' : '180'}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor="current-price" className="mb-2 block text-sm font-medium text-gray-700">
                현재가
              </label>
              <input
                type="number"
                id="current-price"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="조회 후 자동 입력됩니다"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {quoteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {quoteError}
            </div>
          )}

          {quote && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{quote.stockName ?? name ?? symbol}</div>
                  <div className="text-sm text-gray-600">{quote.exchangeName ?? market} · {quote.source ?? 'quote'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{quote.price.toLocaleString()} {quote.currency}</div>
                  <div className={`text-sm font-medium ${(quote.change ?? 0) >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {(quote.change ?? 0) >= 0 ? '+' : ''}{formatMetric(quote.change, ` ${quote.currency}`)}
                    {' '}
                    ({(quote.changePercent ?? 0) >= 0 ? '+' : ''}{formatMetric(quote.changePercent, '%')})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div><div className="text-gray-500">거래량</div><div className="font-medium text-gray-900">{formatMetric(quote.volume)}</div></div>
                <div><div className="text-gray-500">52주 최고</div><div className="font-medium text-gray-900">{formatMetric(quote.fiftyTwoWeekHigh, ` ${quote.currency}`)}</div></div>
                <div><div className="text-gray-500">PER</div><div className="font-medium text-gray-900">{formatMetric(quote.per)}</div></div>
                <div><div className="text-gray-500">PBR</div><div className="font-medium text-gray-900">{formatMetric(quote.pbr)}</div></div>
              </div>
            </div>
          )}

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
              {stock ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
