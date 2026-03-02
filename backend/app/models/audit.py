"""
FinBank - Pydantic Models for Audit Logs
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AuditAction(str, Enum):
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    REGISTER = "REGISTER"
    CUSTOMER_CREATED = "CUSTOMER_CREATED"
    CUSTOMER_UPDATED = "CUSTOMER_UPDATED"
    ACCOUNT_CREATED = "ACCOUNT_CREATED"
    DEPOSIT_EXECUTED = "DEPOSIT_EXECUTED"
    WITHDRAWAL_EXECUTED = "WITHDRAWAL_EXECUTED"
    TRANSFER_EXECUTED = "TRANSFER_EXECUTED"
    TRANSFER_FAILED = "TRANSFER_FAILED"
    KYC_STATUS_UPDATED = "KYC_STATUS_UPDATED"


class AuditOutcome(str, Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"


class AuditLogResponse(BaseModel):
    """Response for a single audit log entry."""
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    role: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    outcome: str
    timestamp: datetime


class AuditQueryParams(BaseModel):
    """Query parameters for audit log filtering."""
    user_id: Optional[str] = None
    action: Optional[AuditAction] = None
    outcome: Optional[AuditOutcome] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)


class AuditListResponse(BaseModel):
    """Paginated audit log list response."""
    logs: List[AuditLogResponse]
    total: int
    skip: int
    limit: int
