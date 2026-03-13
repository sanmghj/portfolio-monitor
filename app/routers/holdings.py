from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query, Response, status

from app.schemas import Holding, HoldingCreate, HoldingInsights, HoldingListItem, HoldingUpdate, PriceHistoryPoint
from app.services.analysis import build_holding_list_items, build_price_history
from app.services.refresh_service import RefreshService
from app.storage.csv_store import CsvStore


router = APIRouter(prefix="/users/{user_id}/holdings", tags=["holdings"])
store = CsvStore()
refresh_service = RefreshService(store)


@router.get("", response_model=list[HoldingListItem])
def list_holdings(user_id: int, portfolio_id: int | None = Query(default=None)) -> list[HoldingListItem]:
    if not store.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return build_holding_list_items(store=store, user_id=user_id, portfolio_id=portfolio_id)


@router.post("", response_model=Holding, status_code=status.HTTP_201_CREATED)
def create_holding(user_id: int, payload: HoldingCreate) -> Holding:
    portfolios = {portfolio.id: portfolio for portfolio in store.read_portfolios(user_id=user_id)}
    if payload.portfolio_id not in portfolios:
        raise HTTPException(status_code=400, detail="Portfolio does not belong to the user")
    return store.create_holding(user_id=user_id, payload=payload)


@router.put("/{holding_id}", response_model=Holding)
def update_holding(user_id: int, holding_id: int, payload: HoldingUpdate) -> Holding:
    portfolios = {portfolio.id: portfolio for portfolio in store.read_portfolios(user_id=user_id)}
    if payload.portfolio_id not in portfolios:
        raise HTTPException(status_code=400, detail="Portfolio does not belong to the user")

    updated = store.update_holding(user_id=user_id, holding_id=holding_id, payload=payload)
    if updated is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    return updated


@router.delete("/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holding(user_id: int, holding_id: int) -> Response:
    deleted = store.delete_holding(user_id=user_id, holding_id=holding_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Holding not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{holding_id}/insights", response_model=HoldingInsights)
def get_holding_insights(user_id: int, holding_id: int) -> HoldingInsights:
    holding = store.get_holding(user_id=user_id, holding_id=holding_id)
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    return HoldingInsights(
        holding=holding,
        latest_price=store.get_latest_price(symbol=holding.symbol, market=holding.market),
        earnings_events=store.read_earnings_events(symbol=holding.symbol, market=holding.market),
        news_headlines=store.read_news_headlines(symbol=holding.symbol, market=holding.market),
    )


@router.get("/{holding_id}/price-history", response_model=list[PriceHistoryPoint])
def get_price_history(user_id: int, holding_id: int) -> list[PriceHistoryPoint]:
    holding = store.get_holding(user_id=user_id, holding_id=holding_id)
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    latest_price = store.get_latest_price(symbol=holding.symbol, market=holding.market)
    current_price = latest_price.price if latest_price is not None else Decimal(str(holding.avg_price))
    as_of = latest_price.as_of if latest_price is not None else None
    return build_price_history(current_price=current_price, as_of=as_of)


@router.post("/{holding_id}/refresh")
async def refresh_holding_insights(user_id: int, holding_id: int) -> dict[str, object]:
    holding = store.get_holding(user_id=user_id, holding_id=holding_id)
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    return await refresh_service.refresh_holding_insights(holding)
