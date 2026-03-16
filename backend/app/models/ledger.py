"""
FinBank - Pydantic Models for Ledger Entries
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class LedgerType(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class LedgerCategory(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    COMMISSION = "COMMISSION"   


class CommissionEntry(BaseModel):
    """Internal model for bank commission tracking."""
    id: str
    transaction_ref: str
    type: str # e.g. "EFT_FEE", "CASH_ADVANCE_FEE"
    amount: float
    description: Optional[str] = None
    created_at: datetime
    created_by: str



class LedgerEntryResponse(BaseModel):
    """Response for a single ledger entry."""
    id: str
    entry_id: str
    account_id: str
    type: str
    category: str
    amount: float
    transaction_ref: str
    description: Optional[str] = None
    created_at: datetime
    created_by: str


class LedgerQueryParams(BaseModel):
    """Query parameters for ledger filtering."""
    account_id: Optional[str] = None
    type: Optional[LedgerType] = None
    category: Optional[LedgerCategory] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)


class LedgerListResponse(BaseModel):
    """Paginated ledger list response."""
    entries: List[LedgerEntryResponse]
    total: int
    skip: int
    limit: int
