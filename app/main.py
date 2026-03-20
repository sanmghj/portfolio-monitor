from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Response
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers.dashboard import router as dashboard_router
from app.routers.holdings import router as holdings_router
from app.routers.portfolios import router as portfolios_router
from app.routers.prompts import router as prompts_router
from app.routers.quotes import router as quotes_router
from app.routers.refresh import router as refresh_router
from app.routers.securities import router as securities_router
from app.routers.users import router as users_router
from app.storage.csv_store import CsvStore


BASE_DIR = Path(__file__).resolve().parent.parent
UI_DIST_DIR = BASE_DIR / "ui" / "dist"
UI_ASSETS_DIR = UI_DIST_DIR / "assets"


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
app.include_router(securities_router, prefix=settings.api_prefix)
app.include_router(prompts_router, prefix=settings.api_prefix)
app.include_router(quotes_router, prefix=settings.api_prefix)

if UI_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=UI_ASSETS_DIR), name="ui-assets")


@app.get("/main")
def legacy_main_redirect() -> RedirectResponse:
    return RedirectResponse(url="/", status_code=307)


@app.get("/main/{user_id}")
def legacy_user_redirect(user_id: int) -> RedirectResponse:
    return RedirectResponse(url="/", status_code=307)


@app.get("/{full_path:path}", response_model=None)
def spa_entry(full_path: str = "") -> Response:
    if full_path.startswith("api/"):
        return HTMLResponse(status_code=404, content="Not found")

    if UI_DIST_DIR.exists():
        candidate = UI_DIST_DIR / full_path
        if full_path and candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(UI_DIST_DIR / "index.html")

    return HTMLResponse(
        status_code=503,
        content=(
            "<h1>UI build not found</h1>"
            "<p>Build the React app in the <code>ui</code> folder first.</p>"
        ),
    )
