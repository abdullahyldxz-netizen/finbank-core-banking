"""
FinBank - Bills API (Bill Payment System)
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_database
from app.core.security import get_current_user
from app.services.ledger_service import LedgerService
import uuid

router = APIRouter(prefix="/bills", tags=["Bill Payments"])


class BillPayRequest(BaseModel):
    account_id: str
    bill_type: str  # "electric", "water", "gas", "internet", "phone", "other"
    provider: str
    subscriber_no: str
    amount: float
    description: Optional[str] = None


class BillHistoryItem(BaseModel):
    bill_id: str
    bill_type: str
    provider: str
    subscriber_no: str
    amount: float
    status: str
    paid_at: datetime


@router.post("/pay")
async def pay_bill(
    body: BillPayRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Pay a bill from an account."""
    # Validate account ownership
    account = await db.accounts.find_one({"account_id": body.account_id})
    if not account:
        raise HTTPException(status_code=404, detail="Hesap bulunamadı.")
    if account["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Bu hesaba erişiminiz yok.")
    if account["status"] != "active":
        raise HTTPException(status_code=400, detail="Hesap aktif değil.")

    # Check balance
    ledger = LedgerService(db)
    balance = await ledger.get_balance(body.account_id)
    if balance < body.amount:
        raise HTTPException(status_code=400, detail="Yetersiz bakiye.")

    # Withdraw amount
    await ledger.withdraw(
        account_id=body.account_id,
        amount=body.amount,
        created_by=current_user["user_id"],
        description=f"Fatura: {body.bill_type} - {body.provider}",
    )

    # Save bill record
    bill_doc = {
        "bill_id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "account_id": body.account_id,
        "bill_type": body.bill_type,
        "provider": body.provider,
        "subscriber_no": body.subscriber_no,
        "amount": body.amount,
        "description": body.description,
        "status": "paid",
        "paid_at": datetime.now(timezone.utc),
    }
    await db.bills.insert_one(bill_doc)

    return {
        "message": f"{body.provider} faturası başarıyla ödendi! ✅",
        "bill_id": bill_doc["bill_id"],
        "amount": body.amount,
    }


@router.get("/history")
async def bill_history(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get bill payment history for the current user."""
    bills = await db.bills.find(
        {"user_id": current_user["user_id"]}
    ).sort("paid_at", -1).to_list(50)

    for b in bills:
        b["_id"] = str(b["_id"])

    return bills
