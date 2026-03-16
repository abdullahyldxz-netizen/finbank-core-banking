"""
FinBank - Pydantic Models for Investments
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InvestmentPortfolioEntry(BaseModel):
    """Model representing a user's holdings of a specific asset."""
    id: str
    customer_id: str
    asset_id: str  # e.g., 'bitcoin', 'aapl'
    symbol: str    # e.g., 'BTC', 'AAPL'
    asset_type: str # 'crypto' or 'stock'
    quantity: float
    average_buy_price: float
    updated_at: datetime


class InvestmentTransaction(BaseModel):
    """Request body for buying or selling an asset."""
    asset_id: str
    asset_type: str
    quantity: float
    source_account_id: str  # Account to deduct funds from (or add funds to)
