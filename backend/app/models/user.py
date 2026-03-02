"""
FinBank - Pydantic Models for Users & Authentication
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"
    EMPLOYEE = "employee"
    CEO = "ceo"


class UserRegisterRequest(BaseModel):
    """Request body for user registration. Role is forced to CUSTOMER."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str
    phone: str
    national_id: str


class UserLoginRequest(BaseModel):
    """Request body for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response for user data (no password)."""
    id: str
    email: str
    role: str
    is_active: bool
    kyc_status: str
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    redirect_url: str


class MeResponse(BaseModel):
    """Response for /me endpoint with redirect URL."""
    id: str
    email: str
    role: str
    is_active: bool
    kyc_status: str
    created_at: datetime
    redirect_url: str


class EmailVerifyRequest(BaseModel):
    """Request for email verification."""
    email: EmailStr
    code: str


class ResendCodeRequest(BaseModel):
    """Request for resending verification code."""
    email: EmailStr
