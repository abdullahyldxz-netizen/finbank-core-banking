import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def main():
    mongo_url = "mongodb://localhost:27017"
    db_name = os.getenv("MONGODB_DB_NAME", "finbank")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        count = await db.users.count_documents({})
        print(f"Total users found: {count}")
        users = await db.users.find().to_list(10)
        for u in users:
            print(f" - {u.get('email')} ({u.get('role')})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
