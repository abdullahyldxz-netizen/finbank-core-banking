"""
FinBank - Pydantic Models for Multi-Layer Approvals
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ApprovalRequestCreate(BaseModel):
    """Request body to create a new approval."""
    request_type: str = Field(..., description="e.g., CREDIT_LIMIT_INCREASE, LARGE_TRANSFER")
    amount: Optional[float] = None
    currency: Optional[str] = "TRY"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional data required to execute the request once approved")
    description: Optional[str] = None


class ApprovalActionRequest(BaseModel):
    """Request body for an employee or CEO acting on the approval."""
    action: str = Field(..., description="APPROVE or REJECT")
    notes: Optional[str] = None


class ApprovalResponse(BaseModel):
    """Response returned representing an approval request."""
    id: str
    user_id: str
    user_name: Optional[str] = None
    request_type: str
    amount: Optional[float] = None
    currency: Optional[str] = "TRY"
    description: Optional[str] = None
    status: str = Field(..., description="PENDING_EMPLOYER, PENDING_CEO, APPROVED, REJECTED")
    risk_score: str = Field(..., description="LOW, MEDIUM, HIGH")
    metadata: Optional[Dict[str, Any]] = None
    employer_notes: Optional[str] = None
    ceo_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
