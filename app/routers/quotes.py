from fastapi import APIRouter, Query

from app.schemas import QuoteSnapshot
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
