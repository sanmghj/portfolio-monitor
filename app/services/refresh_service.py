from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.schemas import EarningsEvent, Holding, LatestPrice, NewsHeadline
from app.services.providers import GoogleNewsProvider, ProviderError, YahooFinanceProvider
from app.storage.csv_store import CsvStore


class RefreshService:
    def __init__(self, store: CsvStore) -> None:
        self.store = store
        self.market_provider = YahooFinanceProvider()
        self.news_provider = GoogleNewsProvider()

    async def refresh_prices(self) -> dict[str, object]:
        holdings = self._unique_holdings(self.store.read_holdings())
        updated = 0
        failed: list[str] = []
        for holding in holdings:
            try:
                latest_price = await self.market_provider.fetch_price(holding.symbol, holding.market)
            except ProviderError as exc:
                failed.append(str(exc))
                latest_price = self._fallback_price(holding)
            self.store.replace_latest_price(latest_price)
            updated += 1
        return {"status": "ok", "updated": updated, "failed": failed}

    async def refresh_events(self) -> dict[str, object]:
        holdings = self._unique_holdings(self.store.read_holdings())
        updated = 0
        failed: list[str] = []
        for holding in holdings:
            try:
                events = await self.market_provider.fetch_events(holding.symbol, holding.market)
            except ProviderError as exc:
                failed.append(str(exc))
                events = self._fallback_events(holding)
            self.store.replace_earnings_events(holding.symbol, holding.market, events)
            updated += 1
        return {"status": "ok", "updated": updated, "failed": failed}

    async def refresh_news(self) -> dict[str, object]:
        holdings = self._unique_holdings(self.store.read_holdings())
        updated = 0
        failed: list[str] = []
        for holding in holdings:
            try:
                headlines = await self.news_provider.fetch_news(holding.symbol, holding.name, holding.market)
            except ProviderError as exc:
                failed.append(str(exc))
                headlines = self._fallback_news(holding)
            self.store.replace_news_headlines(holding.symbol, holding.market, headlines)
            updated += 1
        return {"status": "ok", "updated": updated, "failed": failed}

    async def refresh_holding_insights(self, holding: Holding) -> dict[str, object]:
        failed: list[str] = []
        updated = {"price": False, "events": False, "news": False}

        try:
            latest_price = await self.market_provider.fetch_price(holding.symbol, holding.market)
        except ProviderError as exc:
            failed.append(str(exc))
            latest_price = self._fallback_price(holding)
        self.store.replace_latest_price(latest_price)
        updated["price"] = True

        try:
            events = await self.market_provider.fetch_events(holding.symbol, holding.market)
        except ProviderError as exc:
            failed.append(str(exc))
            events = self._fallback_events(holding)
        self.store.replace_earnings_events(holding.symbol, holding.market, events)
        updated["events"] = True

        try:
            headlines = await self.news_provider.fetch_news(holding.symbol, holding.name, holding.market)
        except ProviderError as exc:
            failed.append(str(exc))
            headlines = self._fallback_news(holding)
        self.store.replace_news_headlines(holding.symbol, holding.market, headlines)
        updated["news"] = True

        return {"status": "ok" if any(updated.values()) else "error", "updated": updated, "failed": failed}

    @staticmethod
    def _unique_holdings(holdings: list[Holding]) -> list[Holding]:
        unique: dict[tuple[str, str], Holding] = {}
        for holding in holdings:
            unique[(holding.symbol.upper(), holding.market.upper())] = holding
        return list(unique.values())

    @staticmethod
    def _fallback_price(holding: Holding) -> LatestPrice:
        return LatestPrice(
            symbol=holding.symbol.upper(),
            market=holding.market.upper(),
            price=Decimal(str(holding.avg_price)),
            currency=holding.currency.upper(),
            as_of=datetime.now(UTC).replace(microsecond=0),
        )

    @staticmethod
    def _fallback_events(holding: Holding) -> list[EarningsEvent]:
        now = datetime.now(UTC).replace(microsecond=0)
        return [
            EarningsEvent(
                id=1,
                symbol=holding.symbol.upper(),
                market=holding.market.upper(),
                event_type="offline review",
                event_date=now + timedelta(days=7),
                source="offline_fallback",
            )
        ]

    @staticmethod
    def _fallback_news(holding: Holding) -> list[NewsHeadline]:
        now = datetime.now(UTC).replace(microsecond=0)
        return [
            NewsHeadline(
                id=1,
                symbol=holding.symbol.upper(),
                market=holding.market.upper(),
                headline=f"{holding.name} ({holding.symbol}) offline snapshot created",
                url="#",
                published_at=now,
                source="offline_fallback",
            )
        ]
