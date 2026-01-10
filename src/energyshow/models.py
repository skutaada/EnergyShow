from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, unique=True, nullable=False, index=True)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_prices_timestamp_date", timestamp),)
