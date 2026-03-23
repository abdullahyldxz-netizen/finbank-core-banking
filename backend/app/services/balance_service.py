"""
Helpers for ledger-derived balance calculations.
"""
from app.services.ledger_service import LedgerService


async def get_user_total_balance(db, user_id: str) -> float:
    """
    Sum all active account balances for a user from ledger entries.
    """
    accounts = await db.accounts.find({"user_id": user_id, "status": "active"}).to_list(100)
    ledger = LedgerService(db)
    total = 0.0
    for account in accounts:
        total += await ledger.get_balance(account["account_id"])
    return total
