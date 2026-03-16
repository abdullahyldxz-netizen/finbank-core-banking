import os
import random
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def update_ibans():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017").replace("mongo:", "127.0.0.1:").replace("localhost:", "127.0.0.1:")
    print(f"Connecting to {mongodb_url}...")
    
    try:
        client = MongoClient(mongodb_url, serverSelectionTimeoutMS=5000, directConnection=True)
        db = client.get_database(os.getenv("MONGODB_DB_NAME", "finbank"))
        accounts_col = db.accounts

        print("Checking accounts...")
        # Force server check
        client.admin.command('ping')
        
        accounts = list(accounts_col.find({}))
        print(f"Found {len(accounts)} accounts.")

        updated_count = 0
        for acc in accounts:
            old_iban = acc.get("iban", "")
            print(f"DEBUG: Account {acc.get('account_number')} has IBAN: {old_iban}")
            if old_iban.startswith("TR"):
                acc_num = acc.get("account_number", "").replace(" ", "")
                new_iban = f"FINB{random.randint(10,99)}000619{acc_num.zfill(14)}"
                
                accounts_col.update_one(
                    {"_id": acc["_id"]},
                    {"$set": {"iban": new_iban}}
                )
                print(f"Updated {old_iban} -> {new_iban}")
                updated_count += 1
        
        print(f"Successfully updated {updated_count} accounts.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    update_ibans()
