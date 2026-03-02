"""
FinBank Employee Service — KYC Approval, Customer Management, Transaction Validation
Port: 8006
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.jwt_utils import require_employee, get_current_user
from shared.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(title="FinBank Employee Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class KYCDecisionRequest(BaseModel):
    decision: str  # "approved" or "rejected"
    notes: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "employee-service"}


# ── KYC Management ──
@app.get("/kyc/pending")
async def list_pending_kyc(current_user=Depends(require_employee), db=Depends(get_database)):
    customers = await db.customers.find({"status": "pending_kyc"}).sort("created_at", -1).to_list(50)
    result = []
    for c in customers:
        c["_id"] = str(c["_id"])
        user = await db.users.find_one({"user_id": c["user_id"]}, {"password_hash": 0})
        if user:
            user["_id"] = str(user["_id"])
            c["user"] = user
        result.append(c)
    return result


@app.get("/kyc/all")
async def list_all_kyc(
    status: Optional[str] = None,
    current_user=Depends(require_employee), db=Depends(get_database),
):
    query = {}
    if status:
        query["status"] = status
    customers = await db.customers.find(query).sort("created_at", -1).to_list(100)
    for c in customers:
        c["_id"] = str(c["_id"])
    return customers


@app.patch("/kyc/{customer_id}/decision")
async def kyc_decision(
    customer_id: str, body: KYCDecisionRequest,
    current_user=Depends(require_employee), db=Depends(get_database),
):
    if body.decision not in ["approved", "rejected"]:
        raise HTTPException(400, "Geçersiz karar. 'approved' veya 'rejected' olmalı.")

    customer = await db.customers.find_one({"customer_id": customer_id})
    if not customer:
        raise HTTPException(404, "Müşteri bulunamadı.")

    new_status = "active" if body.decision == "approved" else "rejected"
    await db.customers.update_one(
        {"customer_id": customer_id},
        {"$set": {
            "status": new_status,
            "kyc_decision": body.decision,
            "kyc_notes": body.notes,
            "kyc_reviewed_by": current_user["email"],
            "kyc_reviewed_at": datetime.now(timezone.utc),
        }}
    )

    await db.audit_logs.insert_one({
        "action": "KYC_DECISION",
        "user_id": current_user["user_id"],
        "customer_id": customer_id,
        "decision": body.decision,
        "notes": body.notes,
        "timestamp": datetime.now(timezone.utc),
    })

    msg = "KYC onaylandı ✅" if body.decision == "approved" else "KYC reddedildi ❌"
    return {"message": msg, "status": new_status}


# ── Customer Search ──
@app.get("/customers")
async def search_customers(
    q: Optional[str] = None, page: int = 1, limit: int = 20,
    current_user=Depends(require_employee), db=Depends(get_database),
):
    query = {}
    if q:
        query["$or"] = [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"national_id": {"$regex": q, "$options": "i"}},
        ]
    skip = (page - 1) * limit
    customers = await db.customers.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.customers.count_documents(query)
    for c in customers:
        c["_id"] = str(c["_id"])
    return {"data": customers, "total": total, "page": page}


@app.get("/customers/{customer_id}")
async def get_customer_detail(
    customer_id: str,
    current_user=Depends(require_employee), db=Depends(get_database),
):
    customer = await db.customers.find_one({"customer_id": customer_id})
    if not customer:
        raise HTTPException(404, "Müşteri bulunamadı.")
    customer["_id"] = str(customer["_id"])

    user = await db.users.find_one({"user_id": customer["user_id"]}, {"password_hash": 0})
    if user:
        user["_id"] = str(user["_id"])

    accounts = await db.accounts.find({"user_id": customer["user_id"]}).to_list(50)
    for a in accounts:
        a["_id"] = str(a["_id"])

    recent_txns = await db.ledger_entries.find(
        {"account_id": {"$in": [a["account_id"] for a in accounts]}}
    ).sort("created_at", -1).to_list(20)
    for t in recent_txns:
        t["_id"] = str(t["_id"])

    return {
        "customer": customer,
        "user": user,
        "accounts": accounts,
        "recent_transactions": recent_txns,
    }


# ── Employee Dashboard Stats ──
@app.get("/dashboard")
async def employee_dashboard(current_user=Depends(require_employee), db=Depends(get_database)):
    return {
        "pending_kyc": await db.customers.count_documents({"status": "pending_kyc"}),
        "total_customers": await db.customers.count_documents({}),
        "open_messages": await db.messages.count_documents({"status": "open"}),
        "today_transactions": await db.ledger_entries.count_documents({
            "created_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)}
        }),
    }
