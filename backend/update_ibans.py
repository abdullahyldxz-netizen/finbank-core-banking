import asyncio
import os
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def update_ibans():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017").replace("mongo:", "127.0.0.1:").replace("localhost:", "127.0.0.1:")
    if not mongodb_url:
        print("MONGODB_URL not found in .env")
        return

    client = AsyncIOMotorClient(mongodb_url)
    db = client.get_database(os.getenv("MONGODB_DB_NAME", "finbank"))
    accounts_col = db.accounts

    print("Checking accounts...")
    accounts = await accounts_col.find({}).to_list(length=100)
    print(f"Found {len(accounts)} accounts.")

    updated_count = 0
    for acc in accounts:
        old_iban = acc.get("iban", "")
        if old_iban.startswith("TR"):
            acc_num = acc.get("account_number", "").replace(" ", "")
            # New format: FINB + check(2) + bank(6) + acc(14) = 26 chars
            new_iban = f"FINB{random.randint(10,99)}000619{acc_num.zfill(14)}"
            
            await accounts_col.update_one(
                {"_id": acc["_id"]},
                {"$set": {"iban": new_iban}}
            )
            print(f"Updated {old_iban} -> {new_iban}")
            updated_count += 1
    
    print(f"Successfully updated {updated_count} accounts.")
    client.close()

if __name__ == "__main__":
    asyncio.run(update_ibans())
