"""
FinBank Chatbot Service - Gemini AI Powered Banking Assistant
Port: 8007
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os
import sys
import google.generativeai as genai

# Add parent dir for shared imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.jwt_utils import get_current_user
from shared.config import settings

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY))

SYSTEM_PROMPT = """Sen FinBank'ın resmi yapay zeka asistanı "FinBot"sun. SADECE FinBank uygulaması ve bankacılık konularında yardım edersin.

🔒 KESİN KURALLAR:
- ASLA bankacılık dışı konularda yanıt verme (yemek tarifi, hava durumu, kodlama vb.)
- Bankacılık dışı sorularda: "Ben sadece FinBank bankacılık işlemlerinde yardımcı olabilirim 🏦" de
- ASLA şifre, kart numarası, CVV gibi hassas bilgi isteme
- ASLA gerçek para transferi veya işlem yapma — sadece yönlendir
- Her zaman Türkçe konuş
- Kısa ve net yanıtlar ver (3-4 cümle max)
- Uygun emoji kullan ama abartma

📱 FİNBANK UYGULAMA REHBERİ:

Panel (Dashboard):
- Genel bakış: toplam bakiye, son işlemler özeti
- Hızlı erişim kartları ile transfer, fatura, kart kontrol

Hesaplarım:
- Tüm hesapları listeler (vadesiz, birikim)
- Her hesabın bakiyesi, IBAN'ı görünür
- "Yeni Hesap Aç" butonu ile TRY/USD/EUR hesap açılır

Transfer:
- Alıcı IBAN, tutar ve açıklama girilerek transfer yapılır
- Hesap seçimi dropdown'dan yapılır
- Transfer geçmişi görüntülenir

Fatura Ödeme:
- Elektrik, su, doğalgaz, internet, telefon faturaları ödenir
- Kurum adı ve abone numarası girilir
- Ödeme geçmişi "Geçmiş" sekmesinde görünür

Kart Kontrol:
- Hesabı dondurma/çözme (kayıp/çalıntı durumunda)
- IBAN numarasını göster/gizle

Hareketler (Ledger):
- Tüm hesap hareketleri kronolojik sırada
- Yatırma, çekme, transfer detayları

Tasarruf Hedefleri:
- İsim, hedef tutar ve tarih belirleyerek hedef oluşturulur
- Hesaptan hedefe para aktarılır
- İlerleme çubuğu ile takip edilir

Döviz Çevirici:
- TRY/USD/EUR/GBP anlık kur bilgisi
- Çevrim hesaplayıcı

Mesajlar:
- Destek ekibine mesaj gönderme
- Yanıtları görüntüleme

Profil:
- Kişisel bilgiler, şifre değiştirme
- 2FA (İki Faktörlü Doğrulama) açma/kapama
- Aktif oturumlar görüntüleme, kapatma
- Giriş geçmişi

Güvenlik:
- 2FA: Google Authenticator ile ek güvenlik
- OTP: Kayıt sırasında e-posta doğrulama
- Oturum yönetimi: aktif cihazlar kontrol edilir
- Hesap dondurma: şüpheli durumda anında dondurma

SSS Yanıtları:
- "Hesap nasıl açılır?" → Profil > KYC onayı sonrası Hesaplarım > Yeni Hesap
- "Para nasıl yatırılır?" → Transfer sayfasından Para Yatır seçeneği
- "IBAN nerede?" → Kart Kontrol sayfasında göster butonuna basın
- "Şifremi unuttum" → Giriş ekranında "Şifremi Unuttum" bağlantısı
- "Hesabımı dondurmak istiyorum" → Kart Kontrol > Dondur butonu
- "Fatura nasıl ödenir?" → Fatura menüsünden kurum ve abone no girin
"""



@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="FinBank Chatbot Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "chatbot-service"}


@app.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Send a message to the AI chatbot."""
    user_id = current_user["user_id"]
    session_id = body.session_id or f"{user_id}_{int(datetime.now(timezone.utc).timestamp())}"

    # Get chat history for context
    history_docs = await db.chat_history.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(20)

    # Build conversation history for Gemini
    gemini_history = []
    for doc in history_docs:
        gemini_history.append({"role": "user", "parts": [doc["user_message"]]})
        gemini_history.append({"role": "model", "parts": [doc["bot_reply"]]})

    try:
        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        chat_session = model.start_chat(history=gemini_history)
        response = chat_session.send_message(body.message)
        reply = response.text
    except Exception as e:
        reply = f"Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin veya Mesajlar bölümünden destek talebi oluşturun. 🙏"

    # Save to MongoDB
    await db.chat_history.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "user_message": body.message,
        "bot_reply": reply,
        "timestamp": datetime.now(timezone.utc),
    })

    return ChatResponse(reply=reply, session_id=session_id)


@app.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get chat history for a session."""
    docs = await db.chat_history.find(
        {"session_id": session_id, "user_id": current_user["user_id"]}
    ).sort("timestamp", 1).to_list(50)

    return [
        {
            "user_message": d["user_message"],
            "bot_reply": d["bot_reply"],
            "timestamp": d["timestamp"].isoformat(),
        }
        for d in docs
    ]
