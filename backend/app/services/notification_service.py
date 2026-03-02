"""
FinBank - Notification Service (Resend & Telegram)
"""
import httpx
import resend
import structlog
from app.core.config import settings

logger = structlog.get_logger()

# Set Resend API Key
resend.api_key = settings.RESEND_API_KEY

async def send_welcome_email(to_email: str, full_name: str):
    """Send a welcome email using Resend"""
    if not settings.RESEND_API_KEY or settings.RESEND_API_KEY == "insert_resend_api_key_here":
        logger.warning("Resend API key not configured, skipping email", email=to_email)
        return False
        
    try:
        html_content = f"""
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="background: linear-gradient(135deg, #6366f1, #818cf8); color: white; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">FB</div>
                    <h1 style="color: #111827; margin-top: 16px;">FinBank'a Hoş Geldiniz!</h1>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Merhaba <strong>{full_name}</strong>,</p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Geleceğin dijital bankacılık deneyimine adım attığınız için teşekkür ederiz. 
                    Hesabınız başarıyla oluşturulmuştur.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="http://localhost:5173/login" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; font-size: 16px;">
                        Giriş Yap ve Başla
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">
                    Bu e-posta otomatik olarak gönderilmiştir. <br />
                    Bizi tercih ettiğiniz için teşekkür ederiz.
                </p>
            </div>
        </div>
        """
        
        # In a real scenario you would have a verified domain for "from", e.g. "onboarding@finbank.com"
        # Resend provides a testing domain: "onboarding@resend.dev"
        params = {
            "from": "FinBank <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "FinBank'a Hoş Geldiniz!",
            "html": html_content,
        }
        
        # This is a sync call in the Resend SDK currently, but let's wrap it politely
        email_response = resend.Emails.send(params)
        logger.info("Welcome email sent via Resend", email=to_email, resend_id=email_response.get("id"))
        return True
        
    except Exception as e:
        logger.error("Failed to send Resend email", error=str(e), email=to_email)
        return False


async def send_verification_email(to_email: str, code: str, full_name: str):
    """Send a 6-digit OTP verification email using Resend"""
    if not settings.RESEND_API_KEY or settings.RESEND_API_KEY == "insert_resend_api_key_here":
        logger.warning("Resend API key not configured, skipping verification email", email=to_email)
        return False

    try:
        html_content = f"""
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="background: linear-gradient(135deg, #6366f1, #818cf8); color: white; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">FB</div>
                    <h1 style="color: #111827; margin-top: 16px;">E-posta Doğrulama</h1>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Merhaba <strong>{full_name}</strong>,</p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    FinBank hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın:
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <div style="background: linear-gradient(135deg, #6366f1, #818cf8); color: white; padding: 16px 32px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; display: inline-block;">
                        {code}
                    </div>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                    Bu kod 10 dakika içinde geçerliliğini yitirecektir.
                </p>
                
                <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 32px;">
                    Bu e-postayı siz talep etmediyseniz, lütfen dikkate almayınız.
                </p>
            </div>
        </div>
        """

        params = {
            "from": "FinBank <onboarding@resend.dev>",
            "to": [to_email],
            "subject": f"FinBank Doğrulama Kodu: {code}",
            "html": html_content,
        }

        email_response = resend.Emails.send(params)
        logger.info("Verification email sent via Resend", email=to_email)
        return True

    except Exception as e:
        logger.error("Failed to send verification email", error=str(e), email=to_email)
        return False


async def send_telegram_message(message: str):
    """
    Send a message via Telegram Bot. 
    100% Free! Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
    """
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        logger.warning("Telegram Bot Token or Chat ID not configured. Skipping Telegram message.")
        return False
        
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            logger.info("Telegram message sent successfully.")
            return True
    except Exception as e:
        logger.error("Failed to send Telegram message", error=str(e))
        return False
