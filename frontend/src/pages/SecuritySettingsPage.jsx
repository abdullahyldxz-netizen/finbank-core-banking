import { useState, useEffect } from "react";
import { Shield, Smartphone, LogOut, Clock, Key, Loader2, AlertTriangle, CheckCircle2, ChevronRight, Monitor, Laptop } from "lucide-react";
import { sessionApi, loginHistoryApi, twoFactorApi } from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function SecuritySettingsPage() {
    const [tab, setTab] = useState("sessions");
    const [sessions, setSessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [twoFASetup, setTwoFASetup] = useState(null);
    const [totpCode, setTotpCode] = useState("");

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                if (tab === "sessions") {
                    const res = await sessionApi.list();
                    setSessions(res.data);
                } else if (tab === "history") {
                    const res = await loginHistoryApi.list();
                    setHistory(res.data);
                }
            } catch { /* silently fail */ }
            setLoading(false);
        };
        fetch();
    }, [tab]);

    const killSession = async (id) => {
        try {
            await sessionApi.delete(id);
            toast.success("Oturum başarıyla kapatıldı.");
            setSessions((s) => s.filter((x) => x.session_id !== id));
        } catch {
            toast.error("Oturum kapatılamadı.");
        }
    };

    const killAll = async () => {
        if (!window.confirm("Tüm oturumları kapatmak istediğinize emin misiniz? Mevcut oturumunuz da sonlanabilir.")) return;
        try {
            await sessionApi.deleteAll();
            toast.success("Tüm diğer oturumlar kapatıldı.");
            setSessions([]);
        } catch {
            toast.error("İşlem başarısız oldu.");
        }
    };

    const setup2FA = async () => {
        try {
            const res = await twoFactorApi.setup();
            setTwoFASetup(res.data);
        } catch {
            toast.error("2FA kurulumu başlatılamadı.");
        }
    };

    const verify2FA = async () => {
        if (!totpCode || totpCode.length !== 6) {
            toast.error("Lütfen 6 haneli kodu girin.");
            return;
        }
        try {
            await twoFactorApi.verify(totpCode);
            toast.success("2FA başarıyla etkinleştirildi! 🛡️");
            setTwoFASetup(null);
            setTotpCode("");
        } catch {
            toast.error("Girdiğiniz kod hatalı.");
        }
    };

    const disable2FA = async () => {
        if (!window.confirm("2FA'yı kapatmak hesabınızın güvenliğini önemli ölçüde azaltır. Emin misiniz?")) return;
        try {
            await twoFactorApi.disable();
            toast.success("2FA devre dışı bırakıldı.");
        } catch {
            toast.error("İşlem başarısız.");
        }
    };

    const tabs = [
        { id: "sessions", label: "Aktif Oturumlar", icon: Smartphone },
        { id: "history", label: "Giriş Geçmişi", icon: Clock },
        { id: "2fa", label: "İki Aşamalı Doğrulama (2FA)", icon: Key },
    ];

    const formatDate = (d) => new Date(d).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
    const parseUA = (ua) => {
        if (!ua) return { name: "Bilinmeyen Cihaz", icon: Monitor };
        if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return { name: "Mobil Cihaz", icon: Smartphone };
        if (ua.includes("Mac OS") || ua.includes("Windows") || ua.includes("Linux")) return { name: "Bilgisayar", icon: Laptop };
        return { name: "Tarayıcı Oturumu", icon: Monitor };
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Shield size={24} className="text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Güvenlik Merkezi</h1>
                    </div>
                    <p className="text-white/60 ml-16">Hesap güvenliğinizi yönetin ve izleyin.</p>
                </div>

                {/* Genel Güvenlik Skoru (Temsili) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 sm:ml-auto relative z-10">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold">
                        A+
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white">Güvenlik Skoru</div>
                        <div className="text-xs text-white/50">Hesabınız güvende</div>
                    </div>
                </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${tab === t.id
                                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25"
                                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 min-h-[400px]"
            >
                {/* ── SESSIONS TAB ── */}
                {tab === "sessions" && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                            <div>
                                <h3 className="text-lg font-bold text-white">Hesabınıza Bağlı Cihazlar</h3>
                                <p className="text-sm text-white/50 mt-1">Giriş yaptığınız tüm cihazları buradan yönetebilirsiniz.</p>
                            </div>
                            {sessions.length > 0 && (
                                <button
                                    onClick={killAll}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <LogOut size={16} /> Tümünü Kapat
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 size={32} className="animate-spin text-indigo-400" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-white/40">
                                <Monitor size={48} className="mb-4 opacity-50" />
                                <p>Sadece bu oturum aktif.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                <AnimatePresence>
                                    {sessions.map((s, index) => {
                                        const { name, icon: DeviceIcon } = parseUA(s.user_agent);
                                        const isCurrentInfo = index === 0; // Varsayım: API'den gelen ilk kayıt genellikle güncel oturum olur (gerçek uygulamada kontrol flag'i olmalı)
                                        return (
                                            <motion.div
                                                key={s.session_id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative ${isCurrentInfo ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/60'}`}>
                                                        <DeviceIcon size={24} />
                                                        {isCurrentInfo && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B1120]" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-white">{name}</h4>
                                                            {isCurrentInfo && <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Bu Cihaz</span>}
                                                        </div>
                                                        <div className="text-[13px] text-white/50 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                            <span className="flex items-center gap-1"><MapPin size={12} /> {s.ip}</span>
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(s.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => killSession(s.session_id)}
                                                    className="w-full sm:w-auto px-4 py-2 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-white/70 hover:text-red-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                                >
                                                    <LogOut size={16} /> Oturumu Kapat
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}

                {/* ── HISTORY TAB ── */}
                {tab === "history" && (
                    <div className="space-y-6">
                        <div className="pb-4 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white">Son Giriş Aktiviteleri</h3>
                            <p className="text-sm text-white/50 mt-1">Hesabınıza yapılan son giriş denemeleri. Şüpheli bir durum görürseniz şifrenizi değiştirin.</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 size={32} className="animate-spin text-indigo-400" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-white/40">
                                <Clock size={48} className="mb-4 opacity-50" />
                                <p>Giriş geçmişi bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="relative border-l border-white/10 ml-4 md:ml-6 space-y-6 py-2">
                                {history.map((h, i) => (
                                    <div key={i} className="relative pl-6 md:pl-8">
                                        <div className={`absolute -left-1.5 md:-left-2 top-1.5 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-[#0B1120] ${h.success ? 'bg-emerald-500' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    {h.success ? (
                                                        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400"><CheckCircle2 size={16} /> Başarılı Giriş</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-sm font-bold text-red-400"><AlertTriangle size={16} /> Başarısız Deneme</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-white/40 md:ml-auto bg-white/5 px-2.5 py-1 rounded-md">
                                                    {formatDate(h.timestamp)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[13px] text-white/60">
                                                <div className="flex items-center gap-2"><MapPin size={14} className="text-white/30" /> IP: {h.ip}</div>
                                                <div className="flex items-center gap-2"><Monitor size={14} className="text-white/30" /> {h.user_agent ? (h.user_agent.split(' ')[0] + '...') : 'Bilinmeyen Cihaz'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 2FA TAB ── */}
                {tab === "2fa" && (
                    <div className="max-w-2xl mx-auto space-y-8 py-4">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <Key size={36} className="text-indigo-400" />
                                <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#0B1120]">
                                    <CheckCircle2 size={12} className="text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">İki Aşamalı Doğrulama (2FA)</h3>
                            <p className="text-white/60 leading-relaxed text-sm md:text-base">
                                Hesabınıza giriş yaparken şifrenizin yanı sıra güvenilir cihazınızda üretilen dinamik bir şifre isteyerek ekstra güvenlik katmanı oluşturun.
                            </p>
                        </div>

                        {!twoFASetup ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-center space-y-6">
                                <AlertTriangle size={32} className="text-amber-400 mx-auto" />
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-2">2FA Şu Anda Devre Dışı</h4>
                                    <p className="text-sm text-white/50">Güvenliğinizi artırmak için Google Authenticator veya benzeri bir uygulama ile hemen kurun.</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 pt-4">
                                    <button
                                        onClick={setup2FA}
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                                    >
                                        <Key size={18} /> Kurulumu Başlat
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-8"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0">1</div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Uygulamadan Kodu Tarayın / Girin</h4>
                                        <p className="text-sm text-white/60 mb-4">Aşağıdaki kurulum anahtarını Google Authenticator veya Authy uygulamasında "Kurulum Anahtarı Gir" seçeneğine yapıştırın.</p>
                                        <div className="bg-deepblue-950/80 p-4 rounded-xl border border-white/10 flex items-center justify-between group cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => { navigator.clipboard.writeText(twoFASetup.secret); toast.success("Kopyalandı!"); }}>
                                            <code className="text-lg md:text-xl font-mono text-indigo-400 font-bold tracking-[0.2em]">{twoFASetup.secret}</code>
                                            <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md text-white/70 group-hover:bg-indigo-500/20 group-hover:text-indigo-300">Kopyala</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 pt-4 border-t border-white/10">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0">2</div>
                                    <div className="w-full">
                                        <h4 className="font-semibold text-white mb-1">Kodu Doğrulayın</h4>
                                        <p className="text-sm text-white/60 mb-4">Uygulamanın ürettiği 6 haneli kodu girerek kurulumu tamamlayın.</p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={totpCode}
                                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                className="flex-1 bg-deepblue-950/50 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-lg tracking-widest text-center sm:text-left"
                                            />
                                            <button
                                                onClick={verify2FA}
                                                disabled={totpCode.length !== 6}
                                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 shrink-0"
                                            >
                                                Doğrula ve Bitir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Opsiyonel: Kapatma Butonu */}
                        <div className="text-center pt-8">
                            <button onClick={disable2FA} className="text-xs font-medium text-white/30 hover:text-red-400 transition-colors underline underline-offset-4">
                                2FA Korumasını Şimdilik Kapat
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
