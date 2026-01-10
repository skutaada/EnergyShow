from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import get_db
from .models import Price
from .schemas import PriceEntry, PriceResponse, DateListResponse
from .price_fetcher import fetch_and_store_prices

router = APIRouter(prefix="/api")


@router.get("/prices/today", response_model=PriceResponse)
async def get_today_prices(db: Session = Depends(get_db)):
    """Get today's prices, fetching from external API first."""
    api_data, new_count = await fetch_and_store_prices(db)

    return PriceResponse(
        tariff=api_data.get("tariff", "EPEXSPOTAT"),
        unit=api_data.get("unit", "ct/kWh"),
        interval=api_data.get("interval", 15),
        data=[
            PriceEntry(
                timestamp=datetime.fromisoformat(entry["date"]),
                value=entry["value"]
            )
            for entry in api_data.get("data", [])
        ]
    )


@router.get("/prices", response_model=PriceResponse)
async def get_prices(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get prices for a date range from the database."""
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date + timedelta(days=1), datetime.min.time())

    prices = db.query(Price).filter(
        Price.timestamp >= start_datetime,
        Price.timestamp < end_datetime
    ).order_by(Price.timestamp).all()

    if not prices:
        raise HTTPException(status_code=404, detail="No prices found for the given date range")

    return PriceResponse(
        tariff="EPEXSPOTAT",
        unit="ct/kWh",
        interval=15,
        data=[PriceEntry(timestamp=p.timestamp, value=p.value) for p in prices]
    )


@router.get("/prices/dates", response_model=DateListResponse)
async def get_available_dates(db: Session = Depends(get_db)):
    """Get list of all dates that have price data."""
    dates = db.query(func.date(Price.timestamp)).distinct().order_by(
        func.date(Price.timestamp).desc()
    ).all()

    return DateListResponse(dates=[d[0] for d in dates])
