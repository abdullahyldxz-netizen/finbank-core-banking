"""
FinBank - Employee API Routes
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app.core.database import get_database
from app.core.security import require_employee, require_any_internal

router = APIRouter(prefix="/employee", tags=["Employee"])

class KYCDecisionRequest(BaseModel):
    decision: str
    notes: Optional[str] = None

@router.get("/dashboard")
async def employee_dashboard(current_user: dict = Depends(require_employee), db=Depends(get_database)):
    """Get dashboard stats for the employee panel."""
    # Start of day for today_transactions
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    pending_kyc = await db.customers.count_documents({"status": "pending_kyc"})
    total_customers = await db.customers.count_documents({})
    open_messages = await db.messages.count_documents({"status": "open"})
    today_transactions = await db.ledger_entries.count_documents({"created_at": {"$gte": today_start}})
    
    return {
        "pending_kyc": pending_kyc,
        "total_customers": total_customers,
        "open_messages": open_messages,
        "today_transactions": today_transactions,
    }

@router.get("/kyc/pending")
async def list_pending_kyc(current_user: dict = Depends(require_employee), db=Depends(get_database)):
    """List customers pending KYC approval."""
    customers = await db.customers.find({"status": "pending_kyc"}).sort("created_at", -1).to_list(50)
    result = []
    for customer in customers:
        customer["_id"] = str(customer["_id"])
        user = await db.users.find_one({"user_id": customer["user_id"]}, {"password_hash": 0, "hashed_password": 0})
        if user:
            user["_id"] = str(user["_id"])
            customer["user"] = user
        result.append(customer)
    return result

@router.get("/kyc/all")
async def list_all_kyc(
    status: Optional[str] = None,
    current_user: dict = Depends(require_employee),
    db=Depends(get_database)
):
    """List all customers with optional status filter."""
    query = {}
    if status:
        query["status"] = status
    customers = await db.customers.find(query).sort("created_at", -1).to_list(100)
    for customer in customers:
        customer["_id"] = str(customer["_id"])
    return customers

@router.patch("/kyc/{customer_id}/decision")
async def kyc_decision(
    customer_id: str,
    body: KYCDecisionRequest,
    current_user: dict = Depends(require_employee),
    db=Depends(get_database)
):
    """Approve or reject KYC for a customer."""
    if body.decision not in ["approved", "rejected"]:
        raise HTTPException(400, "Gecersiz karar. 'approved' veya 'rejected' olmali.")

    customer = await db.customers.find_one({"customer_id": customer_id})
    if not customer:
        raise HTTPException(404, "Musteri bulunamadi.")

    reviewed_at = datetime.now(timezone.utc)
    new_status = "active" if body.decision == "approved" else "rejected"
    new_user_kyc_status = "APPROVED" if body.decision == "approved" else "REJECTED"

    await db.customers.update_one(
        {"customer_id": customer_id},
        {
            "$set": {
                "status": new_status,
                "kyc_decision": body.decision,
                "kyc_notes": body.notes,
                "kyc_reviewed_by": current_user["email"],
                "kyc_reviewed_at": reviewed_at,
            }
        }
    )
    
    await db.users.update_one(
        {"user_id": customer["user_id"]},
        {"$set": {"kyc_status": new_user_kyc_status}}
    )

    await db.audit_logs.insert_one(
        {
            "action": "KYC_DECISION",
            "user_id": current_user["user_id"],
            "customer_id": customer_id,
            "decision": body.decision,
            "notes": body.notes,
            "timestamp": reviewed_at,
        }
    )

    message = "KYC onaylandi." if body.decision == "approved" else "KYC reddedildi."
    return {"message": message, "status": new_status}

@router.get("/customers")
async def search_customers(
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_employee),
    db=Depends(get_database)
):
    """Search for customers."""
    query = {}
    if q:
        query["$or"] = [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"national_id": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"full_name": {"$regex": q, "$options": "i"}},
        ]
    skip = (page - 1) * limit
    customers = await db.customers.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.customers.count_documents(query)
    for customer in customers:
        customer["_id"] = str(customer["_id"])
    return {"data": customers, "total": total, "page": page, "limit": limit}

@router.get("/customers/{customer_id}")
async def get_customer_detail(
    customer_id: str,
    current_user: dict = Depends(require_any_internal),
    db=Depends(get_database)
):
    """Get detailed 360 view of a customer."""
    customer = await db.customers.find_one({"customer_id": customer_id})
    if not customer:
        raise HTTPException(404, "Musteri bulunamadi.")
    customer["_id"] = str(customer["_id"])

    user = await db.users.find_one({"user_id": customer["user_id"]}, {"password_hash": 0, "hashed_password": 0})
    if user:
        user["_id"] = str(user["_id"])

    accounts = await db.accounts.find({"user_id": customer["user_id"]}).to_list(50)
    for account in accounts:
        account["_id"] = str(account["_id"])

    # If accounts exist, get recent transactions
    recent_transactions = []
    if accounts:
        recent_transactions = await db.ledger_entries.find(
            {"account_id": {"$in": [acc.get("account_id") or acc.get("id") for acc in accounts]}}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        for tx in recent_transactions:
            tx["_id"] = str(tx["_id"])

    return {
        "customer": customer,
        "user": user,
        "accounts": accounts,
        "recent_transactions": recent_transactions,
    }
