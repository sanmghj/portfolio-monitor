from fastapi import APIRouter, HTTPException, Response, status

from app.schemas import Portfolio, PortfolioCreate, PortfolioUpdate
from app.storage.csv_store import CsvStore


router = APIRouter(prefix="/users/{user_id}/portfolios", tags=["portfolios"])
store = CsvStore()


@router.get("", response_model=list[Portfolio])
def list_portfolios(user_id: int) -> list[Portfolio]:
    portfolios = store.read_portfolios(user_id=user_id)
    if not portfolios and not store.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return portfolios


@router.post("", response_model=Portfolio, status_code=status.HTTP_201_CREATED)
def create_portfolio(user_id: int, payload: PortfolioCreate) -> Portfolio:
    if not store.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return store.create_portfolio(user_id=user_id, payload=payload)


@router.put("/{portfolio_id}", response_model=Portfolio)
def update_portfolio(user_id: int, portfolio_id: int, payload: PortfolioUpdate) -> Portfolio:
    if not store.user_exists(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    updated = store.update_portfolio(user_id=user_id, portfolio_id=portfolio_id, payload=payload)
    if updated is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return updated


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio(user_id: int, portfolio_id: int) -> Response:
    deleted = store.delete_portfolio(user_id=user_id, portfolio_id=portfolio_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
