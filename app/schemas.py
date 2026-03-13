from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class PortfolioType(str, Enum):
    dividend = "dividend"
    general = "general"


class User(BaseModel):
    id: int
    name: str
    birth_date: date
    email: str | None = None


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    birth_date: date
    email: str | None = Field(default=None, max_length=256)


class UserEnterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    birth_date: date


class Portfolio(BaseModel):
    id: int
    user_id: int
    name: str
    portfolio_type: PortfolioType
    description: str | None = None
    base_currency: str = "KRW"
    monthly_budget: Decimal | None = None
    target_weight: Decimal | None = None
    created_at: datetime | None = None


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    portfolio_type: PortfolioType
    description: str | None = Field(default=None, max_length=1024)
    base_currency: str = Field(default="KRW", min_length=3, max_length=8)
    monthly_budget: Decimal | None = Field(default=None, ge=0)
    target_weight: Decimal | None = Field(default=None, ge=0)


class PortfolioUpdate(PortfolioCreate):
    pass


class HoldingBase(BaseModel):
    portfolio_id: int
    symbol: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=128)
    market: str = Field(min_length=2, max_length=8)
    currency: str = Field(min_length=3, max_length=8)
    quantity: Decimal = Field(gt=0)
    avg_price: Decimal = Field(gt=0)
    current_price: Decimal | None = Field(default=None, gt=0)


class HoldingCreate(HoldingBase):
    pass


class HoldingUpdate(HoldingBase):
    pass


class Holding(HoldingBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LatestPrice(BaseModel):
    symbol: str
    market: str
    price: Decimal = Field(gt=0)
    currency: str
    as_of: datetime


class EarningsEvent(BaseModel):
    id: int
    symbol: str
    market: str
    event_type: str
    event_date: datetime
    source: str | None = None


class NewsHeadline(BaseModel):
    id: int
    symbol: str
    market: str
    headline: str
    url: str
    published_at: datetime
    source: str | None = None


class HoldingDetail(BaseModel):
    holding_id: int
    portfolio_id: int
    portfolio_name: str
    portfolio_type: PortfolioType
    symbol: str
    name: str
    market: str
    currency: str
    quantity: Decimal
    avg_price: Decimal
    current_price: Decimal
    cost: Decimal
    value: Decimal
    pnl: Decimal
    pnl_percent: Decimal
    price_as_of: datetime | None = None


class PortfolioSummary(BaseModel):
    user_id: int
    portfolio_type: PortfolioType | None = None
    holding_count: int
    total_cost: Decimal
    total_value: Decimal
    pnl: Decimal
    pnl_percent: Decimal
    market_breakdown: dict[str, Decimal]
    portfolio_breakdown: dict[str, Decimal]
    holdings: list[HoldingDetail]


class HoldingInsights(BaseModel):
    holding: Holding
    latest_price: LatestPrice | None = None
    earnings_events: list[EarningsEvent]
    news_headlines: list[NewsHeadline]


class HoldingListItem(Holding):
    current_price: Decimal
    price_as_of: datetime | None = None


class PortfolioListItem(Portfolio):
    stock_count: int = 0
    total_value: Decimal = Field(default=Decimal("0"))
    pnl: Decimal = Field(default=Decimal("0"))
    pnl_percent: Decimal = Field(default=Decimal("0"))


class PriceHistoryPoint(BaseModel):
    date: date
    price: Decimal
    volume: int


class PromptBase(BaseModel):
    title: str = Field(min_length=1, max_length=256)
    content: str = Field(min_length=1, max_length=10000)
    portfolio_id: int | None = None


class PromptCreate(PromptBase):
    pass


class PromptUpdate(PromptBase):
    pass


class Prompt(PromptBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
