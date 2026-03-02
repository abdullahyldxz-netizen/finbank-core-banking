"""
FinBank - Ledger API Routes (Query-only, append-only ledger)
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user, require_admin
from app.models.ledger import LedgerEntryResponse, LedgerListResponse
from app.services.ledger_service import LedgerService

router = APIRouter(prefix="/ledger", tags=["Ledger"])


@router.get("/", response_model=LedgerListResponse)
async def get_ledger_entries(
    account_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Query ledger entries. Customers can only see their own accounts.
    Admins can see all entries.
    """
    # If not admin, restrict to own accounts
    if current_user["role"] != "admin" and account_id:
        account = await db.accounts.find_one({"account_id": account_id})
        if not account or account["user_id"] != current_user["user_id"]:
            return LedgerListResponse(entries=[], total=0, skip=skip, limit=limit)

    # If customer doesn't specify account, get all their accounts
    effective_account_id = account_id
    if current_user["role"] != "admin" and not account_id:
        accounts = await db.accounts.find(
            {"user_id": current_user["user_id"]}
        ).to_list(50)
        if not accounts:
            return LedgerListResponse(entries=[], total=0, skip=skip, limit=limit)
        # Get entries for all user accounts
        account_ids = [a["account_id"] for a in accounts]
        ledger = LedgerService(db)
        all_entries = []
        total = 0
        for aid in account_ids:
            entries, count = await ledger.get_entries(
                account_id=aid,
                entry_type=type,
                category=category,
                from_date=from_date,
                to_date=to_date,
                skip=skip,
                limit=limit,
            )
            all_entries.extend(entries)
            total += count

        # Sort by created_at and apply pagination
        all_entries.sort(key=lambda x: x["created_at"], reverse=True)
        paginated = all_entries[skip:skip + limit]

        return LedgerListResponse(
            entries=[
                LedgerEntryResponse(
                    id=str(e["_id"]),
                    entry_id=e["entry_id"],
                    account_id=e["account_id"],
                    type=e["type"],
                    category=e["category"],
                    amount=e["amount"],
                    transaction_ref=e["transaction_ref"],
                    description=e.get("description"),
                    created_at=e["created_at"],
                    created_by=e["created_by"],
                )
                for e in paginated
            ],
            total=total,
            skip=skip,
            limit=limit,
        )

    ledger = LedgerService(db)
    entries, total = await ledger.get_entries(
        account_id=effective_account_id,
        entry_type=type,
        category=category,
        from_date=from_date,
        to_date=to_date,
        skip=skip,
        limit=limit,
    )

    return LedgerListResponse(
        entries=[
            LedgerEntryResponse(
                id=str(e["_id"]),
                entry_id=e["entry_id"],
                account_id=e["account_id"],
                type=e["type"],
                category=e["category"],
                amount=e["amount"],
                transaction_ref=e["transaction_ref"],
                description=e.get("description"),
                created_at=e["created_at"],
                created_by=e["created_by"],
            )
            for e in entries
        ],
        total=total,
        skip=skip,
        limit=limit,
    )
