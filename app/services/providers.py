from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus
from xml.etree import ElementTree

import httpx

from app.schemas import EarningsEvent, LatestPrice, NewsHeadline


class ProviderError(Exception):
    """Raised when an external provider fails."""


class BaseProvider:
    name = "base"

    async def fetch(self, *args, **kwargs):
        raise NotImplementedError


class YahooFinanceProvider(BaseProvider):
    name = "yahoo_finance"
    chart_url = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    summary_url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=calendarEvents"

    def _candidate_tickers(self, symbol: str, market: str) -> list[str]:
        normalized_symbol = symbol.upper().strip()
        normalized_market = market.upper().strip()
        if normalized_market == "US":
            return [normalized_symbol]
        if normalized_market == "KR":
            return [f"{normalized_symbol}.KS", f"{normalized_symbol}.KQ", normalized_symbol]
        return [normalized_symbol]

    async def fetch_price(self, symbol: str, market: str) -> LatestPrice:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            last_error: Exception | None = None
            for ticker in self._candidate_tickers(symbol, market):
                try:
                    response = await client.get(self.chart_url.format(ticker=ticker))
                    response.raise_for_status()
                    payload = response.json()
                    result = payload.get("chart", {}).get("result", [])
                    if not result:
                        continue
                    meta = result[0].get("meta", {})
                    price = meta.get("regularMarketPrice") or meta.get("previousClose")
                    currency = meta.get("currency")
                    market_time = meta.get("regularMarketTime")
                    if price is None or not currency or not market_time:
                        continue
                    return LatestPrice(
                        symbol=symbol.upper(),
                        market=market.upper(),
                        price=Decimal(str(price)),
                        currency=currency.upper(),
                        as_of=datetime.fromtimestamp(int(market_time), tz=UTC),
                    )
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
            raise ProviderError(f"Failed to fetch price for {symbol}/{market}: {last_error}")

    async def fetch_events(self, symbol: str, market: str) -> list[EarningsEvent]:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            last_error: Exception | None = None
            for ticker in self._candidate_tickers(symbol, market):
                try:
                    response = await client.get(self.summary_url.format(ticker=ticker))
                    response.raise_for_status()
                    payload = response.json()
                    result = payload.get("quoteSummary", {}).get("result", [])
                    if not result:
                        continue
                    earnings_date = (
                        result[0]
                        .get("calendarEvents", {})
                        .get("earnings", {})
                        .get("earningsDate", [])
                    )
                    events: list[EarningsEvent] = []
                    for index, item in enumerate(earnings_date, start=1):
                        raw = item.get("raw")
                        if raw is None:
                            continue
                        events.append(
                            EarningsEvent(
                                id=index,
                                symbol=symbol.upper(),
                                market=market.upper(),
                                event_type="earnings",
                                event_date=datetime.fromtimestamp(int(raw), tz=UTC),
                                source=self.name,
                            )
                        )
                    if events:
                        return events
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
            if last_error is not None:
                raise ProviderError(f"Failed to fetch events for {symbol}/{market}: {last_error}")
            return []


class GoogleNewsProvider(BaseProvider):
    name = "google_news"
    rss_url = "https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"

    async def fetch_news(self, symbol: str, name: str, market: str) -> list[NewsHeadline]:
        query = quote_plus(f'"{symbol}" OR "{name}" when:30d')
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            try:
                response = await client.get(self.rss_url.format(query=query))
                response.raise_for_status()
                root = ElementTree.fromstring(response.text)
            except Exception as exc:  # noqa: BLE001
                raise ProviderError(f"Failed to fetch news for {symbol}/{market}: {exc}") from exc

        items = root.findall("./channel/item")
        headlines: list[NewsHeadline] = []
        for index, item in enumerate(items[:5], start=1):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            published_at = item.findtext("pubDate")
            source = item.findtext("source")
            if not title or not link or not published_at:
                continue
            parsed_date = parsedate_to_datetime(published_at)
            if parsed_date.tzinfo is None:
                parsed_date = parsed_date.replace(tzinfo=UTC)
            headlines.append(
                NewsHeadline(
                    id=index,
                    symbol=symbol.upper(),
                    market=market.upper(),
                    headline=title,
                    url=link,
                    published_at=parsed_date.astimezone(UTC),
                    source=(source or self.name).strip(),
                )
            )
        return headlines
