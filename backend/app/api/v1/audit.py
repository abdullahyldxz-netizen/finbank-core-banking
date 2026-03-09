"""
FinBank - Audit Log API Routes (Admin Only)
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.database import get_database
from app.core.security import require_management
from app.models.audit import AuditLogResponse, AuditListResponse

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/", response_model=AuditListResponse)
async def get_audit_logs(
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    outcome: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_management),
    db=Depends(get_database),
):
    """Admin: Query audit logs with filtering and pagination."""
    query = {}
    if user_id:
        query["user_id"] = user_id
    if action:
        query["action"] = action
    if outcome:
        query["outcome"] = outcome
    if from_date or to_date:
        date_filter = {}
        if from_date:
            date_filter["$gte"] = from_date
        if to_date:
            date_filter["$lte"] = to_date
        query["timestamp"] = date_filter

    total = await db.audit_logs.count_documents(query)
    cursor = (
        db.audit_logs.find(query)
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    logs = await cursor.to_list(limit)

    return AuditListResponse(
        logs=[
            AuditLogResponse(
                id=str(log["_id"]),
                user_id=log.get("user_id"),
                user_email=log.get("user_email"),
                role=log.get("role"),
                action=log["action"],
                details=log.get("details"),
                ip_address=log.get("ip_address"),
                user_agent=log.get("user_agent"),
                outcome=log["outcome"],
                timestamp=log["timestamp"],
            )
            for log in logs
        ],
        total=total,
        skip=skip,
        limit=limit,
    )
