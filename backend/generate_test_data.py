import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone
import random

async def main():
    print("MongoDB'ye bağlanılıyor... (Lütfen Docker'ın çalıştığından emin olun)")
    client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    
    try:
        await client.admin.command('ping')
        print("MongoDB Bağlantısı Başarılı!")
    except Exception as e:
        print("Hata: MongoDB'ye ulaşılamıyor. Lütfen 'docker-compose up -d mongo' komutunu çalıştırın.")
        return

    db = client["finbank"]
    now = datetime.now(timezone.utc)

    # 1. Müşteri (Customer) Oluştur
    customer_user_id = str(uuid.uuid4())
    customer_email = f"customer_{random.randint(100,999)}@finbank.com"
    await db.users.insert_one({
        "user_id": customer_user_id,
        "email": customer_email,
        "role": "customer",
        "is_active": True
    })
    
    customer_id = str(uuid.uuid4())
    await db.customers.insert_one({
        "user_id": customer_user_id,
        "customer_id": customer_id,
        "full_name": "Test Müşteri",
        "national_id": "11111111111",
        "status": "active"
    })
    print(f"✅ Müşteri oluşturuldu: {customer_email}")

    # Müşteri için aktif bir Kredi Kartı oluştur
    card_id = str(uuid.uuid4())
    await db.credit_cards.insert_one({
        "id": card_id,
        "customer_id": customer_id,
        "card_number": "4" + "".join([str(random.randint(0, 9)) for _ in range(15)]),
        "expiry_date": "12/28",
        "cvv": "123",
        "limit": 10000.0,
        "current_debt": 0.0,
        "available_limit": 10000.0,
        "interest_rate": 3.5,
        "status": "active",
        "created_at": now,
        "updated_at": now
    })
    print("✅ Kredi Kartı oluşturuldu (Limit: 10.000 TL)")

    # 2. Çalışan (Employee / Employer) Oluştur
    employee_user_id = str(uuid.uuid4())
    employee_email = f"employee_{random.randint(100,999)}@finbank.com"
    await db.users.insert_one({
        "user_id": employee_user_id,
        "email": employee_email,
        "role": "employee",
        "is_active": True
    })
    print(f"✅ Çalışan oluşturuldu: {employee_email}")

    # 3. CEO Oluştur
    ceo_user_id = str(uuid.uuid4())
    ceo_email = f"ceo_{random.randint(100,999)}@finbank.com"
    await db.users.insert_one({
        "user_id": ceo_user_id,
        "email": ceo_email,
        "role": "ceo",
        "is_active": True
    })
    print(f"✅ CEO oluşturuldu: {ceo_email}")

    # 4. Limit Artırım Talebi (Approval Request) Oluştur
    await db.approvals.insert_one({
        "user_id": customer_user_id,
        "user_name": "Test Müşteri",
        "request_type": "CREDIT_LIMIT_INCREASE",
        "amount": 50000.0,
        "currency": "TRY",
        "description": "Kredi Kartı Limit Artış Talebi",
        "status": "PENDING_EMPLOYER",
        "risk_score": "HIGH",
        "metadata": {
            "card_id": card_id
        },
        "created_at": now,
        "updated_at": now,
        "employer_notes": None,
        "ceo_notes": None
    })
    print("✅ Bekleyen Employer Onay Talebi oluşturuldu (Limit artırımı: 50.000 TL)")

    print("\n--- TEST HESAPLARI BAŞARIYLA OLUŞTURULDU ---")
    print("Tüm şifreler (eğer supabasede manuel giriş yapmıyorsanız token veya UI üzerinden giriş yapabilirsiniz).")

if __name__ == "__main__":
    asyncio.run(main())
