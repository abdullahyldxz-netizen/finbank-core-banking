import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { chatbotApi } from "../services/api";

const QUICK_ACTIONS = [
    { label: "💰 Bakiyem ne?", msg: "Bakiyemi nasıl görebilirim?" },
    { label: "🔄 Transfer yardım", msg: "Nasıl para transfer yapabilirim?" },
    { label: "🏦 IBAN nerede?", msg: "IBAN numaramı nerede bulabilirim?" },
    { label: "📱 2FA nedir?", msg: "İki faktörlü doğrulama nedir ve nasıl açarım?" },
    { label: "💡 Fatura öde", msg: "Fatura ödeme nasıl yapılır?" },
    { label: "🎯 Tasarruf hedefi", msg: "Tasarruf hedefi nasıl oluştururum?" },
    { label: "📩 Destek", msg: "Destek talebi oluşturmak istiyorum" },
];

export default function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "bot", text: "Merhaba! 👋 Ben FinBot, FinBank yapay zeka asistanınız. Bankacılık konularında size yardımcı olabilirim. Ne sormak istersiniz?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const chatRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || loading) return;

        const userMsg = { role: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await chatbotApi.send({
                message: text,
                session_id: sessionId,
            });
            const data = res.data;
            setSessionId(data.session_id);
            setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
        } catch (err) {
            // Fallback: keyword-based response if API fails
            const fallback = getFallbackResponse(text);
            setMessages((prev) => [...prev, { role: "bot", text: fallback }]);
        } finally {
            setLoading(false);
        }
    }, [loading, sessionId]);

    const getFallbackResponse = (input) => {
        const lower = input.toLowerCase();
        const responses = {
            "bakiye": "Bakiyenizi görmek için 'Hesaplarım' sekmesine gidin. 💰",
            "transfer": "Transfer için 'Transfer' menüsünde IBAN ve tutarı girin. 🔄",
            "iban": "IBAN'ınızı 'Hesaplarım' > 'Kart Kontrol' bölümünde bulabilirsiniz. 🏦",
            "fatura": "Fatura ödeme için 'Fatura' menüsünü kullanın. 💡",
            "destek": "Mesajlar bölümünden destek talebi oluşturabilirsiniz. 📩",
        };
        for (const [key, val] of Object.entries(responses)) {
            if (lower.includes(key)) return val;
        }
        return "Şu anda AI servisine bağlanamıyorum. Lütfen tekrar deneyin veya Mesajlar bölümünden destek talebi oluşturun. 🙏";
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: "fixed", bottom: 24, right: 24,
                    width: 60, height: 60, borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    border: "none", color: "#fff", cursor: "pointer",
                    boxShadow: "0 4px 24px rgba(99,102,241,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999, transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 30px rgba(99,102,241,0.6)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,0.45)"; }}
                aria-label="AI Chatbot'u aç"
            >
                <MessageCircle size={26} />
            </button>
        );
    }

    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24,
            width: 380, maxWidth: "calc(100vw - 32px)",
            height: 560, maxHeight: "calc(100vh - 100px)",
            borderRadius: 20, overflow: "hidden",
            background: "var(--bg-card, #1a1a2e)", border: "1px solid var(--border-color, #333)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
            display: "flex", flexDirection: "column",
            zIndex: 9999,
        }}>
            {/* Header */}
            <div style={{
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Bot size={22} color="#fff" />
                    </div>
                    <div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>FinBot AI</div>
                        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                            Gemini AI ile destekleniyor
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setOpen(false)}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Chatbot'u kapat"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{
                flex: 1, overflowY: "auto", padding: 16,
                display: "flex", flexDirection: "column", gap: 12,
            }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                        gap: 8, alignItems: "flex-end",
                    }}>
                        {msg.role === "bot" && (
                            <div style={{
                                width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Bot size={15} color="#fff" />
                            </div>
                        )}
                        <div style={{
                            maxWidth: "78%", padding: "11px 15px", borderRadius: 16,
                            fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
                            background: msg.role === "user"
                                ? "linear-gradient(135deg, #6366f1, #818cf8)"
                                : "var(--bg-secondary, #242444)",
                            color: msg.role === "user" ? "#fff" : "var(--text-primary, #e0e0e0)",
                            borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                            borderBottomLeftRadius: msg.role === "bot" ? 4 : 16,
                        }}>
                            {msg.text}
                        </div>
                        {msg.role === "user" && (
                            <div style={{
                                width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                                background: "var(--bg-tertiary, #333)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <User size={15} />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 10,
                            background: "linear-gradient(135deg, #6366f1, #818cf8)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Bot size={15} color="#fff" />
                        </div>
                        <div style={{
                            padding: "12px 18px", borderRadius: 16, borderBottomLeftRadius: 4,
                            background: "var(--bg-secondary, #242444)",
                            display: "flex", alignItems: "center", gap: 6,
                        }}>
                            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            <span style={{ fontSize: 12, color: "var(--text-secondary, #999)" }}>FinBot düşünüyor...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{
                padding: "8px 16px", display: "flex", gap: 6,
                overflowX: "auto", borderTop: "1px solid var(--border-color, #333)",
            }}>
                {QUICK_ACTIONS.map((qa, i) => (
                    <button
                        key={i}
                        onClick={() => sendMessage(qa.msg)}
                        disabled={loading}
                        style={{
                            background: "var(--bg-secondary, #242444)", border: "1px solid var(--border-color, #444)",
                            borderRadius: 20, padding: "7px 14px", fontSize: 11, fontWeight: 500,
                            color: "var(--text-secondary, #aaa)", cursor: loading ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap", transition: "all 0.2s",
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {qa.label}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div style={{
                padding: "12px 16px", borderTop: "1px solid var(--border-color, #333)",
                display: "flex", gap: 8,
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                    placeholder="FinBot'a sorun..."
                    disabled={loading}
                    style={{
                        flex: 1, padding: "11px 16px", borderRadius: 14,
                        border: "1px solid var(--border-color, #444)", background: "var(--bg-secondary, #242444)",
                        color: "var(--text-primary, #e0e0e0)", fontSize: 13, outline: "none",
                        transition: "border-color 0.2s",
                    }}
                    aria-label="Mesajınızı yazın"
                />
                <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    style={{
                        width: 44, height: 44, borderRadius: 14, border: "none",
                        background: loading || !input.trim()
                            ? "var(--bg-tertiary, #333)"
                            : "linear-gradient(135deg, #6366f1, #818cf8)",
                        color: "#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                    }}
                    aria-label="Mesajı gönder"
                >
                    {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
                </button>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
