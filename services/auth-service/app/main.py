"""
FinBank Auth Service — Registration, Login, 2FA, Sessions
Port: 8001
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
import os, sys, uuid, random, bcrypt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.jwt_utils import create_access_token, get_current_user
from shared.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = await connect_to_mongo()
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.verification_codes.create_index("email")
    await db.verification_codes.create_index("expires_at", expireAfterSeconds=0)
    await db.sessions.create_index("user_id")
    await db.sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.login_history.create_index("user_id")
    yield
    await close_mongo_connection()


app = FastAPI(title="FinBank Auth Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ── Models ──
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "customer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendCodeRequest(BaseModel):
    email: EmailStr


# ── Helpers ──
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth-service"}


@app.post("/register")
async def register(body: RegisterRequest, request: Request, db=Depends(get_database)):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı.")

    user_doc = {
        "user_id": str(uuid.uuid4()),
        "email": body.email,
        "password_hash": hash_password(body.password),
        "full_name": body.full_name,
        "role": body.role if body.role in ["customer", "employee", "admin", "ceo"] else "customer",
        "is_active": False,
        "is_verified": False,
        "two_factor_enabled": False,
        "two_factor_secret": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)

    # Generate OTP
    otp = f"{random.randint(100000, 999999)}"
    await db.verification_codes.insert_one({
        "email": body.email,
        "code": otp,
        "used": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "created_at": datetime.now(timezone.utc),
    })

    # TODO: Send OTP via Resend email service (notification-service)

    return {"message": "Kayıt başarılı! E-posta doğrulama kodu gönderildi.", "email": body.email}


@app.post("/login")
async def login(body: LoginRequest, request: Request, db=Depends(get_database)):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        # Log failed attempt
        await db.login_history.insert_one({
            "email": body.email,
            "success": False,
            "ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown"),
            "timestamp": datetime.now(timezone.utc),
        })
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")

    if not user.get("is_verified", False) and not user.get("is_active", False):
        raise HTTPException(status_code=403, detail="E-posta doğrulanmamış. Lütfen doğrulama kodunuzu girin.")

    # 2FA check
    if user.get("two_factor_enabled"):
        if not body.totp_code:
            return {"requires_2fa": True, "message": "2FA kodu gerekli."}
        import pyotp
        totp = pyotp.TOTP(user["two_factor_secret"])
        if not totp.verify(body.totp_code):
            raise HTTPException(status_code=401, detail="2FA kodu hatalı.")

    token = create_access_token({
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user["role"],
    })

    # Create session
    session_id = str(uuid.uuid4())
    await db.sessions.insert_one({
        "session_id": session_id,
        "user_id": user["user_id"],
        "ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
    })

    # Log successful login
    await db.login_history.insert_one({
        "user_id": user["user_id"],
        "email": user["email"],
        "success": True,
        "ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "timestamp": datetime.now(timezone.utc),
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
        },
    }


@app.post("/verify-email")
async def verify_email(body: VerifyEmailRequest, db=Depends(get_database)):
    code_doc = await db.verification_codes.find_one({
        "email": body.email, "code": body.code, "used": False,
    })
    if not code_doc:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş kod.")

    if code_doc["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Kodun süresi dolmuş. Yeni kod talep edin.")

    await db.verification_codes.update_one({"_id": code_doc["_id"]}, {"$set": {"used": True}})
    await db.users.update_one({"email": body.email}, {"$set": {"is_verified": True, "is_active": True}})

    return {"message": "E-posta doğrulandı! Artık giriş yapabilirsiniz. ✅"}


@app.post("/resend-code")
async def resend_code(body: ResendCodeRequest, db=Depends(get_database)):
    user = await db.users.find_one({"email": body.email})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    await db.verification_codes.update_many(
        {"email": body.email, "used": False},
        {"$set": {"used": True}}
    )

    otp = f"{random.randint(100000, 999999)}"
    await db.verification_codes.insert_one({
        "email": body.email,
        "code": otp,
        "used": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "created_at": datetime.now(timezone.utc),
    })

    return {"message": "Yeni doğrulama kodu gönderildi."}


# ── Session Management ──
@app.get("/sessions")
async def list_sessions(current_user=Depends(get_current_user), db=Depends(get_database)):
    sessions = await db.sessions.find(
        {"user_id": current_user["user_id"]}
    ).sort("created_at", -1).to_list(20)
    return [{
        "session_id": s["session_id"],
        "ip": s.get("ip", "unknown"),
        "user_agent": s.get("user_agent", "unknown"),
        "created_at": s["created_at"].isoformat(),
    } for s in sessions]


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    await db.sessions.delete_one({"session_id": session_id, "user_id": current_user["user_id"]})
    return {"message": "Oturum sonlandırıldı."}


@app.delete("/sessions")
async def delete_all_sessions(current_user=Depends(get_current_user), db=Depends(get_database)):
    await db.sessions.delete_many({"user_id": current_user["user_id"]})
    return {"message": "Tüm oturumlar sonlandırıldı."}


# ── Login History ──
@app.get("/login-history")
async def login_history(current_user=Depends(get_current_user), db=Depends(get_database)):
    docs = await db.login_history.find(
        {"user_id": current_user["user_id"]}
    ).sort("timestamp", -1).to_list(30)
    return [{
        "success": d["success"],
        "ip": d.get("ip", "unknown"),
        "user_agent": d.get("user_agent", "unknown"),
        "timestamp": d["timestamp"].isoformat(),
    } for d in docs]


# ── 2FA Setup ──
@app.post("/2fa/setup")
async def setup_2fa(current_user=Depends(get_current_user), db=Depends(get_database)):
    import pyotp
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_user["email"], issuer_name="FinBank")

    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"two_factor_secret": secret}}
    )

    return {"secret": secret, "qr_uri": uri, "message": "2FA için QR kodunu tarayın."}


@app.post("/2fa/verify")
async def verify_2fa(code: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    import pyotp
    user = await db.users.find_one({"user_id": current_user["user_id"]})
    if not user or not user.get("two_factor_secret"):
        raise HTTPException(status_code=400, detail="Önce 2FA kurulumu yapın.")

    totp = pyotp.TOTP(user["two_factor_secret"])
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Geçersiz 2FA kodu.")

    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"two_factor_enabled": True}}
    )
    return {"message": "2FA başarıyla etkinleştirildi! 🔒"}


@app.delete("/2fa/disable")
async def disable_2fa(current_user=Depends(get_current_user), db=Depends(get_database)):
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"two_factor_enabled": False, "two_factor_secret": None}}
    )
    return {"message": "2FA devre dışı bırakıldı."}
