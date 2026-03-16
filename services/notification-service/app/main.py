"""
FinBank Notification Service — Messages, Email, WebSocket Notifications
Port: 8003
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime, timezone
import os, sys, uuid, json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.jwt_utils import get_current_user, decode_token
from shared.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_runtime_settings()
    db = await connect_to_mongo()
    await db.messages.create_index("sender_id")
    await db.messages.create_index("receiver_role")
    await db.messages.create_index("created_at")
    await db.notifications.create_index("user_id")
    await db.notifications.create_index("read")
    yield
    await close_mongo_connection()


app = FastAPI(title="FinBank Notification Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ══════════════════════════════════════════════════
# WebSocket Connection Manager (Geliştirilmiş)
# ══════════════════════════════════════════════════
class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, user_id: str):
        await ws.accept()
        if user_id not in self.active:
            self.active[user_id] = []
        self.active[user_id].append(ws)
        print(f"[WS] Kullanıcı bağlandı: {user_id} (toplam: {len(self.active[user_id])} bağlantı)")

    def disconnect(self, ws: WebSocket, user_id: str):
        if user_id in self.active:
            self.active[user_id] = [w for w in self.active[user_id] if w != ws]
            if not self.active[user_id]:
                del self.active[user_id]
        print(f"[WS] Kullanıcı ayrıldı: {user_id}")

    async def send_to_user(self, user_id: str, message: dict):
        """Belirli bir kullanıcıya WebSocket mesajı gönder."""
        if user_id in self.active:
            dead_connections = []
            for ws in self.active[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_connections.append(ws)
            # Ölü bağlantıları temizle
            for ws in dead_connections:
                self.active[user_id] = [w for w in self.active[user_id] if w != ws]

    async def broadcast(self, message: dict):
        """Tüm bağlı kullanıcılara mesaj gönder."""
        for user_id in list(self.active.keys()):
            await self.send_to_user(user_id, message)

    def get_online_users(self) -> List[str]:
        """Online kullanıcıların listesini döndür."""
        return list(self.active.keys())

    def is_online(self, user_id: str) -> bool:
        """Kullanıcının online olup olmadığını kontrol et."""
        return user_id in self.active and len(self.active[user_id]) > 0


manager = ConnectionManager()


# ── Models ──
class MessageSendRequest(BaseModel):
    receiver_role: str = "employee"
    subject: str
    body: str

class ReplyRequest(BaseModel):
    reply_body: str


# ══════════════════════════════════════════════════
# Internal Notify Model (Bankalar Arası Transfer)
# ══════════════════════════════════════════════════
class TransferNotifyRequest(BaseModel):
    sender_user_id: str
    receiver_user_id: str
    sender_name: str = "FinBank Kullanıcısı"
    receiver_name: str = "FinBank Kullanıcısı"
    amount: float
    currency: str = "TRY"
    transfer_ref: str
    description: Optional[str] = None
    sender_iban: Optional[str] = None
    receiver_iban: Optional[str] = None


class GenericNotifyRequest(BaseModel):
    user_id: str
    type: str  # "info", "success", "warning", "error"
    title: str
    message: str
    metadata: Optional[dict] = None


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "notification-service"}


# ══════════════════════════════════════════════════
# Messages Endpoints
# ══════════════════════════════════════════════════
@app.post("/messages")
async def send_message(body: MessageSendRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    doc = {
        "message_id": str(uuid.uuid4()),
        "sender_id": current_user["user_id"],
        "sender_email": current_user["email"],
        "sender_role": current_user["role"],
        "receiver_role": body.receiver_role,
        "subject": body.subject,
        "body": body.body,
        "status": "open",
        "reply": None,
        "reply_by": None,
        "reply_at": None,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(doc)
    return {"message": "Mesajınız gönderildi ✅", "message_id": doc["message_id"]}


@app.get("/messages/inbox")
async def get_inbox(current_user=Depends(get_current_user), db=Depends(get_database)):
    role = current_user["role"]
    if role == "customer":
        query = {"sender_id": current_user["user_id"]}
    else:
        query = {"receiver_role": {"$in": [role, "employee"]}}

    messages = await db.messages.find(query).sort("created_at", -1).to_list(50)
    for m in messages:
        m["_id"] = str(m["_id"])
    return messages


@app.post("/messages/{message_id}/reply")
async def reply_message(message_id: str, body: ReplyRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    msg = await db.messages.find_one({"message_id": message_id})
    if not msg:
        raise HTTPException(404, "Mesaj bulunamadı.")

    await db.messages.update_one({"message_id": message_id}, {"$set": {
        "reply": body.reply_body,
        "reply_by": current_user["email"],
        "reply_at": datetime.now(timezone.utc),
        "status": "replied",
    }})

    # Real-time notification to sender
    await manager.send_to_user(msg["sender_id"], {
        "type": "message_reply",
        "message": f"Mesajınıza yanıt geldi: {msg['subject']}",
    })

    return {"message": "Yanıt gönderildi ✅"}


@app.patch("/messages/{message_id}/read")
async def mark_read(message_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    await db.messages.update_one({"message_id": message_id}, {"$set": {"read": True}})
    return {"message": "Okundu olarak işaretlendi."}


# ══════════════════════════════════════════════════
# Notifications Endpoints
# ══════════════════════════════════════════════════
@app.get("/notifications")
async def list_notifications(current_user=Depends(get_current_user), db=Depends(get_database)):
    notifs = await db.notifications.find(
        {"user_id": current_user["user_id"]}
    ).sort("created_at", -1).to_list(30)
    for n in notifs:
        n["_id"] = str(n["_id"])
    return notifs


@app.get("/notifications/unread-count")
async def unread_count(current_user=Depends(get_current_user), db=Depends(get_database)):
    count = await db.notifications.count_documents({
        "user_id": current_user["user_id"], "read": False
    })
    return {"count": count}


@app.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    await db.notifications.update_one(
        {"notification_id": notification_id}, {"$set": {"read": True}}
    )
    return {"message": "Bildirim okundu."}


@app.patch("/notifications/read-all")
async def mark_all_read(current_user=Depends(get_current_user), db=Depends(get_database)):
    await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Tüm bildirimler okundu."}


# ══════════════════════════════════════════════════
# 🔔 Internal Notify — Transfer Bildirimi
# Banking Service → Notification Service
# ══════════════════════════════════════════════════
@app.post("/internal/notify/transfer")
async def notify_transfer(body: TransferNotifyRequest, db=Depends(get_database)):
    """
    Banking service transfer sonrası bu endpoint'i çağırır.
    Gönderici ve alıcıya hem DB'ye kayıt hem WS push yapar.
    """
    now = datetime.now(timezone.utc)

    # ── Gönderici bildirimi ──
    sender_notif = {
        "notification_id": str(uuid.uuid4()),
        "user_id": body.sender_user_id,
        "type": "transfer_sent",
        "title": "Para Transferi Gönderildi 💸",
        "message": f"{body.amount:,.2f} {body.currency} tutarında transfer {body.receiver_name} hesabına gönderildi.",
        "metadata": {
            "transfer_ref": body.transfer_ref,
            "amount": body.amount,
            "currency": body.currency,
            "receiver_name": body.receiver_name,
            "receiver_iban": body.receiver_iban,
            "description": body.description,
        },
        "read": False,
        "created_at": now,
    }

    # ── Alıcı bildirimi ──
    receiver_notif = {
        "notification_id": str(uuid.uuid4()),
        "user_id": body.receiver_user_id,
        "type": "transfer_received",
        "title": "Para Transferi Alındı 🎉",
        "message": f"{body.sender_name} tarafından {body.amount:,.2f} {body.currency} tutarında transfer alındı.",
        "metadata": {
            "transfer_ref": body.transfer_ref,
            "amount": body.amount,
            "currency": body.currency,
            "sender_name": body.sender_name,
            "sender_iban": body.sender_iban,
            "description": body.description,
        },
        "read": False,
        "created_at": now,
    }

    # DB'ye kaydet
    await db.notifications.insert_many([sender_notif, receiver_notif])

    # WebSocket üzerinden anlık push
    await manager.send_to_user(body.sender_user_id, {
        "type": "transfer_sent",
        "title": sender_notif["title"],
        "message": sender_notif["message"],
        "metadata": sender_notif["metadata"],
        "notification_id": sender_notif["notification_id"],
        "created_at": now.isoformat(),
    })

    await manager.send_to_user(body.receiver_user_id, {
        "type": "transfer_received",
        "title": receiver_notif["title"],
        "message": receiver_notif["message"],
        "metadata": receiver_notif["metadata"],
        "notification_id": receiver_notif["notification_id"],
        "created_at": now.isoformat(),
    })

    return {
        "message": "Bildirimler gönderildi ✅",
        "sender_online": manager.is_online(body.sender_user_id),
        "receiver_online": manager.is_online(body.receiver_user_id),
    }


@app.post("/internal/notify/generic")
async def notify_generic(body: GenericNotifyRequest, db=Depends(get_database)):
    """
    Genel amaçlı bildirim endpoint'i.
    Herhangi bir servis bunu çağırarak kullanıcıya bildirim gönderebilir.
    """
    now = datetime.now(timezone.utc)
    notif = {
        "notification_id": str(uuid.uuid4()),
        "user_id": body.user_id,
        "type": body.type,
        "title": body.title,
        "message": body.message,
        "metadata": body.metadata or {},
        "read": False,
        "created_at": now,
    }
    await db.notifications.insert_one(notif)

    await manager.send_to_user(body.user_id, {
        "type": body.type,
        "title": body.title,
        "message": body.message,
        "metadata": body.metadata or {},
        "notification_id": notif["notification_id"],
        "created_at": now.isoformat(),
    })

    return {"message": "Bildirim gönderildi ✅", "online": manager.is_online(body.user_id)}


# ══════════════════════════════════════════════════
# WebSocket Status (Debug)
# ══════════════════════════════════════════════════
@app.get("/internal/ws/status")
async def ws_status():
    """WebSocket bağlantı durumunu gösteren debug endpoint'i."""
    return {
        "online_users": manager.get_online_users(),
        "total_connections": sum(len(conns) for conns in manager.active.values()),
    }


# ══════════════════════════════════════════════════
# WebSocket Endpoint
# ══════════════════════════════════════════════════
@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            await websocket.close()
            return
    except Exception:
        await websocket.close()
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Client'tan gelen mesajları handle et
            try:
                msg = json.loads(data)
                msg_type = msg.get("type", "")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg_type == "subscribe":
                    # Gelecekte kanal bazlı abonelik için
                    await websocket.send_json({"type": "subscribed", "channel": msg.get("channel", "default")})
            except json.JSONDecodeError:
                # Plain text ping-pong
                if data == "ping":
                    await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)
