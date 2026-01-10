import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert

from .models import Price

SMARTENERGY_API_URL = "https://apis.smartenergy.at/market/v1/price"


async def fetch_prices_from_api() -> dict:
    """Fetch current prices from the SmartEnergy API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(SMARTENERGY_API_URL)
        response.raise_for_status()
        return response.json()


def store_prices(db: Session, api_data: dict) -> int:
    """Store prices in database, upserting to avoid duplicates.

    Returns the number of new prices inserted.
    """
    new_count = 0
    for entry in api_data.get("data", []):
        timestamp = datetime.fromisoformat(entry["date"])
        value = entry["value"]

        stmt = insert(Price).values(
            timestamp=timestamp,
            value=value,
            created_at=datetime.utcnow()
        ).on_conflict_do_nothing(index_elements=["timestamp"])

        result = db.execute(stmt)
        if result.rowcount > 0:
            new_count += 1

    db.commit()
    return new_count


async def fetch_and_store_prices(db: Session) -> tuple[dict, int]:
    """Fetch prices from API and store them in database.

    Returns the API data and count of new prices stored.
    """
    api_data = await fetch_prices_from_api()
    new_count = store_prices(db, api_data)
    return api_data, new_count
