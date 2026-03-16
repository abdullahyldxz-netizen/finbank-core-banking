import asyncio
import websockets
from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.iso20022 import generate_pacs008_xml
import os

async def get_test_iban():
    mongo_url = os.getenv("MONGODB_URL", "mongodb://mongo:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv("MONGODB_DB_NAME", "finbank")]
    account = await db.accounts.find_one({"iban": {"$exists": True, "$regex": "^FINB"}})
    if account:
        return account["iban"]
    print("WARNING: No valid IBAN found. DB might be empty.")
    return "FINB0000000000000000000000"

async def test_ws():
    receiver_iban = await get_test_iban()
    print(f"Testing with Receiver IBAN: {receiver_iban}")

    msg_id, xml_msg = generate_pacs008_xml(
        amount=10.0,
        currency="TRY",
        sender_name="Sender",
        sender_iban="DGBNK00000001230000000123",
        receiver_name="Receiver Test",
        receiver_iban=receiver_iban,
        receiver_bank_bic="FINB",
        description="Test inbound transfer"
    )

    try:
        async with websockets.connect("ws://127.0.0.1:8000/ws/inter-bank/DGBNK") as ws:
            await ws.send(xml_msg)
            print("Sent pacs.008 XML.")
            
            response = await ws.recv()
            print("====================================")
            print("Received response:")
            print(response)
            print("====================================")
    except Exception as e:
        print(f"WebSocket test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
