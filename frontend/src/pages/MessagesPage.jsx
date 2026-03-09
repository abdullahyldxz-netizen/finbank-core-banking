import { useState, useEffect } from "react";
import { Send, MessageSquare, Reply, Clock, CheckCircle, Loader2, Edit3, Inbox, User, ShieldCheck } from "lucide-react";
import { messagesApi } from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function MessagesPage({ userRole = "customer" }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(userRole === "customer" ? "send" : "inbox");
    const [form, setForm] = useState({ subject: "", body: "" });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => { loadInbox(); }, [userRole]);

    const loadInbox = async () => {
        setLoading(true);
        try {
            const res = await messagesApi.inbox();
            setMessages(Array.isArray(res.data) ? res.data : []);
        } catch {
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.body.trim()) return;
        setSending(true);
        try {
            await messagesApi.send({ subject: form.subject, body: form.body, to_role: "employee" });
            toast.success("Mesajınız gönderildi! 📩");
            setForm({ subject: "", body: "" });
            setActiveTab("inbox");
            loadInbox();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Mesaj gönderilemedi.");
        } finally { setSending(false); }
    };

    const handleReply = async (msgId) => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await messagesApi.reply(msgId, { reply: replyText });
            toast.success("Yanıt gönderildi! ✅");
            setReplyingTo(null);
            setReplyText("");
            loadInbox();
        } catch (err) {
            toast.error("Yanıt gönderilemedi.");
        } finally { setSending(false); }
    };

    const formatDate = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString("tr-TR", {
            day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <MessageSquare size={28} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Destek Merkezi</h1>
                        <p className="text-white/60 text-sm md:text-base">
                            {userRole === "customer"
                                ? "Müşteri temsilcilerimizle güvenle iletişime geçin."
                                : "Müşteri taleplerini görüntüleyin ve yanıtlayın."}
                        </p>
                    </div>
                </div>

                {userRole === "customer" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 relative z-10">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 text-sm font-medium">Destek Aktif</span>
                    </div>
                )}
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-2xl w-fit border border-white/10">
                {userRole === "customer" && (
                    <button
                        onClick={() => setActiveTab("send")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === "send"
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Edit3 size={16} /> Yeni Mesaj
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("inbox")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === "inbox"
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                >
                    <Inbox size={16} />
                    {userRole === "customer" ? "Mesajlarım" : "Gelen Kutusu"}
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'inbox' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'}`}>
                        {messages.length}
                    </span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {/* ── YENİ MESAJ FORMU ── */}
                {activeTab === "send" && userRole === "customer" && (
                    <motion.div
                        key="send-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
                    >
                        <form onSubmit={handleSend} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 ml-1">Konu</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Mesajınızın konusunu kısaca belirtin"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 ml-1">Mesaj Detayı</label>
                                <textarea
                                    required
                                    placeholder="Nasıl yardımcı olabiliriz? Detaylı açıklama yazın..."
                                    rows={6}
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none transition-all resize-y"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 disabled:hover:from-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                >
                                    {sending ? <><Loader2 size={18} className="animate-spin" /> Gönderiliyor...</> : <><Send size={18} /> Mesajı Gönder</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* ── GELEN KUTUSU ── */}
                {activeTab === "inbox" && (
                    <motion.div
                        key="inbox"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 relative"
                    >
                        {loading ? (
                            <div className="flex justify-center items-center h-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                                <Loader2 size={32} className="animate-spin text-indigo-400" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl text-center h-64">
                                <MessageSquare size={48} className="text-white/20 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Henüz mesajınız yok</h3>
                                <p className="text-white/50 text-sm max-w-sm">
                                    {userRole === "customer"
                                        ? "Destek ekibiyle yaptığınız mesajlaşmalar burada görünecektir."
                                        : "İlgilenmeniz gereken yeni bir müşteri talebi bulunmuyor."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={msg.message_id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-5 md:p-6 transition-all ${msg.reply
                                                ? "border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                                : msg.read
                                                    ? "border-white/10"
                                                    : "border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div className="flex gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${userRole === "customer"
                                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                        : 'bg-white/10 border-white/20 text-white/50'
                                                    }`}>
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-1">{msg.subject}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                                                        <span>Gönderen: <span className="text-white/70">{msg.from_email}</span></span>
                                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                        <span>{formatDate(msg.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center">
                                                {msg.reply ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                        <CheckCircle size={14} /> Yanıtlandı
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                                                        <Clock size={14} /> {userRole === "customer" ? "Yanıt Bekleniyor" : "İşlem Bekliyor"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pl-0 md:pl-16">
                                            <div className="bg-deepblue-950/40 rounded-2xl p-4 text-white/80 text-sm leading-relaxed border border-white/5 whitespace-pre-wrap">
                                                {msg.body}
                                            </div>

                                            {/* Reply by Staff Display */}
                                            {msg.reply && (
                                                <div className="mt-4 relative before:content-[''] before:absolute before:-left-8 md:before:-left-12 before:top-6 before:bottom-0 before:w-px before:bg-emerald-500/20">
                                                    <div className="absolute -left-[39px] md:-left-[55px] top-6 w-5 h-px bg-emerald-500/20" />

                                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 ml-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                                                <ShieldCheck size={12} />
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-400">Destek Ekibi ({msg.replied_by})</span>
                                                        </div>
                                                        <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap pl-8">
                                                            {msg.reply}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Area for Staff (Replying) */}
                                            {userRole !== "customer" && !msg.reply && (
                                                <div className="mt-4">
                                                    {replyingTo === msg.message_id ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            className="bg-white/5 border border-indigo-500/30 rounded-2xl p-4 overflow-hidden"
                                                        >
                                                            <textarea
                                                                rows={4}
                                                                placeholder="Müşteriye yanıtınızı yazın..."
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all resize-y text-sm mb-3"
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-semibold rounded-xl transition-all border border-white/10"
                                                                >
                                                                    İptal
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReply(msg.message_id)}
                                                                    disabled={sending}
                                                                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
                                                                >
                                                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                                    Yanıtla
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setReplyingTo(msg.message_id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-semibold rounded-xl border border-indigo-500/20 transition-all"
                                                        >
                                                            <Reply size={16} /> Yanıt Yaz
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
