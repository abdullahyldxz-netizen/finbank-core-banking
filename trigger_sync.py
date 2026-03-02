import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/backend")

from app.core.database import connect_to_mongo, get_database, close_mongo_connection
from app.services.supabase_sync import (
    sync_user, sync_customer, sync_account, sync_transaction, sync_audit
)

async def main():
    await connect_to_mongo()
    db = get_database()
    
    print("Syncing Users...")
    async for user in db.users.find():
        await sync_user(user)
        
    print("Syncing Customers...")
    async for customer in db.customers.find():
        await sync_customer(customer)
        
    print("Syncing Accounts...")
    async for account in db.accounts.find():
        await sync_account(account)
        
    print("Syncing Transactions...")
    async for txn in db.ledger_entries.find():
        await sync_transaction(txn)
        
    print("Syncing Audits...")
    async for audit in db.audit_logs.find():
        await sync_audit(audit)
        
    print("Done!")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
