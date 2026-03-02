"""
FinBank - Messages API (Internal Messaging System)
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_database
from app.core.security import get_current_user
import uuid

router = APIRouter(prefix="/messages", tags=["Messages"])


class SendMessageRequest(BaseModel):
    subject: str
    body: str
    to_role: str = "employee"  # "employee", "ceo", "admin"


class ReplyMessageRequest(BaseModel):
    reply: str


@router.post("/")
async def send_message(
    msg: SendMessageRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Send a message (customer -> employee/ceo or staff -> customer)."""
    doc = {
        "message_id": str(uuid.uuid4()),
        "from_user_id": current_user["user_id"],
        "from_email": current_user["email"],
        "from_role": current_user["role"],
        "to_role": msg.to_role,
        "subject": msg.subject,
        "body": msg.body,
        "reply": None,
        "replied_by": None,
        "read": False,
        "created_at": datetime.now(timezone.utc),
        "replied_at": None,
    }
    await db.messages.insert_one(doc)
    return {"message": "Mesajınız başarıyla gönderildi.", "id": doc["message_id"]}


@router.get("/inbox")
async def get_inbox(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get messages for the current user's role inbox."""
    role = current_user["role"]
    
    if role == "customer":
        # Customers see messages they sent
        messages = await db.messages.find(
            {"from_user_id": current_user["user_id"]}
        ).sort("created_at", -1).to_list(50)
    else:
        # Staff see messages sent TO their role
        messages = await db.messages.find(
            {"to_role": role}
        ).sort("created_at", -1).to_list(50)

    # Clean MongoDB _id for JSON serialization
    for m in messages:
        m["_id"] = str(m["_id"])

    return messages


@router.post("/{message_id}/reply")
async def reply_message(
    message_id: str,
    body: ReplyMessageRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Reply to a message."""
    msg = await db.messages.find_one({"message_id": message_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Mesaj bulunamadı.")

    await db.messages.update_one(
        {"message_id": message_id},
        {"$set": {
            "reply": body.reply,
            "replied_by": current_user["email"],
            "replied_at": datetime.now(timezone.utc),
            "read": True,
        }}
    )
    return {"message": "Yanıt başarıyla gönderildi."}


@router.patch("/{message_id}/read")
async def mark_read(
    message_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Mark a message as read."""
    await db.messages.update_one(
        {"message_id": message_id},
        {"$set": {"read": True}}
    )
    return {"message": "Okundu olarak işaretlendi."}
