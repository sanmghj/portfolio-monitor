from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse

from app.config import settings
from app.routers.dashboard import router as dashboard_router
from app.routers.holdings import router as holdings_router
from app.routers.portfolios import router as portfolios_router
from app.routers.refresh import router as refresh_router
from app.routers.users import router as users_router
from app.storage.csv_store import CsvStore
from app.web_pages import render_entry_page, render_user_page


@asynccontextmanager
async def lifespan(_: FastAPI):
    CsvStore()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(portfolios_router, prefix=settings.api_prefix)
app.include_router(holdings_router, prefix=settings.api_prefix)
app.include_router(dashboard_router, prefix=settings.api_prefix)
app.include_router(refresh_router, prefix=settings.api_prefix)


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse(url="/main", status_code=307)


@app.get("/main", response_class=HTMLResponse)
def main_page() -> str:
    return render_entry_page(settings.app_name)


@app.get("/main/{user_id}", response_class=HTMLResponse)
def user_main_page(user_id: int) -> str:
    return render_user_page(settings.app_name, user_id)
