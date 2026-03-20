from fastapi import APIRouter, Query

from app.schemas import FxRateSnapshot, QuoteSnapshot
from app.services.refresh_service import RefreshService
from app.storage.csv_store import CsvStore


router = APIRouter(prefix="/quotes", tags=["quotes"])
service = RefreshService(CsvStore())


@router.get("", response_model=QuoteSnapshot)
async def get_quote(
    symbol: str = Query(..., min_length=1, max_length=32),
    market: str = Query(..., min_length=2, max_length=8),
) -> QuoteSnapshot:
    return await service.fetch_quote(symbol=symbol, market=market)

@router.get('/fx-rate', response_model=FxRateSnapshot)
async def get_fx_rate(
    base_currency: str = Query(..., min_length=3, max_length=8),
    quote_currency: str = Query(..., min_length=3, max_length=8),
) -> FxRateSnapshot:
    return await service.fetch_exchange_rate(base_currency=base_currency, quote_currency=quote_currency)

