"""
FinBank - Audit Service
Logs all banking operations for compliance and security.
"""
import uuid
import structlog
from datetime import datetime, timezone
from typing import Optional
from fastapi import Request
from app.core.database import get_database

logger = structlog.get_logger()


async def log_audit(
    action: str,
    outcome: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    role: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """
    Insert an audit log entry into MongoDB.
    Called after every mutation or security-relevant action.
    """
    db = get_database()
    if db is None:
        logger.warning("Database not available for audit logging")
        return

    audit_entry = {
        "log_id": f"AUD-{uuid.uuid4().hex[:8].upper()}",
        "user_id": user_id,
        "user_email": user_email,
        "role": role,
        "action": action,
        "details": details,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "outcome": outcome,
        "timestamp": datetime.now(timezone.utc),
    }

    try:
        await db.audit_logs.insert_one(audit_entry)
        # Sync to Supabase (fire-and-forget)
        try:
            from app.services.supabase_sync import sync_audit
            await sync_audit(audit_entry)
        except Exception:
            pass
        logger.info(
            "Audit log recorded",
            action=action,
            outcome=outcome,
            user_email=user_email,
        )
    except Exception as e:
        logger.error("Failed to write audit log", error=str(e))


def get_client_info(request: Request) -> tuple[str, str]:
    """Extract IP address and user agent from request."""
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    return ip, ua
