import requests

base_url = "http://127.0.0.1:8000/api/v1"

# 1. Login to get token
res = requests.post(f"{base_url}/auth/login", json={"email": "test1@finbank.com", "password": "Password123!"})
if res.status_code != 200:
    print("Login failed:", res.text)
    exit(1)

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get accounts
res = requests.get(f"{base_url}/accounts/", headers=headers)
accounts = res.json()
if not accounts:
    print("Need at least 1 account for test1")
    exit(1)

acc1 = accounts[0]["id"]
target_iban = "DGBNK00000001230000000123" # Local Loopback IBAN

# 3. Transfer
print(f"Transferring 10 from {acc1} to External IBAN {target_iban}")
res = requests.post(
    f"{base_url}/transactions/transfer",
    headers=headers,
    json={
        "from_account_id": acc1,
        "target_iban": target_iban,
        "amount": 10,
        "description": "Test Internal Transfer via IBAN"
    }
)

print("Status:", res.status_code)
print("Response:", res.text)
