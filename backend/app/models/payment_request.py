from pydantic import BaseModel, Field, constr, confloat
from typing import Optional
from datetime import datetime

class PaymentRequestCreate(BaseModel):
    target_alias: constr(min_length=1, max_length=100) # Email, phone, tc
    amount: confloat(gt=0)
    description: Optional[str] = "Ödeme İsteği"

class PaymentRequestApprove(BaseModel):
    account_id: str

class PaymentRequestResponse(BaseModel):
    request_id: str
    requester_user_id: str
    requester_name: str
    target_user_id: str
    target_name: str
    amount: float
    description: str
    status: str # pending, paid, rejected, cancelled
    created_at: datetime
    updated_at: datetime
