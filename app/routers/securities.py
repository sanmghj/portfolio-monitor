from fastapi import APIRouter, Query

from app.schemas import SecuritySearchItem
from app.services.providers import YahooFinanceProvider


router = APIRouter(prefix="/securities", tags=["securities"])
provider = YahooFinanceProvider()


@router.get("/search", response_model=list[SecuritySearchItem])
async def search_securities(
    q: str = Query(..., min_length=1, max_length=128),
    market: str = Query(default="ALL", min_length=2, max_length=8),
    limit: int = Query(default=10, ge=1, le=20),
) -> list[SecuritySearchItem]:
    return await provider.search_securities(query=q, market=market, limit=limit)
