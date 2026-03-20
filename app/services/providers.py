from __future__ import annotations

import re
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus
from xml.etree import ElementTree

import httpx

from app.schemas import EarningsEvent, FxRateSnapshot, LatestPrice, NewsHeadline, QuoteSnapshot, SecuritySearchItem


class ProviderError(Exception):
    """Raised when an external provider fails."""


class BaseProvider:
    name = "base"

    async def fetch(self, *args, **kwargs):
        raise NotImplementedError


class NaverQuoteProvider(BaseProvider):
    name = "naver_mobile"
    domestic_basic_url = "https://m.stock.naver.com/api/stock/{symbol}/basic"
    domestic_integration_url = "https://m.stock.naver.com/api/stock/{symbol}/integration"
    world_basic_url = "https://api.stock.naver.com/stock/{symbol}/basic"

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://m.stock.naver.com/",
        "Accept": "application/json, text/plain, */*",
    }
    korean_unit_multipliers = {
        "\uc870": Decimal("1000000000000"),
        "\uc5b5": Decimal("100000000"),
        "\ub9cc": Decimal("10000"),
    }

    async def fetch_quote(self, symbol: str, market: str) -> QuoteSnapshot:
        normalized_symbol = symbol.upper().strip()
        normalized_market = market.upper().strip()

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=self.headers) as client:
            if normalized_market == "KR":
                basic = await self._get_json(client, self.domestic_basic_url.format(symbol=normalized_symbol))
                integration = await self._get_json(
                    client,
                    self.domestic_integration_url.format(symbol=normalized_symbol),
                    required=False,
                )
                return self._build_domestic_quote(normalized_symbol, basic, integration or {})

            basic = await self._get_json(client, self.world_basic_url.format(symbol=normalized_symbol))
            return self._build_world_quote(normalized_symbol, normalized_market, basic)

    async def _get_json(self, client: httpx.AsyncClient, url: str, required: bool = True) -> dict:
        try:
            response = await client.get(url)
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                return payload
            if required:
                raise ProviderError(f"Unexpected payload shape from {url}")
        except Exception as exc:  # noqa: BLE001
            if required:
                raise ProviderError(f"Failed to fetch quote data from {url}: {exc}") from exc
        return {}

    def _build_domestic_quote(self, symbol: str, basic: dict, integration: dict) -> QuoteSnapshot:
        price = self._to_decimal(basic.get("closePrice"))
        if price is None:
            raise ProviderError(f"Domestic quote is missing closePrice for {symbol}")

        quote_payload = {"basic": basic, "integration": integration}
        return QuoteSnapshot(
            symbol=symbol,
            market="KR",
            price=price,
            currency=self._extract_currency(basic, default="KRW"),
            as_of=self._parse_datetime(basic.get("localTradedAt")),
            stock_name=basic.get("stockName"),
            exchange_name=basic.get("stockExchangeName") or "KRX",
            change=self._to_decimal(basic.get("compareToPreviousClosePrice")),
            change_percent=self._to_decimal(basic.get("fluctuationsRatio")),
            open_price=self._pick_decimal(
                quote_payload,
                ("openPrice",),
                ("openPrice", "open"),
                ("\uc2dc\uac00", "open"),
            ),
            high_price=self._pick_decimal(
                quote_payload,
                ("highPrice",),
                ("highPrice", "high"),
                ("\uace0\uac00", "high"),
            ),
            low_price=self._pick_decimal(
                quote_payload,
                ("lowPrice",),
                ("lowPrice", "low"),
                ("\uc800\uac00", "low"),
            ),
            volume=self._pick_int(
                quote_payload,
                ("accumulatedTradingVolume", "accumulatedVolume"),
                ("accumulatedTradingVolume", "accumulatedVolume", "volume"),
                ("\uac70\ub798\ub7c9", "volume"),
            ),
            market_cap=self._pick_decimal(
                quote_payload,
                ("marketValue", "marketCap"),
                ("marketValue", "marketCap", "marketcap"),
                ("\uc2dc\uac00\ucd1d\uc561", "\uc2dc\ucd1d", "marketcap"),
            ),
            fifty_two_week_high=self._pick_decimal(
                quote_payload,
                ("highPriceOf52Weeks",),
                ("highPriceOf52Weeks", "fiftyTwoWeekHigh", "yearHigh"),
                ("52\uc8fc\ucd5c\uace0", "52\uc8fc\ucd5c\uace0\uac00", "52weekhigh"),
            ),
            fifty_two_week_low=self._pick_decimal(
                quote_payload,
                ("lowPriceOf52Weeks",),
                ("lowPriceOf52Weeks", "fiftyTwoWeekLow", "yearLow"),
                ("52\uc8fc\ucd5c\uc800", "52\uc8fc\ucd5c\uc800\uac00", "52weeklow"),
            ),
            per=self._pick_decimal(
                quote_payload,
                ("per",),
                ("per", "PER"),
                ("per", "\uc8fc\uac00\uc218\uc775\ube44\uc728"),
            ),
            pbr=self._pick_decimal(
                quote_payload,
                ("pbr",),
                ("pbr", "PBR"),
                ("pbr", "\uc8fc\uac00\uc21c\uc790\uc0b0\ube44\uc728"),
            ),
            source=self.name,
        )

    def _build_world_quote(self, symbol: str, market: str, basic: dict) -> QuoteSnapshot:
        price = self._to_decimal(basic.get("closePrice"))
        if price is None:
            raise ProviderError(f"World quote is missing closePrice for {symbol}")

        return QuoteSnapshot(
            symbol=symbol,
            market=market,
            price=price,
            currency=self._extract_currency(basic, default="USD"),
            as_of=self._parse_datetime(basic.get("localTradedAt")),
            stock_name=basic.get("stockName") or basic.get("stockNameEng"),
            exchange_name=basic.get("stockExchangeName"),
            change=self._to_decimal(basic.get("compareToPreviousClosePrice")),
            change_percent=self._to_decimal(basic.get("fluctuationsRatio")),
            open_price=self._pick_decimal(basic, ("openPrice",), ("openPrice", "open"), ("\uc2dc\uac00", "open")),
            high_price=self._pick_decimal(basic, ("highPrice",), ("highPrice", "high"), ("\uace0\uac00", "high")),
            low_price=self._pick_decimal(basic, ("lowPrice",), ("lowPrice", "low"), ("\uc800\uac00", "low")),
            volume=self._pick_int(
                basic,
                ("accumulatedTradingVolume",),
                ("accumulatedTradingVolume", "volume"),
                ("\uac70\ub798\ub7c9", "volume"),
            ),
            market_cap=self._pick_decimal(
                basic,
                ("marketValue", "marketCap"),
                ("marketValue", "marketCap", "marketcap"),
                ("\uc2dc\uac00\ucd1d\uc561", "\uc2dc\ucd1d", "marketcap"),
            ),
            fifty_two_week_high=self._pick_decimal(
                basic,
                ("highPriceOf52Weeks",),
                ("highPriceOf52Weeks", "fiftyTwoWeekHigh", "yearHigh"),
                ("52\uc8fc\ucd5c\uace0", "52\uc8fc\ucd5c\uace0\uac00", "52weekhigh"),
            ),
            fifty_two_week_low=self._pick_decimal(
                basic,
                ("lowPriceOf52Weeks",),
                ("lowPriceOf52Weeks", "fiftyTwoWeekLow", "yearLow"),
                ("52\uc8fc\ucd5c\uc800", "52\uc8fc\ucd5c\uc800\uac00", "52weeklow"),
            ),
            per=self._pick_decimal(basic, ("per",), ("per", "PER"), ("per", "\uc8fc\uac00\uc218\uc775\ube44\uc728")),
            pbr=self._pick_decimal(basic, ("pbr",), ("pbr", "PBR"), ("pbr", "\uc8fc\uac00\uc21c\uc790\uc0b0\ube44\uc728")),
            source=self.name,
        )

    def _extract_currency(self, payload: dict, default: str) -> str:
        currency = payload.get("currencyType")
        if isinstance(currency, dict):
            code = currency.get("code") or currency.get("currencyCode")
            if code:
                return str(code).upper()
        raw = payload.get("currency")
        return str(raw).upper() if raw else default

    def _parse_datetime(self, value: object) -> datetime:
        if not value:
            return datetime.now(UTC).replace(microsecond=0)
        text = str(value).strip()
        candidates = [text, text.replace(".", "-").replace("/", "-")]
        for candidate in candidates:
            try:
                parsed = datetime.fromisoformat(candidate.replace("Z", "+00:00"))
                return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
            except ValueError:
                continue
        for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y%m%d %H:%M", "%Y%m%d%H%M%S"):
            try:
                return datetime.strptime(text, fmt).replace(tzinfo=UTC)
            except ValueError:
                continue
        return datetime.now(UTC).replace(microsecond=0)

    def _to_decimal(self, value: object) -> Decimal | None:
        if value in (None, "", "-"):
            return None
        if isinstance(value, bool):
            return None
        if isinstance(value, Decimal):
            return value
        if isinstance(value, (int, float)):
            return Decimal(str(value))

        text = str(value).strip()
        if not text:
            return None

        unit_total = Decimal("0")
        normalized = text.replace(",", "").replace("%", "").strip()
        normalized = re.sub(r"\b[A-Z]{3,4}\b", "", normalized).strip()
        normalized = normalized.replace("\ubc30", "").replace("\uc6d0", "").replace("\uc8fc", "").strip()

        matched_unit = False
        for unit, multiplier in self.korean_unit_multipliers.items():
            for match in re.finditer(rf"([+-]?\d+(?:\.\d+)?){unit}", normalized):
                unit_total += Decimal(match.group(1)) * multiplier
                matched_unit = True
            normalized = re.sub(rf"([+-]?\d+(?:\.\d+)?){unit}", "", normalized)

        if matched_unit:
            remainder = re.sub(r"[^0-9.+-]", "", normalized)
            if remainder and remainder not in {"+", "-", ".", "+.", "-."}:
                try:
                    unit_total += Decimal(remainder)
                except (InvalidOperation, ValueError):
                    pass
            return unit_total

        cleaned = re.sub(r"[^0-9.+-]", "", normalized)
        if not cleaned or cleaned in {"+", "-", ".", "+.", "-."}:
            return None
        try:
            return Decimal(cleaned)
        except (InvalidOperation, ValueError):
            return None

    def _to_int(self, value: object) -> int | None:
        decimal_value = self._to_decimal(value)
        return int(decimal_value) if decimal_value is not None else None

    def _pick_decimal(
        self,
        payload: dict,
        direct_keys: tuple[str, ...],
        codes: tuple[str, ...],
        keywords: tuple[str, ...],
    ) -> Decimal | None:
        for key in direct_keys:
            if key in payload:
                value = self._to_decimal(payload.get(key))
                if value is not None:
                    return value
        found = self._search_metric_value(payload, codes, keywords)
        return self._to_decimal(found)

    def _pick_int(
        self,
        payload: dict,
        direct_keys: tuple[str, ...],
        codes: tuple[str, ...],
        keywords: tuple[str, ...],
    ) -> int | None:
        for key in direct_keys:
            if key in payload:
                value = self._to_int(payload.get(key))
                if value is not None:
                    return value
        found = self._search_metric_value(payload, codes, keywords)
        return self._to_int(found)

    def _search_metric_value(
        self,
        payload: object,
        codes: tuple[str, ...],
        keywords: tuple[str, ...],
    ) -> object | None:
        normalized_codes = {self._normalize_token(code) for code in codes if code}
        normalized_keywords = tuple(self._normalize_token(keyword) for keyword in keywords if keyword)

        def visit(node: object) -> object | None:
            if isinstance(node, list):
                for item in node:
                    result = visit(item)
                    if result not in (None, ""):
                        return result
                return None

            if not isinstance(node, dict):
                return None

            label_parts = [
                node.get("name"),
                node.get("title"),
                node.get("key"),
                node.get("code"),
                node.get("fieldName"),
                node.get("itemCode"),
                node.get("metricCode"),
            ]
            normalized_label = "".join(self._normalize_token(part) for part in label_parts if part)
            if normalized_label and normalized_label in normalized_codes:
                for value_key in ("value", "valueText", "formattedValue", "closePrice", "valueDesc"):
                    if value_key in node and node.get(value_key) not in (None, ""):
                        return node.get(value_key)
            if normalized_label and any(keyword in normalized_label for keyword in normalized_keywords):
                for value_key in ("value", "valueText", "formattedValue", "closePrice", "valueDesc"):
                    if value_key in node and node.get(value_key) not in (None, ""):
                        return node.get(value_key)

            for value in node.values():
                result = visit(value)
                if result not in (None, ""):
                    return result
            return None

        return visit(payload)

    def _normalize_token(self, value: object) -> str:
        return str(value).lower().replace(" ", "").replace("_", "").replace("-", "")


class YahooFinanceProvider(BaseProvider):
    name = "yahoo_finance"
    chart_url = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    summary_url = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=calendarEvents"
    search_url = "https://query2.finance.yahoo.com/v1/finance/search"

    def _candidate_tickers(self, symbol: str, market: str) -> list[str]:
        normalized_symbol = symbol.upper().strip()
        normalized_market = market.upper().strip()
        if normalized_market == "US":
            return [normalized_symbol]
        if normalized_market == "KR":
            return [f"{normalized_symbol}.KS", f"{normalized_symbol}.KQ", normalized_symbol]
        return [normalized_symbol]


    async def search_securities(self, query: str, market: str, limit: int = 10) -> list[SecuritySearchItem]:
        normalized_query = query.strip()
        normalized_market = market.upper().strip()
        if not normalized_query:
            return []

        params = {
            "q": normalized_query,
            "quotesCount": max(limit * 2, 10),
            "newsCount": 0,
            "listsCount": 0,
            "enableFuzzyQuery": True,
            "enableYahooFinancePredefinedScreener": False,
        }

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            try:
                response = await client.get(self.search_url, params=params)
                response.raise_for_status()
                payload = response.json()
            except Exception as exc:  # noqa: BLE001
                raise ProviderError(f"Failed to search securities for {query}/{market}: {exc}") from exc

        quotes = payload.get("quotes", [])
        items: list[SecuritySearchItem] = []
        seen: set[tuple[str, str]] = set()

        for quote in quotes:
            quote_type = str(quote.get("quoteType") or "").upper()
            if quote_type not in {"EQUITY", "ETF"}:
                continue

            symbol = str(quote.get("symbol") or "").upper().strip()
            name = str(quote.get("shortname") or quote.get("longname") or quote.get("symbol") or "").strip()
            if not symbol or not name:
                continue

            resolved_market = self._resolve_search_market(symbol, quote)
            if normalized_market != "ALL" and resolved_market != normalized_market:
                continue

            normalized_symbol = self._normalize_search_symbol(symbol, resolved_market)
            key = (normalized_symbol, resolved_market)
            if key in seen:
                continue
            seen.add(key)

            items.append(
                SecuritySearchItem(
                    symbol=normalized_symbol,
                    name=name,
                    market=resolved_market,
                    exchange_name=quote.get("exchDisp") or quote.get("exchange") or quote.get("exchangeDisplay"),
                    currency=quote.get("currency"),
                    type=quote_type.lower(),
                )
            )
            if len(items) >= limit:
                break

        return items

    def _resolve_search_market(self, symbol: str, payload: dict) -> str:
        normalized_symbol = symbol.upper()
        exchange = str(payload.get("exchange") or "").upper()
        if normalized_symbol.endswith(".KS") or normalized_symbol.endswith(".KQ"):
            return "KR"
        if exchange in {"KSC", "KOE", "KOS", "KON"}:
            return "KR"
        return "US"

    def _normalize_search_symbol(self, symbol: str, market: str) -> str:
        normalized_symbol = symbol.upper().strip()
        if market == "KR" and normalized_symbol.endswith((".KS", ".KQ")):
            return normalized_symbol[:-3]
        return normalized_symbol
    async def fetch_exchange_rate(self, base_currency: str, quote_currency: str) -> FxRateSnapshot:
        normalized_base = base_currency.upper().strip()
        normalized_quote = quote_currency.upper().strip()
        if normalized_base == normalized_quote:
            return FxRateSnapshot(
                base_currency=normalized_base,
                quote_currency=normalized_quote,
                rate=Decimal('1'),
                as_of=datetime.now(UTC).replace(microsecond=0),
                source=self.name,
            )

        ticker_candidates = self._currency_pair_tickers(normalized_base, normalized_quote)
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            last_error: Exception | None = None
            for ticker, invert in ticker_candidates:
                try:
                    response = await client.get(self.chart_url.format(ticker=ticker))
                    response.raise_for_status()
                    payload = response.json()
                    result = payload.get('chart', {}).get('result', [])
                    if not result:
                        continue
                    meta = result[0].get('meta', {})
                    price = meta.get('regularMarketPrice') or meta.get('previousClose')
                    market_time = meta.get('regularMarketTime')
                    if price is None or not market_time:
                        continue

                    rate = Decimal(str(price))
                    if invert:
                        rate = Decimal('1') / rate

                    return FxRateSnapshot(
                        base_currency=normalized_base,
                        quote_currency=normalized_quote,
                        rate=rate,
                        as_of=datetime.fromtimestamp(int(market_time), tz=UTC),
                        source=self.name,
                    )
                except Exception as exc:  # noqa: BLE001
                    last_error = exc

        raise ProviderError(
            f'Failed to fetch exchange rate for {normalized_base}/{normalized_quote}: {last_error}'
        )

    def _currency_pair_tickers(self, base_currency: str, quote_currency: str) -> list[tuple[str, bool]]:
        if base_currency == 'USD' and quote_currency == 'KRW':
            return [('KRW=X', False), ('USDKRW=X', False)]
        if base_currency == 'KRW' and quote_currency == 'USD':
            return [('KRW=X', True), ('USDKRW=X', True)]
        return [(f'{base_currency}{quote_currency}=X', False)]

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


