import httpx
import asyncio

API_URL = "http://localhost:8000/api/v1"

async def setup_demo():
    email = "test.cocuk@finbank.com"
    password = "Password123!"

    async with httpx.AsyncClient(timeout=10) as client:
        # 1. Register (ignore if exists)
        try:
            await client.post(f"{API_URL}/auth/register", json={
                "email": email, "password": password
            })
        except:
            pass

        # 2. Login
        login_res = await client.post(f"{API_URL}/auth/login", json={
            "email": email, "password": password
        })
        if login_res.status_code != 200:
            print(f"[!] Giriş başarısız: {login_res.text}")
            return
        token = login_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("[+] Giriş yapıldı.")

        # 3. Create customer profile (ignore if exists)
        try:
            cust_res = await client.post(f"{API_URL}/customers/", json={
                "full_name": "Ali Yılmaz",
                "national_id": "12345678901",
                "phone": "+905551234567",
                "date_of_birth": "2000-01-01",
                "address": "İstanbul, Türkiye"
            }, headers=headers)
            if cust_res.status_code in (200, 201):
                print("[+] Müşteri profili oluşturuldu.")
            else:
                print("[~] Profil zaten mevcut veya hata:", cust_res.text[:80])
        except:
            print("[~] Profil zaten mevcut.")

        # 4. Open checking account (if none)
        acc_list_res = await client.get(f"{API_URL}/accounts/mine", headers=headers)
        accounts = acc_list_res.json() if acc_list_res.status_code == 200 else []

        account_id = None
        if len(accounts) == 0:
            acc_res = await client.post(f"{API_URL}/accounts/", json={
                "currency": "TRY", "account_type": "checking"
            }, headers=headers)
            if acc_res.status_code in (200, 201):
                account_id = acc_res.json()["id"]
                print(f"[+] Vadesiz hesap açıldı: {acc_res.json()['iban']}")
        else:
            account_id = accounts[0]["id"]
            print(f"[~] Mevcut hesap kullanılıyor: {accounts[0]['iban']}")

        # 5. Deposit 5000 TRY
        if account_id:
            dep_res = await client.post(f"{API_URL}/transactions/deposit", json={
                "account_id": account_id,
                "amount": 5000.0,
                "description": "Başlangıç bakiyesi"
            }, headers=headers)
            if dep_res.status_code in (200, 201):
                print("[+] 5.000 ₺ yatırıldı!")
            else:
                print(f"[-] Para yatırma hatası: {dep_res.text[:80]}")

        # 6. Open second savings account + deposit
        if len(accounts) < 2:
            acc2 = await client.post(f"{API_URL}/accounts/", json={
                "currency": "TRY", "account_type": "savings"
            }, headers=headers)
            if acc2.status_code in (200, 201):
                acc2_id = acc2.json()["id"]
                print(f"[+] Tasarruf hesabı açıldı: {acc2.json()['iban']}")
                dep2 = await client.post(f"{API_URL}/transactions/deposit", json={
                    "account_id": acc2_id,
                    "amount": 2500.0,
                    "description": "Tasarruf başlangıç"
                }, headers=headers)
                if dep2.status_code in (200, 201):
                    print("[+] 2.500 ₺ tasarruf hesabına yatırıldı!")

        print("\n✅ Demo hesap hazır!")
        print(f"   E-posta: {email}")
        print(f"   Şifre  : {password}")
        print("   Toplam bakiye: ~7.500 ₺")

if __name__ == "__main__":
    asyncio.run(setup_demo())
