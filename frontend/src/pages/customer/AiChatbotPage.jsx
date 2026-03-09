import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { chatbotApi } from "../../services/api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function AiChatbotPage() {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Merhaba! 👋 Ben FinBank yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const res = await chatbotApi.send({ message: userMessage });
            setMessages(prev => [...prev, { role: "assistant", content: res.data.reply || res.data.response || "Yanıt alınamadı." }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin." }]);
            toast.error("Mesaj gönderilemedi");
        } finally {
            setLoading(false);
        }
    };

    const quickQuestions = [
        "Hesap bakiyemi öğrenmek istiyorum",
        "Kredi kartı başvurusu nasıl yapılır?",
        "Transfer limitlerim nedir?",
        "Döviz kurları hakkında bilgi ver",
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-100px)] flex flex-col">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-6 md:mb-8"
            >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Sparkles size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        FinBank AI Asistan
                    </h1>
                    <p className="text-sm md:text-base text-gray-400">Gemini AI ile güçlendirilmiş 7/24 destek</p>
                </div>
            </motion.div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2 md:gap-3 mb-6"
                >
                    {quickQuestions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => { setInput(q); }}
                            className="px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs md:text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            {q}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Chat Messages */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 overflow-y-auto rounded-3xl bg-white/5 border border-white/10 p-4 md:p-6 flex flex-col gap-4 md:gap-6 backdrop-blur-xl shadow-2xl custom-scrollbar"
            >
                {messages.map((msg, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: msg.role === "user" ? 20 : -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        key={i}
                        className={`flex gap-3 md:gap-4 items-end ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center shadow-lg ${msg.role === "user"
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                : "bg-gradient-to-br from-indigo-500 to-purple-600"
                            }`}>
                            {msg.role === "user" ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
                        </div>
                        <div className={`max-w-[85%] md:max-w-[75%] px-4 md:px-6 py-3 md:py-4 text-sm md:text-base leading-relaxed ${msg.role === "user"
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl rounded-tr-sm shadow-emerald-500/20 shadow-lg"
                                : "bg-white/10 text-gray-200 rounded-2xl rounded-tl-sm border border-white/5 shadow-inner backdrop-blur-md"
                            }`}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3 md:gap-4 items-end"
                    >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div className="px-5 py-4 bg-white/10 rounded-2xl rounded-tl-sm border border-white/5 flex gap-2">
                            <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                            <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                            <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                        </div>
                    </motion.div>
                )}
                <div ref={chatEndRef} className="h-2" />
            </motion.div>

            {/* Input Area */}
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSend}
                className="flex gap-2 md:gap-3 mt-4 md:mt-6 items-center"
            >
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Yapay zeka asistanına sor..."
                        disabled={loading}
                        className="w-full px-5 py-4 md:py-5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all shadow-inner backdrop-blur-xl disabled:opacity-50"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${loading || !input.trim()
                            ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95'
                        }`}
                >
                    <Send size={24} className={input.trim() && !loading ? "ml-1" : ""} />
                </button>
            </motion.form>
        </div>
    );
}
