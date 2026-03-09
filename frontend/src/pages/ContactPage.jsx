import { useState } from "react";
import { Headphones, Send, MapPin, Phone, Mail, Clock, CheckCircle2, Loader2, MessageSquare, ChevronDown } from "lucide-react";
import { messagesApi } from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
    const [form, setForm] = useState({ subject: "", body: "", category: "general" });
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.body.trim()) {
            toast.error("Konu ve mesaj alanları zorunludur.");
            return;
        }
        setSubmitting(true);
        try {
            await messagesApi.send(form);
            toast.success("Mesajınız gönderildi! ✅");
            setSent(true);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Gönderilemedi.");
        }
        setSubmitting(false);
    };

    if (sent) {
        return (
            <div className="p-6 max-w-2xl mx-auto min-h-[80vh] flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 mb-6 relative z-10"
                    >
                        <CheckCircle2 size={48} className="text-emerald-400" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Mesajınız İletildi!</h2>
                    <p className="text-white/60 text-base leading-relaxed mb-8 max-w-md mx-auto relative z-10">
                        Destek ekibimiz en kısa sürede size dönüş yapacaktır. Ortalama yanıt süresi 2-4 saattir.
                    </p>
                    <button
                        onClick={() => { setSent(false); setForm({ subject: "", body: "", category: "general" }); }}
                        className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 relative z-10"
                    >
                        Yeni Mesaj Gönder
                    </button>
                </motion.div>
            </div>
        );
    }

    const contactInfo = [
        { icon: Phone, label: "Telefon", val: "0850 123 4567", color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { icon: Mail, label: "E-posta", val: "destek@finbank.com.tr", color: "text-blue-400", bg: "bg-blue-400/10" },
        { icon: MapPin, label: "Merkez", val: "Levent, İstanbul", color: "text-amber-400", bg: "bg-amber-400/10" },
        { icon: Clock, label: "Çalışma Saatleri", val: "09:00 - 18:00 (Hafta içi)", color: "text-purple-400", bg: "bg-purple-400/10" },
    ];

    const faqs = [
        { q: "Hesap nasıl açılır?", a: "Panel → Hesaplar → Yeni Hesap Aç menüsünden saniyeler içinde yeni vadesiz veya vadeli hesap açabilirsiniz." },
        { q: "KYC nedir?", a: "Kimlik doğrulama (Know Your Customer) sürecidir. Güvenliğiniz ve yasal zorunluluklar gereği bankacılık işlemleri için kimliğinizi doğrulamanız gereklidir." },
        { q: "Şifre nasıl değiştirilir?", a: "Profil → Güvenlik sekmesinden mevcut şifrenizi girerek yeni şifre belirleyebilirsiniz." },
        { q: "2FA nasıl etkinleştirilir?", a: "Güvenlik Ayarları → İki Aşamalı Doğrulama (2FA) sekmesinden Google Authenticator veya SMS ile ekstra güvenlik katmanı ekleyebilirsiniz." },
    ];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <Headphones size={24} className="text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">İletişim & Destek</h1>
                </div>
                <p className="text-white/60 text-lg relative z-10 ml-16">
                    Sorularınız, önerileriniz veya şikayetleriniz için 7/24 bize ulaşabilirsiniz.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Sol Taraf: İletişim Bilgileri & SSS */}
                <div className="lg:col-span-2 space-y-6">
                    {/* İletişim Kartları */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4"
                    >
                        {contactInfo.map((info, i) => (
                            <div key={i} className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 hover:bg-white/10 transition-all duration-300">
                                <div className={`w-12 h-12 rounded-xl ${info.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                    <info.icon size={22} className={info.color} />
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1">{info.label}</div>
                                    <div className="text-[15px] font-semibold text-white">{info.val}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* SSS */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-indigo-500/20">
                                <MessageSquare size={18} className="text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Sık Sorulan Sorular</h3>
                        </div>

                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <div key={i} className="border border-white/5 rounded-xl bg-white/5 overflow-hidden">
                                    <button
                                        type="button"
                                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors focus:outline-none"
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    >
                                        <span className="text-[13px] font-medium text-white pr-4">{faq.q}</span>
                                        <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="px-4 pb-4 text-[13px] text-white/60 leading-relaxed pt-1 border-t border-white/5 mx-4">
                                                    {faq.a}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Sağ Taraf: İletişim Formu */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-3"
                >
                    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative shadow-xl">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl pointer-events-none" />

                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Bize Yazın</h3>
                            <p className="text-sm text-white/50 relative z-10">Taleplerinizi detaylı bir şekilde iletin, uzman ekibimiz hızla çözüm sağlasın.</p>
                        </div>

                        <div className="space-y-5 relative z-10">
                            <div>
                                <label className="text-[13px] font-semibold text-white/70 mb-2 block ml-1">Kategori</label>
                                <div className="relative">
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        className="w-full bg-deepblue-950/50 border border-white/10 text-white rounded-xl px-4 py-3.5 appearance-none outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                                    >
                                        <option value="general" className="bg-deepblue-900">Genel Danışma</option>
                                        <option value="technical" className="bg-deepblue-900">Teknik Destek</option>
                                        <option value="complaint" className="bg-deepblue-900">Şikayet Bildirimi</option>
                                        <option value="suggestion" className="bg-deepblue-900">Öneri & İstek</option>
                                        <option value="account" className="bg-deepblue-900">Hesap İşlemleri</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[13px] font-semibold text-white/70 mb-2 block ml-1">Konu <span className="text-red-400">*</span></label>
                                <input
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="Mesajınızın ana konusu..."
                                    className="w-full bg-deepblue-950/50 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[13px] font-semibold text-white/70 mb-2 block ml-1">Mesaj Detayı <span className="text-red-400">*</span></label>
                                <textarea
                                    name="body"
                                    value={form.body}
                                    onChange={handleChange}
                                    placeholder="Lütfen talebinizi detaylı olarak açıklayın..."
                                    rows={8}
                                    className="w-full bg-deepblue-950/50 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-2 w-full sm:w-auto self-end px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] flex items-center justify-center gap-2 relative z-10 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Gönderiliyor...</>
                            ) : (
                                <>Mesajı Gönder <Send size={18} /></>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
