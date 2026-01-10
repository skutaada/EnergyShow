from datetime import datetime, date
from pydantic import BaseModel


class PriceEntry(BaseModel):
    timestamp: datetime
    value: float

    class Config:
        from_attributes = True


class PriceResponse(BaseModel):
    tariff: str
    unit: str
    interval: int
    data: list[PriceEntry]


class DateListResponse(BaseModel):
    dates: list[date]
