from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from app.schemas import HoldingDetail, PortfolioSummary, PortfolioType
from app.storage.csv_store import CsvStore


ZERO = Decimal("0")


def build_portfolio_summary(
    store: CsvStore,
    user_id: int,
    portfolio_type: PortfolioType | None = None,
) -> PortfolioSummary:
    portfolios = {portfolio.id: portfolio for portfolio in store.read_portfolios(user_id=user_id)}
    holdings = store.read_holdings(user_id=user_id)
    latest_prices = store.read_latest_prices()

    details: list[HoldingDetail] = []
    market_breakdown: dict[str, Decimal] = {}
    portfolio_breakdown: dict[str, Decimal] = {}

    for holding in holdings:
        portfolio = portfolios.get(holding.portfolio_id)
        if portfolio is None:
            continue
        if portfolio_type is not None and portfolio.portfolio_type != portfolio_type:
            continue

        price_row = latest_prices.get((holding.symbol, holding.market))
        current_price = Decimal(price_row["price"]) if price_row else holding.avg_price
        price_as_of = datetime.fromisoformat(price_row["as_of"]) if price_row and price_row.get("as_of") else None
        cost = holding.quantity * holding.avg_price
        value = holding.quantity * current_price
        pnl = value - cost
        pnl_percent = (pnl / cost * Decimal("100")) if cost else ZERO

        details.append(
            HoldingDetail(
                holding_id=holding.id,
                portfolio_id=portfolio.id,
                portfolio_name=portfolio.name,
                portfolio_type=portfolio.portfolio_type,
                symbol=holding.symbol,
                name=holding.name,
                market=holding.market,
                currency=holding.currency,
                quantity=holding.quantity,
                avg_price=holding.avg_price,
                current_price=current_price,
                cost=cost,
                value=value,
                pnl=pnl,
                pnl_percent=pnl_percent.quantize(Decimal("0.01")),
                price_as_of=price_as_of,
            )
        )
        market_breakdown[holding.market] = market_breakdown.get(holding.market, ZERO) + value
        portfolio_breakdown[portfolio.portfolio_type.value] = (
            portfolio_breakdown.get(portfolio.portfolio_type.value, ZERO) + value
        )

    total_cost = sum((detail.cost for detail in details), ZERO)
    total_value = sum((detail.value for detail in details), ZERO)
    pnl = total_value - total_cost
    pnl_percent = (pnl / total_cost * Decimal("100")) if total_cost else ZERO

    return PortfolioSummary(
        user_id=user_id,
        portfolio_type=portfolio_type,
        holding_count=len(details),
        total_cost=total_cost,
        total_value=total_value,
        pnl=pnl,
        pnl_percent=pnl_percent.quantize(Decimal("0.01")),
        market_breakdown=market_breakdown,
        portfolio_breakdown=portfolio_breakdown,
        holdings=details,
    )
