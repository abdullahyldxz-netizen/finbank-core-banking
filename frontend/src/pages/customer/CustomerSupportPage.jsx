import { useState } from "react";
import { Headphones, Mail, Phone, MapPin, Send, MessageSquare, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { messagesApi } from "../../services/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const FAQ = [
    { q: "Hesap açmak için ne gerekli?", a: "TC Kimlik numaranız ve geçerli bir e-posta adresiniz ile kayıt olduktan sonra KYC sürecini tamamlamanız yeterlidir." },
    { q: "Para transferi ne kadar sürer?", a: "FinBank içi transferler anında gerçekleşir. Diğer banka transferleri için EFT saatleri geçerlidir (08:30 - 17:30)." },
    { q: "Kredi kartı limitimi nasıl artırırım?", a: "Kredi kartı limit artışı için müşteri temsilcinizle iletişime geçebilir veya mesaj gönderebilirsiniz." },
    { q: "Şifremi unuttum, ne yapmalıyım?", a: "Giriş ekranında 'Şifremi Unuttum' bağlantısına tıklayarak kayıtlı e-posta adresinize sıfırlama bağlantısı alabilirsiniz." },
    { q: "Hesabım donduruldu, ne yapmalıyım?", a: "Güvenlik nedeniyle dondurulan hesaplar için lütfen destek ekibimize mesaj gönderin veya 0850 123 45 67 numarasını arayın." },
];

export default function CustomerSupportPage() {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast.error("Lütfen tüm alanları doldurun.");
            return;
        }
        setLoading(true);
        try {
            await messagesApi.send({ subject, body: message });
            toast.success("Mesajınız başarıyla gönderildi! 📩");
            setSubject("");
            setMessage("");
        } catch (error) {
            toast.error("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8 md:mb-10"
            >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                    <Headphones size={28} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Destek & İletişim
                    </h1>
                    <p className="text-sm md:text-base text-gray-400">Size yardımcı olmaktan mutluluk duyarız.</p>
                </div>
            </motion.div>

            {/* Contact Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10"
            >
                {[
                    { icon: <Phone size={24} />, label: "Telefon", value: "0850 123 45 67", sub: "7/24 Hizmet", color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
                    { icon: <Mail size={24} />, label: "E-Posta", value: "destek@finbank.com", sub: "24 saat içinde yanıt", color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
                    { icon: <MapPin size={24} />, label: "Adres", value: "Levent, İstanbul", sub: "Merkez Şube", color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
                ].map((item, i) => (
                    <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        key={i}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden group"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg ${item.shadow} text-white mb-2`}>
                            {item.icon}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
                            <div className="text-lg md:text-xl font-bold text-white mb-1">{item.value}</div>
                            <div className="text-sm text-gray-400">{item.sub}</div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Message Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl"
                >
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                            <MessageSquare size={20} />
                        </div>
                        Bize Yazın
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Konu</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Mesajınızın konusu"
                                required
                                className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Mesajınız</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Size nasıl yardımcı olabiliriz?"
                                rows={6}
                                required
                                className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner resize-y custom-scrollbar"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-300 mt-2 ${loading
                                    ? 'bg-indigo-500/50 cursor-wait'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            <Send size={20} className={loading ? "animate-pulse" : ""} />
                            {loading ? "Gönderiliyor..." : "Mesajı Gönder"}
                        </button>
                    </form>
                </motion.div>

                {/* FAQ */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col h-full"
                >
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <HelpCircle size={20} />
                        </div>
                        Sık Sorulan Sorular
                    </h2>

                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {FAQ.map((item, i) => (
                            <motion.div
                                key={i}
                                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === i
                                        ? 'bg-white/10 border-indigo-500/30 shadow-md shadow-indigo-500/5'
                                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                    }`}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full px-5 py-4 flex justify-between items-center text-left focus:outline-none"
                                >
                                    <span className="font-medium text-sm md:text-base text-gray-200 pr-4">{item.q}</span>
                                    <div className={`p-1 rounded-full transition-colors ${openFaq === i ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400'}`}>
                                        <motion.div
                                            initial={false}
                                            animate={{ rotate: openFaq === i ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ChevronDown size={20} />
                                        </motion.div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="px-5 pb-5 text-sm md:text-base leading-relaxed text-gray-400">
                                                <div className="h-px w-full bg-white/10 mb-4" />
                                                {item.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
