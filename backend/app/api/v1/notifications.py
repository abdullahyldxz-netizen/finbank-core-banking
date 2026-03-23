"""
FinBank - In-app notification API routes.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def list_notifications(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
):
    docs = (
        await db.notifications.find({"user_id": current_user["user_id"]})
        .sort("created_at", -1)
        .to_list(100)
    )
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs


@router.get("/unread-count")
async def unread_count(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
):
    count = await db.notifications.count_documents(
        {"user_id": current_user["user_id"], "read": False}
    )
    return {"count": count}


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
):
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.patch("/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
):
    await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}},
    )
    return {"message": "All notifications marked as read"}
