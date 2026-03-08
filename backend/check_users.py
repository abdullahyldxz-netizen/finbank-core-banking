import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["finbank"]
    
    users = await db.users.find().to_list(100)
    print("--- USERS ---")
    for u in users:
        print(f"Email: {u.get('email')} | Role: {u.get('role')} | isActive: {u.get('is_active')}")

if __name__ == "__main__":
    asyncio.run(main())
