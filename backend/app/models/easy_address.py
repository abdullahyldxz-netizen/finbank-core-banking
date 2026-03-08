from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class AliasType(str, Enum):
    EMAIL = "email"
    PHONE = "phone"
    TC_KIMLIK = "tc_kimlik"
    PASSPORT = "passport"

class EasyAddressCreate(BaseModel):
    account_id: str = Field(..., description="The ID of the account to link")
    alias_type: AliasType = Field(..., description="Type of alias (email, phone, etc.)")
    alias_value: str = Field(..., description="The actual value of the alias")

class EasyAddressResponse(BaseModel):
    id: str
    user_id: str
    account_id: str
    iban: str
    alias_type: AliasType
    alias_value: str
    created_at: datetime
    
class EasyAddressResolveResponse(BaseModel):
    alias_type: str
    alias_value: str
    full_name_masked: str
    iban: str
