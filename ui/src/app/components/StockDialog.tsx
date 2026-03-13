import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import type { Stock } from '../types';
import { koreanStockSamples } from '../utils/mockData';

interface StockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    symbol: string,
    name: string,
    quantity: number,
    purchasePrice: number,
    currentPrice: number
  ) => void;
  stock?: Stock | null;
}

export function StockDialog({ isOpen, onClose, onSave, stock }: StockDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (stock) {
      setSymbol(stock.symbol);
      setName(stock.name);
      setQuantity(stock.quantity.toString());
      setPurchasePrice(stock.purchasePrice.toString());
      setCurrentPrice(stock.currentPrice.toString());
    } else {
      setSymbol('');
      setName('');
      setQuantity('');
      setPurchasePrice('');
      setCurrentPrice('');
    }
    setSearchQuery('');
    setShowSuggestions(false);
  }, [stock, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol && name && quantity && purchasePrice && currentPrice) {
      onSave(
        symbol,
        name,
        parseInt(quantity),
        parseInt(purchasePrice),
        parseInt(currentPrice)
      );
    }
  };

  const filteredStocks = koreanStockSamples.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.symbol.includes(searchQuery)
  );

  const handleSelectStock = (selectedStock: typeof koreanStockSamples[0]) => {
    setSymbol(selectedStock.symbol);
    setName(selectedStock.name);
    setCurrentPrice(selectedStock.price.toString());
    if (!purchasePrice) {
      setPurchasePrice(selectedStock.price.toString());
    }
    setSearchQuery(selectedStock.name);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {stock ? '종목 수정' : '종목 추가'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="종목명 또는 코드로 검색"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            {showSuggestions && searchQuery && filteredStocks.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredStocks.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => handleSelectStock(s)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>{s.symbol}</span>
                      <span>{s.price.toLocaleString()}원</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stock-symbol" className="block text-sm font-medium text-gray-700 mb-2">
                종목 코드
              </label>
              <input
                type="text"
                id="stock-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="005930"
                required
              />
            </div>

            <div>
              <label htmlFor="stock-name" className="block text-sm font-medium text-gray-700 mb-2">
                종목명
              </label>
              <input
                type="text"
                id="stock-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="삼성전자"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="stock-quantity" className="block text-sm font-medium text-gray-700 mb-2">
              보유 수량
            </label>
            <input
              type="number"
              id="stock-quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="10"
              min="1"
              required
            />
          </div>

          <div>
            <label htmlFor="purchase-price" className="block text-sm font-medium text-gray-700 mb-2">
              매입가 (원)
            </label>
            <input
              type="number"
              id="purchase-price"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="70000"
              min="0"
              required
            />
          </div>

          <div>
            <label htmlFor="current-price" className="block text-sm font-medium text-gray-700 mb-2">
              현재가 (원)
            </label>
            <input
              type="number"
              id="current-price"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="72000"
              min="0"
              required
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
              {stock ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
