from __future__ import annotations

import csv
from collections.abc import Iterable
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path

from app.config import settings
from app.schemas import (
    EarningsEvent,
    Holding,
    HoldingCreate,
    HoldingUpdate,
    LatestPrice,
    NewsHeadline,
    Portfolio,
    PortfolioCreate,
    PortfolioUpdate,
    User,
    UserCreate,
)
from app.storage.file_lock import file_lock


CSV_ENCODING = "utf-8-sig"


class CsvStore:
    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or settings.data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.users_path = self.data_dir / "users.csv"
        self.portfolios_path = self.data_dir / "portfolios.csv"
        self.holdings_path = self.data_dir / "holdings.csv"
        self.latest_prices_path = self.data_dir / "latest_prices.csv"
        self.earnings_events_path = self.data_dir / "earnings_events.csv"
        self.news_headlines_path = self.data_dir / "news_headlines.csv"

        self._ensure_files()

    def _ensure_files(self) -> None:
        specs = {
            self.users_path: ["id", "name", "birth_date", "email"],
            self.portfolios_path: [
                "id",
                "user_id",
                "name",
                "portfolio_type",
                "base_currency",
                "monthly_budget",
                "target_weight",
            ],
            self.holdings_path: [
                "id",
                "user_id",
                "portfolio_id",
                "symbol",
                "name",
                "market",
                "currency",
                "quantity",
                "avg_price",
                "created_at",
            ],
            self.latest_prices_path: ["symbol", "market", "price", "currency", "as_of"],
            self.earnings_events_path: ["id", "symbol", "market", "event_type", "event_date", "source"],
            self.news_headlines_path: [
                "id",
                "symbol",
                "market",
                "headline",
                "url",
                "published_at",
                "source",
            ],
        }

        for path, fieldnames in specs.items():
            if not path.exists():
                self._write_rows(path, fieldnames, [])

        if not self.read_users():
            self.seed_defaults()

    def seed_defaults(self) -> None:
        self._write_rows(
            self.users_path,
            ["id", "name", "birth_date", "email"],
            [{"id": "1", "name": "Default User", "birth_date": "1990-01-01", "email": "local@example.com"}],
        )
        self._write_rows(
            self.portfolios_path,
            ["id", "user_id", "name", "portfolio_type", "base_currency", "monthly_budget", "target_weight"],
            [
                {
                    "id": "1",
                    "user_id": "1",
                    "name": "Dividend Portfolio",
                    "portfolio_type": "dividend",
                    "base_currency": "KRW",
                    "monthly_budget": "1000000",
                    "target_weight": "50",
                },
                {
                    "id": "2",
                    "user_id": "1",
                    "name": "General Portfolio",
                    "portfolio_type": "general",
                    "base_currency": "KRW",
                    "monthly_budget": "1000000",
                    "target_weight": "50",
                },
            ],
        )

    def _read_rows(self, path: Path) -> list[dict[str, str]]:
        if not path.exists():
            return []

        with path.open("r", encoding=CSV_ENCODING, newline="") as file:
            reader = csv.DictReader(file)
            return [dict(row) for row in reader]

    def _write_rows(self, path: Path, fieldnames: list[str], rows: Iterable[dict[str, str]]) -> None:
        with file_lock(path):
            with path.open("w", encoding=CSV_ENCODING, newline="") as file:
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                for row in rows:
                    writer.writerow(row)

    def read_users(self) -> list[User]:
        rows = self._read_rows(self.users_path)
        return [
            User(
                id=int(row["id"]),
                name=row["name"],
                birth_date=row["birth_date"],
                email=row.get("email") or None,
            )
            for row in rows
        ]

    def user_exists(self, user_id: int) -> bool:
        return any(user.id == user_id for user in self.read_users())

    def create_user(self, payload: UserCreate) -> User:
        rows = self._read_rows(self.users_path)
        next_id = max((int(row["id"]) for row in rows), default=0) + 1
        row = {
            "id": str(next_id),
            "name": payload.name,
            "birth_date": payload.birth_date.isoformat(),
            "email": payload.email or "",
        }
        rows.append(row)
        self._write_rows(self.users_path, ["id", "name", "birth_date", "email"], rows)
        return User(
            id=next_id,
            name=payload.name,
            birth_date=payload.birth_date,
            email=payload.email,
        )

    def find_user_by_profile(self, name: str, birth_date: str) -> User | None:
        normalized_name = name.strip().lower()
        for user in self.read_users():
            if user.name.strip().lower() == normalized_name and user.birth_date.isoformat() == birth_date:
                return user
        return None

    def read_portfolios(self, user_id: int | None = None) -> list[Portfolio]:
        rows = self._read_rows(self.portfolios_path)
        portfolios = [
            Portfolio(
                id=int(row["id"]),
                user_id=int(row["user_id"]),
                name=row["name"],
                portfolio_type=row["portfolio_type"],
                base_currency=row.get("base_currency") or "KRW",
                monthly_budget=Decimal(row["monthly_budget"]) if row.get("monthly_budget") else None,
                target_weight=Decimal(row["target_weight"]) if row.get("target_weight") else None,
            )
            for row in rows
        ]
        if user_id is not None:
            portfolios = [portfolio for portfolio in portfolios if portfolio.user_id == user_id]
        return portfolios

    def create_portfolio(self, user_id: int, payload: PortfolioCreate) -> Portfolio:
        rows = self._read_rows(self.portfolios_path)
        next_id = max((int(row["id"]) for row in rows), default=0) + 1
        row = {
            "id": str(next_id),
            "user_id": str(user_id),
            "name": payload.name,
            "portfolio_type": payload.portfolio_type.value,
            "base_currency": payload.base_currency.upper(),
            "monthly_budget": str(payload.monthly_budget) if payload.monthly_budget is not None else "",
            "target_weight": str(payload.target_weight) if payload.target_weight is not None else "",
        }
        rows.append(row)
        self._write_rows(
            self.portfolios_path,
            ["id", "user_id", "name", "portfolio_type", "base_currency", "monthly_budget", "target_weight"],
            rows,
        )
        return Portfolio(
            id=next_id,
            user_id=user_id,
            name=payload.name,
            portfolio_type=payload.portfolio_type,
            base_currency=payload.base_currency.upper(),
            monthly_budget=payload.monthly_budget,
            target_weight=payload.target_weight,
        )

    def update_portfolio(self, user_id: int, portfolio_id: int, payload: PortfolioUpdate) -> Portfolio | None:
        rows = self._read_rows(self.portfolios_path)
        updated_row: dict[str, str] | None = None

        for row in rows:
            if int(row["id"]) == portfolio_id and int(row["user_id"]) == user_id:
                row["name"] = payload.name
                row["portfolio_type"] = payload.portfolio_type.value
                row["base_currency"] = payload.base_currency.upper()
                row["monthly_budget"] = str(payload.monthly_budget) if payload.monthly_budget is not None else ""
                row["target_weight"] = str(payload.target_weight) if payload.target_weight is not None else ""
                updated_row = row
                break

        if updated_row is None:
            return None

        self._write_rows(
            self.portfolios_path,
            ["id", "user_id", "name", "portfolio_type", "base_currency", "monthly_budget", "target_weight"],
            rows,
        )
        return Portfolio(
            id=int(updated_row["id"]),
            user_id=int(updated_row["user_id"]),
            name=updated_row["name"],
            portfolio_type=updated_row["portfolio_type"],
            base_currency=updated_row["base_currency"],
            monthly_budget=Decimal(updated_row["monthly_budget"]) if updated_row.get("monthly_budget") else None,
            target_weight=Decimal(updated_row["target_weight"]) if updated_row.get("target_weight") else None,
        )

    def delete_portfolio(self, user_id: int, portfolio_id: int) -> bool:
        portfolio_rows = self._read_rows(self.portfolios_path)
        original_count = len(portfolio_rows)
        portfolio_rows = [
            row
            for row in portfolio_rows
            if not (int(row["id"]) == portfolio_id and int(row["user_id"]) == user_id)
        ]
        if len(portfolio_rows) == original_count:
            return False

        self._write_rows(
            self.portfolios_path,
            ["id", "user_id", "name", "portfolio_type", "base_currency", "monthly_budget", "target_weight"],
            portfolio_rows,
        )

        holding_rows = self._read_rows(self.holdings_path)
        holding_rows = [
            row
            for row in holding_rows
            if not (int(row["portfolio_id"]) == portfolio_id and int(row["user_id"]) == user_id)
        ]
        self._write_rows(
            self.holdings_path,
            ["id", "user_id", "portfolio_id", "symbol", "name", "market", "currency", "quantity", "avg_price", "created_at"],
            holding_rows,
        )
        return True

    def read_holdings(self, user_id: int | None = None, portfolio_id: int | None = None) -> list[Holding]:
        rows = self._read_rows(self.holdings_path)
        holdings = [
            Holding(
                id=int(row["id"]),
                user_id=int(row["user_id"]),
                portfolio_id=int(row["portfolio_id"]),
                symbol=row["symbol"],
                name=row["name"],
                market=row["market"],
                currency=row["currency"],
                quantity=Decimal(row["quantity"]),
                avg_price=Decimal(row["avg_price"]),
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]
        if user_id is not None:
            holdings = [holding for holding in holdings if holding.user_id == user_id]
        if portfolio_id is not None:
            holdings = [holding for holding in holdings if holding.portfolio_id == portfolio_id]
        return holdings

    def get_holding(self, user_id: int, holding_id: int) -> Holding | None:
        for holding in self.read_holdings(user_id=user_id):
            if holding.id == holding_id:
                return holding
        return None

    def create_holding(self, user_id: int, payload: HoldingCreate) -> Holding:
        rows = self._read_rows(self.holdings_path)
        next_id = max((int(row["id"]) for row in rows), default=0) + 1
        now = datetime.now(UTC).replace(microsecond=0)

        row = {
            "id": str(next_id),
            "user_id": str(user_id),
            "portfolio_id": str(payload.portfolio_id),
            "symbol": payload.symbol.upper(),
            "name": payload.name,
            "market": payload.market.upper(),
            "currency": payload.currency.upper(),
            "quantity": str(payload.quantity),
            "avg_price": str(payload.avg_price),
            "created_at": now.isoformat(),
        }
        rows.append(row)
        self._write_rows(
            self.holdings_path,
            ["id", "user_id", "portfolio_id", "symbol", "name", "market", "currency", "quantity", "avg_price", "created_at"],
            rows,
        )
        return Holding(
            id=next_id,
            user_id=user_id,
            portfolio_id=payload.portfolio_id,
            symbol=payload.symbol.upper(),
            name=payload.name,
            market=payload.market.upper(),
            currency=payload.currency.upper(),
            quantity=payload.quantity,
            avg_price=payload.avg_price,
            created_at=now,
        )

    def update_holding(self, user_id: int, holding_id: int, payload: HoldingUpdate) -> Holding | None:
        rows = self._read_rows(self.holdings_path)
        updated_row: dict[str, str] | None = None

        for row in rows:
            if int(row["id"]) == holding_id and int(row["user_id"]) == user_id:
                row["portfolio_id"] = str(payload.portfolio_id)
                row["symbol"] = payload.symbol.upper()
                row["name"] = payload.name
                row["market"] = payload.market.upper()
                row["currency"] = payload.currency.upper()
                row["quantity"] = str(payload.quantity)
                row["avg_price"] = str(payload.avg_price)
                updated_row = row
                break

        if updated_row is None:
            return None

        self._write_rows(
            self.holdings_path,
            ["id", "user_id", "portfolio_id", "symbol", "name", "market", "currency", "quantity", "avg_price", "created_at"],
            rows,
        )

        return Holding(
            id=int(updated_row["id"]),
            user_id=int(updated_row["user_id"]),
            portfolio_id=int(updated_row["portfolio_id"]),
            symbol=updated_row["symbol"],
            name=updated_row["name"],
            market=updated_row["market"],
            currency=updated_row["currency"],
            quantity=Decimal(updated_row["quantity"]),
            avg_price=Decimal(updated_row["avg_price"]),
            created_at=datetime.fromisoformat(updated_row["created_at"]),
        )

    def delete_holding(self, user_id: int, holding_id: int) -> bool:
        rows = self._read_rows(self.holdings_path)
        original_count = len(rows)
        rows = [
            row
            for row in rows
            if not (int(row["id"]) == holding_id and int(row["user_id"]) == user_id)
        ]
        if len(rows) == original_count:
            return False

        self._write_rows(
            self.holdings_path,
            ["id", "user_id", "portfolio_id", "symbol", "name", "market", "currency", "quantity", "avg_price", "created_at"],
            rows,
        )
        return True

    def read_latest_prices(self) -> dict[tuple[str, str], dict[str, str]]:
        rows = self._read_rows(self.latest_prices_path)
        prices: dict[tuple[str, str], dict[str, str]] = {}
        for row in rows:
            prices[(row["symbol"].upper(), row["market"].upper())] = row
        return prices

    def replace_latest_price(self, payload: LatestPrice) -> None:
        rows = [
            row
            for row in self._read_rows(self.latest_prices_path)
            if not (row["symbol"].upper() == payload.symbol.upper() and row["market"].upper() == payload.market.upper())
        ]
        rows.append(
            {
                "symbol": payload.symbol.upper(),
                "market": payload.market.upper(),
                "price": str(payload.price),
                "currency": payload.currency.upper(),
                "as_of": payload.as_of.isoformat(),
            }
        )
        self._write_rows(self.latest_prices_path, ["symbol", "market", "price", "currency", "as_of"], rows)

    def get_latest_price(self, symbol: str, market: str) -> LatestPrice | None:
        row = self.read_latest_prices().get((symbol.upper(), market.upper()))
        if row is None:
            return None
        return LatestPrice(
            symbol=row["symbol"],
            market=row["market"],
            price=Decimal(row["price"]),
            currency=row["currency"],
            as_of=datetime.fromisoformat(row["as_of"]),
        )

    def read_earnings_events(self, symbol: str, market: str) -> list[EarningsEvent]:
        rows = self._read_rows(self.earnings_events_path)
        events = [
            EarningsEvent(
                id=int(row["id"]),
                symbol=row["symbol"],
                market=row["market"],
                event_type=row["event_type"],
                event_date=datetime.fromisoformat(row["event_date"]),
                source=row.get("source") or None,
            )
            for row in rows
            if row["symbol"].upper() == symbol.upper() and row["market"].upper() == market.upper()
        ]
        return sorted(events, key=lambda item: item.event_date)

    def replace_earnings_events(self, symbol: str, market: str, events: list[EarningsEvent]) -> None:
        rows = [
            row
            for row in self._read_rows(self.earnings_events_path)
            if not (row["symbol"].upper() == symbol.upper() and row["market"].upper() == market.upper())
        ]
        for event in events:
            rows.append(
                {
                    "id": str(event.id),
                    "symbol": event.symbol.upper(),
                    "market": event.market.upper(),
                    "event_type": event.event_type,
                    "event_date": event.event_date.isoformat(),
                    "source": event.source or "",
                }
            )
        self._write_rows(
            self.earnings_events_path,
            ["id", "symbol", "market", "event_type", "event_date", "source"],
            rows,
        )

    def read_news_headlines(self, symbol: str, market: str) -> list[NewsHeadline]:
        rows = self._read_rows(self.news_headlines_path)
        headlines = [
            NewsHeadline(
                id=int(row["id"]),
                symbol=row["symbol"],
                market=row["market"],
                headline=row["headline"],
                url=row["url"],
                published_at=datetime.fromisoformat(row["published_at"]),
                source=row.get("source") or None,
            )
            for row in rows
            if row["symbol"].upper() == symbol.upper() and row["market"].upper() == market.upper()
        ]
        return sorted(headlines, key=lambda item: item.published_at, reverse=True)

    def replace_news_headlines(self, symbol: str, market: str, headlines: list[NewsHeadline]) -> None:
        rows = [
            row
            for row in self._read_rows(self.news_headlines_path)
            if not (row["symbol"].upper() == symbol.upper() and row["market"].upper() == market.upper())
        ]
        for headline in headlines:
            rows.append(
                {
                    "id": str(headline.id),
                    "symbol": headline.symbol.upper(),
                    "market": headline.market.upper(),
                    "headline": headline.headline,
                    "url": headline.url,
                    "published_at": headline.published_at.isoformat(),
                    "source": headline.source or "",
                }
            )
        self._write_rows(
            self.news_headlines_path,
            ["id", "symbol", "market", "headline", "url", "published_at", "source"],
            rows,
        )
