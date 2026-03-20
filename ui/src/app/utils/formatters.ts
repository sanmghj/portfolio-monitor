export function formatMetric(value?: number, suffix = '') {
  if (value === undefined || value === null) return '-';
  return `${value.toLocaleString()}${suffix}`;
}

export function formatMarketCap(value?: number, currency = 'KRW') {
  if (value === undefined || value === null) return '-';

  if (currency === 'KRW') {
    const trillion = 1_0000_0000_0000;
    const hundredMillion = 1_0000_0000;

    if (value >= trillion) {
      const jo = Math.floor(value / trillion);
      const eok = Math.round((value % trillion) / hundredMillion);
      return eok > 0 ? `${jo}\uC870 ${eok.toLocaleString()}\uC5B5` : `${jo}\uC870`;
    }

    if (value >= hundredMillion) {
      return `${Math.round(value / hundredMillion).toLocaleString()}\uC5B5`;
    }
  }

  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T ${currency}`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B ${currency}`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M ${currency}`;
  }
  return `${value.toLocaleString()} ${currency}`;
}
