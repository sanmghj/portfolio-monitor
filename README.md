# Portfolio Monitor

CSV-based local portfolio monitor API built with FastAPI for Python 3.12.

## Scope

- Local personal server
- No database
- CSV-only storage
- Entry flow based on `name + birth_date`
- User-based structure designed for future multi-user support
- Portfolio types: `dividend`, `general`
- Holdings CRUD
- Dashboard summary by user and optional portfolio type

## Project Structure

```text
portfolio-monitor/
├─ app/
│  ├─ main.py
│  ├─ config.py
│  ├─ schemas.py
│  ├─ routers/
│  ├─ services/
│  └─ storage/
├─ data/
├─ requirements.txt
├─ .env.example
└─ README.md
```

## Requirements

- Python 3.12
- Windows PowerShell examples below

## Setup

```powershell
$venv = "D:\dev\.venv_port"
& "$venv\Scripts\python.exe" -m pip install --upgrade pip
& "$venv\Scripts\python.exe" -m pip install -r requirements.txt
Copy-Item .env.example .env
```

## Run

```powershell
$env:PATH = "D:\dev\.venv_port\Scripts;$env:PATH"
uvicorn app.main:app --reload
```

Open:

- Landing page: `http://127.0.0.1:8000/`
- Entry page: `http://127.0.0.1:8000/main`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Seed Data

The repository includes starter CSV files:

- `data/users.csv`
- `data/portfolios.csv`
- `data/holdings.csv`
- `data/latest_prices.csv`
- `data/earnings_events.csv`
- `data/news_headlines.csv`

If these files are missing, the app recreates them and seeds a starter user plus two sample portfolios.

## API Endpoints

- `GET /api/v1/users`
- `POST /api/v1/users`
- `POST /api/v1/users/enter`
- `GET /api/v1/users/{user_id}/portfolios`
- `POST /api/v1/users/{user_id}/portfolios`
- `GET /api/v1/users/{user_id}/holdings`
- `POST /api/v1/users/{user_id}/holdings`
- `DELETE /api/v1/users/{user_id}/holdings/{holding_id}`
- `GET /api/v1/users/{user_id}/dashboard/summary`
- `POST /api/v1/refresh/prices`
- `POST /api/v1/refresh/events`
- `POST /api/v1/refresh/news`

## Example User Create

```json
{
  "name": "Ned",
  "birth_date": "1990-01-01",
  "email": "ned@example.com"
}
```

## Example User Enter

```json
{
  "name": "Ned",
  "birth_date": "1990-01-01"
}
```

## Example Portfolio Create

```json
{
  "name": "Core Dividend",
  "portfolio_type": "dividend",
  "base_currency": "KRW",
  "monthly_budget": 500000,
  "target_weight": 40
}
```

## Example Holding Create

```json
{
  "portfolio_id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "market": "US",
  "currency": "USD",
  "quantity": 10,
  "avg_price": 182.5
}
```

## Notes

- `GET /` redirects to `/main`.
- `/main` is the first input page for `name + birth_date`.
- After successful entry or creation, the page moves to `/main/{user_id}`.
- If `portfolios.csv` is empty for a user, create one with `POST /api/v1/users/{user_id}/portfolios` before adding holdings.
- Latest price data is optional in phase 1. If no latest price exists, the dashboard summary falls back to `avg_price`.
- Refresh endpoints are placeholders for later provider integration.
- CSV files are read and written as `UTF-8-SIG`.
- Verified with the shared virtual environment at `D:\dev\.venv_port`.
