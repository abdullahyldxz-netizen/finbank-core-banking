import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def exhaustive_search():
    mongodb_url = "mongodb://127.0.0.1:27017" # Local mapped port
    print(f"Connecting to {mongodb_url}...")
    try:
        client = MongoClient(mongodb_url, directConnection=True, serverSelectionTimeoutMS=5000)
        dbs = client.list_database_names()
        print(f"Databases found: {dbs}")
        
        target_patterns = ["8615", "8728"]
        
        for db_name in dbs:
            db = client[db_name]
            try:
                collections = db.list_collection_names()
            except:
                continue
                
            for col_name in collections:
                col = db[col_name]
                try:
                    # Look for any document where any field contains the pattern
                    # We'll just look at all docs (limited to prevent overflow)
                    docs = list(col.find().limit(500))
                    for doc in docs:
                        doc_str = str(doc)
                        for pattern in target_patterns:
                            if pattern in doc_str:
                                print(f" MATCH FOUND!")
                                print(f" DB: {db_name}")
                                print(f" Collection: {col_name}")
                                print(f" Document: {doc}")
                                return
                except Exception as e:
                    # Skip system collections or restricted ones
                    continue
        
        print("No matches found in any database.")
    except Exception as e:
        print(f"Connection Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    exhaustive_search()
