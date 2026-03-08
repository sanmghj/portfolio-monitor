from fastapi import APIRouter

from app.services.refresh_service import RefreshService
from app.storage.csv_store import CsvStore


router = APIRouter(prefix="/refresh", tags=["refresh"])
service = RefreshService(CsvStore())


@router.post("/prices")
async def refresh_prices() -> dict[str, str]:
    return await service.refresh_prices()


@router.post("/events")
async def refresh_events() -> dict[str, str]:
    return await service.refresh_events()


@router.post("/news")
async def refresh_news() -> dict[str, str]:
    return await service.refresh_news()
