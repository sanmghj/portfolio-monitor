import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { MarketType, Stock } from '../types';

interface StockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    symbol: string,
    name: string,
    market: MarketType,
    quantity: number,
    purchasePrice: number
  ) => void | Promise<void>;
  stock?: Stock | null;
}

const MARKET_OPTIONS: Array<{ value: MarketType; label: string }> = [
  { value: 'KR', label: '\uAD6D\uB0B4 \uC8FC\uC2DD' },
  { value: 'US', label: '\uD574\uC678 \uC8FC\uC2DD' },
];

export function StockDialog({ isOpen, onClose, onSave, stock }: StockDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<MarketType>('KR');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (stock) {
      setSymbol(stock.symbol);
      setName(stock.name);
      setMarket((stock.market as MarketType) || 'KR');
      setQuantity(stock.quantity.toString());
      setPurchasePrice(stock.purchasePrice.toString());
    } else {
      setSymbol('');
      setName('');
      setMarket('KR');
      setQuantity('');
      setPurchasePrice('');
    }

    setIsSubmitting(false);
  }, [isOpen, stock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const resolvedSymbol = symbol.trim().toUpperCase();
    const resolvedName = name.trim();
    const resolvedQuantity = Number(quantity);
    const resolvedPurchasePrice = Number(purchasePrice);

    if (
      !resolvedSymbol ||
      !resolvedName ||
      !Number.isFinite(resolvedQuantity) ||
      !Number.isFinite(resolvedPurchasePrice)
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(resolvedSymbol, resolvedName, market, resolvedQuantity, resolvedPurchasePrice);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {stock ? '\uC885\uBAA9 \uC218\uC815' : '\uC885\uBAA9 \uCD94\uAC00'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div>
            <label htmlFor="market" className="mb-2 block text-sm font-medium text-gray-700">
              {'\uC2DC\uC7A5'}
            </label>
            <select
              id="market"
              value={market}
              onChange={(e) => setMarket(e.target.value as MarketType)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              {MARKET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="stock-symbol" className="mb-2 block text-sm font-medium text-gray-700">
                {'\uC885\uBAA9 \uCF54\uB4DC'}
              </label>
              <input
                id="stock-symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder={market === 'KR' ? '005930' : 'AAPL'}
                required
              />
            </div>

            <div>
              <label htmlFor="stock-name" className="mb-2 block text-sm font-medium text-gray-700">
                {'\uC885\uBAA9\uBA85'}
              </label>
              <input
                id="stock-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder={market === 'KR' ? '\uC0BC\uC131\uC804\uC790' : 'Apple Inc.'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="stock-quantity" className="mb-2 block text-sm font-medium text-gray-700">
                {'\uBCF4\uC720 \uC218\uB7C9'}
              </label>
              <input
                id="stock-quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="10"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="purchase-price" className="mb-2 block text-sm font-medium text-gray-700">
                {'\uD3C9\uADE0 \uB2E8\uAC00'}
              </label>
              <input
                id="purchase-price"
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder={market === 'KR' ? '70000' : '180'}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {
              '\uC885\uBAA9 \uAC80\uC0C9 \uAE30\uB2A5\uC740 \uC2E4\uC81C \uC2DC\uC7A5 \uAC80\uC0C9 API \uAE30\uC900\uC73C\uB85C \uB2E4\uC2DC \uBD99\uC77C \uC608\uC815\uC774\uBA70, \uD604\uC7AC\uB294 \uC9C1\uC811 \uC785\uB825 \uBC29\uC2DD\uB9CC \uC81C\uACF5\uD569\uB2C8\uB2E4.'
            }
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {
              '\uD604\uC7AC\uAC00\uB294 \uC885\uBAA9\uC744 \uCD94\uAC00\uD55C \uB4A4 \uC790\uB3D9\uC73C\uB85C \uC870\uD68C\uB418\uBA70, \uBAA9\uB85D\uC5D0\uC11C \uC0C8\uB85C\uACE0\uCE68 \uBC84\uD2BC\uC73C\uB85C \uB2E4\uC2DC \uAC31\uC2E0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
            }
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {'\uCDE8\uC18C'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '\uC800\uC7A5 \uC911...' : stock ? '\uC218\uC815' : '\uCD94\uAC00'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
