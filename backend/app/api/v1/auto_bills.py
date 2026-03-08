"""
FinBank - Auto Bills API (Recurring Bill Payment System)
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.database import get_database
from app.core.security import get_current_user
from bson import ObjectId

router = APIRouter()

class AutoBillCreate(BaseModel):
    account_id: str = Field(..., description="Account ID to pay from")
    bill_type: str = Field(..., description="Type of bill (e.g. electric, water)")
    provider: str = Field(..., description="Service provider name")
    subscriber_no: str = Field(..., description="Subscriber or contract number")
    max_amount: float = Field(..., gt=0, description="Maximum amount allowed to auto-pay")
    payment_day: int = Field(..., ge=1, le=31, description="Day of the month to execute payment")
    description: Optional[str] = None

class AutoBillResponse(BaseModel):
    id: str
    account_id: str
    bill_type: str
    provider: str
    subscriber_no: str
    max_amount: float
    payment_day: int
    description: Optional[str] = None
    status: str
    created_at: datetime

@router.post("/", response_model=AutoBillResponse, status_code=201)
async def create_auto_bill(
    body: AutoBillCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    # Verify account ownership
    account = await db.accounts.find_one({
        "account_id": body.account_id,
        "user_id": current_user["user_id"],
        "status": "active"
    })
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or access denied")
        
    doc = {
        "user_id": current_user["user_id"],
        "account_id": body.account_id,
        "bill_type": body.bill_type,
        "provider": body.provider,
        "subscriber_no": body.subscriber_no,
        "max_amount": body.max_amount,
        "payment_day": body.payment_day,
        "description": body.description,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.auto_bills.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    
    return doc

@router.get("/", response_model=List[AutoBillResponse])
async def list_auto_bills(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    cursor = db.auto_bills.find({"user_id": current_user["user_id"], "status": "active"})
    bills = await cursor.to_list(100)
    
    for b in bills:
        b["id"] = str(b.pop("_id"))
        
    return bills

@router.delete("/{bill_id}")
async def delete_auto_bill(
    bill_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    if not ObjectId.is_valid(bill_id):
        raise HTTPException(status_code=400, detail="Geçersiz otomatik ödeme ID FORMATI.")
        
    result = await db.auto_bills.update_one(
        {"_id": ObjectId(bill_id), "user_id": current_user["user_id"]},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Otomatik ödeme talimatı bulunamadı.")
        
    return {"message": "Otomatik ödeme talimatı iptal edildi."}
