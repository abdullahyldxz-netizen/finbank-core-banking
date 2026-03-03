import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid
import random

async def main():
    client = AsyncIOMotorClient('mongodb+srv://admin2:finbankadmin123@cluster0.pwh7s.mongodb.net/finbank?retryWrites=true&w=majority')
    db = client.finbank
    
    # Get pending customer
    customer = await db.customers.find_one({'status': 'pending_kyc'}, sort=[('created_at', -1)])
    if not customer:
        print('No pending customer found')
        return
        
    print(f'Found customer: {customer["first_name"]} {customer["last_name"]}')
    
    # Approve KYC
    await db.customers.update_one(
        {'customer_id': customer['customer_id']},
        {'$set': {'status': 'active', 'kyc_decision': 'approved', 'kyc_notes': 'Auto-approved for demo', 'kyc_reviewed_at': datetime.utcnow()}}
    )
    print('KYC Approved!')
    
    # Check if they already have an account
    existing_acc = await db.accounts.find_one({'customer_id': customer['customer_id']})
    if existing_acc:
        print(f'Account already exists: {existing_acc["iban"]}')
        return
        
    # Create an initial checking account
    acc_num = str(random.randint(1000000000, 9999999999))
    iban = f'TR00000100000{acc_num}0000000000'
    
    await db.accounts.insert_one({
        'account_id': str(uuid.uuid4()),
        'account_number': acc_num,
        'iban': iban,
        'customer_id': customer['customer_id'],
        'user_id': customer['user_id'],
        'account_type': 'checking',
        'currency': 'TRY',
        'status': 'active',
        'created_at': datetime.utcnow()
    })
    print(f'Created Account: {iban}')
    
asyncio.run(main())
