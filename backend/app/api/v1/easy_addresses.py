import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.easy_address import EasyAddressCreate, EasyAddressResponse, EasyAddressResolveResponse

router = APIRouter()

def mask_name(full_name: str) -> str:
    parts = full_name.split()
    masked_parts = []
    for part in parts:
        if len(part) > 2:
            masked_parts.append(part[:2] + "*" * (len(part) - 2))
        else:
            masked_parts.append(part)
    return " ".join(masked_parts)

@router.post("/", response_model=EasyAddressResponse, status_code=201)
async def create_easy_address(
    req: EasyAddressCreate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    # Verify account ownership
    account = await db.accounts.find_one({
        "account_id": req.account_id,
        "user_id": current_user["user_id"]
    })
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or access denied")
        
    # Check if alias already exists
    existing = await db.easy_addresses.find_one({
        "alias_type": req.alias_type.value,
        "alias_value": req.alias_value
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="This easy address alias is already registered to an account.")
        
    now = datetime.now(timezone.utc)
    address_id = str(uuid.uuid4())
    
    doc = {
        "id": address_id,
        "user_id": current_user["user_id"],
        "account_id": account["account_id"],
        "iban": account["iban"],
        "alias_type": req.alias_type.value,
        "alias_value": req.alias_value,
        "created_at": now
    }
    
    await db.easy_addresses.insert_one(doc)
    
    return doc

@router.get("/", response_model=list[EasyAddressResponse])
async def list_easy_addresses(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    cursor = db.easy_addresses.find({"user_id": current_user["user_id"]})
    addresses = await cursor.to_list(100)
    return addresses

@router.delete("/{alias_type}/{alias_value}")
async def delete_easy_address(
    alias_type: str,
    alias_value: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    result = await db.easy_addresses.delete_one({
        "user_id": current_user["user_id"],
        "alias_type": alias_type,
        "alias_value": alias_value
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Easy address not found")
        
    return {"message": "Easy address deleted successfully"}

@router.get("/resolve", response_model=EasyAddressResolveResponse)
async def resolve_easy_address(
    alias_value: str = Query(..., description="The value of the alias (phone, email, etc)"),
    db=Depends(get_database)
):
    address = await db.easy_addresses.find_one({"alias_value": alias_value})
    if not address:
        raise HTTPException(status_code=404, detail="Easy address not found")
        
    # Find user to get the name
    user = await db.customers.find_one({"user_id": address["user_id"]})
    full_name = user.get("full_name", "Unknown User") if user else "Unknown User"
    
    return {
        "alias_type": address["alias_type"],
        "alias_value": address["alias_value"],
        "full_name_masked": mask_name(full_name),
        "iban": address["iban"]
    }
