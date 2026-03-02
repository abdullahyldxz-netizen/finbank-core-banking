"""
FinBank - Supabase Sync Service
Automatically mirrors MongoDB writes to Supabase PostgreSQL tables.
Fire-and-forget pattern: Supabase errors do not block MongoDB operations.
"""
import structlog
from app.core.security import supabase
from datetime import datetime, timezone

logger = structlog.get_logger()


async def sync_user(user_doc: dict):
    """Sync user registration to Supabase users table."""
    try:
        supabase.table("users").upsert({
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "role": user_doc.get("role", "customer"),
            "is_active": user_doc.get("is_active", True),
            "kyc_status": user_doc.get("kyc_status", "PENDING"),
            "created_at": user_doc["created_at"].isoformat()
                if isinstance(user_doc["created_at"], datetime) else user_doc["created_at"],
        }, on_conflict="user_id").execute()
        logger.info("Supabase sync: user", email=user_doc["email"])
    except Exception as e:
        logger.error("Supabase sync FAILED: user", error=str(e), email=user_doc["email"])


async def sync_customer(customer_doc: dict):
    """Sync customer profile to Supabase customers table."""
    try:
        data = {
            "customer_id": customer_doc["customer_id"],
            "user_id": customer_doc["user_id"],
            "full_name": customer_doc["full_name"],
            "national_id": customer_doc["national_id"],
            "phone": customer_doc["phone"],
            "status": customer_doc.get("status", "pending"),
            "kyc_verified": customer_doc.get("kyc_verified", False),
        }
        if "date_of_birth" in customer_doc and customer_doc["date_of_birth"]:
            dob = customer_doc["date_of_birth"]
            data["date_of_birth"] = dob.isoformat() if hasattr(dob, "isoformat") else str(dob)
        if "address" in customer_doc:
            data["address"] = customer_doc["address"]
        if "id_front_url" in customer_doc:
            data["id_front_url"] = customer_doc["id_front_url"]
        if "id_back_url" in customer_doc:
            data["id_back_url"] = customer_doc["id_back_url"]
        if "created_at" in customer_doc:
            ca = customer_doc["created_at"]
            data["created_at"] = ca.isoformat() if isinstance(ca, datetime) else str(ca)

        supabase.table("customers").upsert(data, on_conflict="customer_id").execute()
        logger.info("Supabase sync: customer", name=customer_doc["full_name"])
    except Exception as e:
        logger.error("Supabase sync FAILED: customer", error=str(e))


async def sync_account(account_doc: dict):
    """Sync account creation to Supabase accounts table."""
    try:
        data = {
            "account_id": account_doc["account_id"],
            "account_number": account_doc["account_number"],
            "iban": account_doc["iban"],
            "customer_id": account_doc["customer_id"],
            "user_id": account_doc["user_id"],
            "account_type": account_doc["account_type"],
            "currency": account_doc.get("currency", "TRY"),
            "status": account_doc.get("status", "active"),
        }
        if "created_at" in account_doc:
            ca = account_doc["created_at"]
            data["created_at"] = ca.isoformat() if isinstance(ca, datetime) else str(ca)

        supabase.table("accounts").upsert(data, on_conflict="account_id").execute()
        logger.info("Supabase sync: account", number=account_doc["account_number"])
    except Exception as e:
        logger.error("Supabase sync FAILED: account", error=str(e))


async def sync_transaction(entry_doc: dict):
    """Sync ledger entry to Supabase transactions table."""
    try:
        data = {
            "entry_id": entry_doc["entry_id"],
            "account_id": entry_doc["account_id"],
            "type": entry_doc["type"],
            "category": entry_doc["category"],
            "amount": float(entry_doc["amount"]),
            "transaction_ref": entry_doc["transaction_ref"],
            "description": entry_doc.get("description", ""),
            "created_by": entry_doc.get("created_by", ""),
        }
        if "created_at" in entry_doc:
            ca = entry_doc["created_at"]
            data["created_at"] = ca.isoformat() if isinstance(ca, datetime) else str(ca)

        supabase.table("transactions").upsert(data, on_conflict="entry_id").execute()
        logger.info("Supabase sync: transaction", ref=entry_doc["transaction_ref"])
    except Exception as e:
        logger.error("Supabase sync FAILED: transaction", error=str(e))


async def sync_audit(audit_doc: dict):
    """Sync audit log to Supabase audit_logs table."""
    try:
        data = {
            "log_id": str(audit_doc.get("log_id", audit_doc.get("_id", ""))),
            "action": audit_doc["action"],
            "outcome": audit_doc["outcome"],
        }
        for field in ["user_id", "user_email", "role", "details", "ip_address", "user_agent"]:
            if field in audit_doc:
                data[field] = audit_doc[field]
        if "timestamp" in audit_doc:
            ts = audit_doc["timestamp"]
            data["timestamp"] = ts.isoformat() if isinstance(ts, datetime) else str(ts)

        supabase.table("audit_logs").upsert(data, on_conflict="log_id").execute()
    except Exception as e:
        logger.error("Supabase sync FAILED: audit", error=str(e))
