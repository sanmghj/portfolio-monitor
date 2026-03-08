from fastapi import APIRouter, HTTPException

from app.schemas import PortfolioSummary, PortfolioType
from app.services.analysis import build_portfolio_summary
from app.storage.csv_store import CsvStore


router = APIRouter(prefix="/users/{user_id}/dashboard", tags=["dashboard"])
store = CsvStore()


@router.get("/summary", response_model=PortfolioSummary)
def get_summary(user_id: int, portfolio_type: PortfolioType | None = None) -> PortfolioSummary:
    if not store.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return build_portfolio_summary(store=store, user_id=user_id, portfolio_type=portfolio_type)
