"""
FinBank - Pydantic Models for Customers & KYC
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class CustomerStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SUSPENDED = "suspended"


class CustomerCreateRequest(BaseModel):
    """Request body for creating a customer profile."""
    full_name: str = Field(..., min_length=2, max_length=100)
    national_id: str = Field(..., min_length=11, max_length=11, pattern=r"^\d{11}$")
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{9,14}$")
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    id_front_url: Optional[str] = None
    id_back_url: Optional[str] = None


class CustomerUpdateRequest(BaseModel):
    """Request body for updating customer info."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{9,14}$")
    address: Optional[str] = None
    date_of_birth: Optional[str] = None


class CustomerStatusUpdate(BaseModel):
    """Request body for admin to update customer status."""
    status: CustomerStatus
    kyc_verified: Optional[bool] = None


class CustomerResponse(BaseModel):
    """Response for customer data."""
    id: str
    user_id: str
    full_name: str
    national_id: str
    phone: str
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    id_front_url: Optional[str] = None
    id_back_url: Optional[str] = None
    status: str
    kyc_verified: bool
    created_at: datetime
