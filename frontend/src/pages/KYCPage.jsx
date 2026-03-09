import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { customerApi } from "../services/api";
import {
    FileCheck, Upload, AlertCircle, CheckCircle2, Clock,
    XCircle, User, CreditCard, Loader2, ChevronRight, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function KYCPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        national_id: "",
        phone: "",
        birth_date: "",
        address: "",
        id_front_url: "",
        id_back_url: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await customerApi.getProfile();
                const data = res.data;
                setStatus(data.status);
                if (data.first_name) {
                    setForm((f) => ({
                        ...f,
                        first_name: data.first_name || "",
                        last_name: data.last_name || "",
                        national_id: data.national_id || "",
                        phone: data.phone || "",
                    }));
                }
            } catch {
                setStatus("not_started");
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        if (!form.first_name || !form.last_name || !form.national_id || !form.phone) {
            toast.error("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }
        if (form.national_id.length !== 11) {
            toast.error("TC Kimlik No 11 haneli olmalıdır.");
            return;
        }
        setSubmitting(true);
        try {
            await customerApi.submitKYC(form);
            toast.success("KYC başvurunuz gönderildi! ✅");
            setStatus("pending");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Başvuru gönderilemedi.");
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-indigo-400" />
            </div>
        );
    }

    const statusConfig = {
        approved: {
            icon: <CheckCircle2 size={64} className="text-emerald-400" />,
            color: "emerald",
            title: "Kimlik Doğrulama Başarılı",
            desc: "Hesabınız başarıyla onaylandı. FinBank'ın tüm ayrıcalıklarından ve sınırsız işlem limitlerinden güvenle yararlanabilirsiniz."
        },
        pending: {
            icon: <Clock size={64} className="text-amber-400" />,
            color: "amber",
            title: "Başvurunuz İnceleniyor",
            desc: "Kimlik doğrulama talebiniz başarıyla alındı ve şu anda uzman ekiplerimiz tarafından inceleniyor. Bu işlem genellikle 1-3 iş günü içinde tamamlanır."
        },
        rejected: {
            icon: <XCircle size={64} className="text-rose-400" />,
            color: "rose",
            title: "Başvuru Reddedildi",
            desc: "Gönderdiğiniz kimlik bilgileri doğrulanamadı. Lütfen belgelerinizin okunaklı ve bilgilerinizin doğru olduğundan emin olarak tekrar başvurun."
        },
    };

    if (status === "approved" || status === "pending") {
        const cfg = statusConfig[status];
        return (
            <div className="max-w-2xl mx-auto p-4 md:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white/5 backdrop-blur-xl border border-${cfg.color}-500/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden`}
                >
                    <div className={`absolute -top-32 -left-32 w-64 h-64 bg-${cfg.color}-500/10 rounded-full blur-3xl pointer-events-none`} />
                    <div className={`absolute -bottom-32 -right-32 w-64 h-64 bg-${cfg.color}-500/10 rounded-full blur-3xl pointer-events-none`} />

                    <div className="relative z-10">
                        <div className="flex justify-center mb-6">
                            <div className={`p-4 rounded-full bg-${cfg.color}-500/10 shadow-[0_0_30px_rgba(var(--${cfg.color}-500-rgb),0.2)]`}>
                                {cfg.icon}
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-4">{cfg.title}</h2>
                        <p className="text-white/60 text-lg leading-relaxed max-w-lg mx-auto">{cfg.desc}</p>

                        {status === "approved" && (
                            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl">
                                    <ShieldCheck size={16} /> Tam Erişim Aktif
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl">
                                    <FileCheck size={16} /> Limitsiz İşlem
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    const steps = [
        { num: 1, label: "Kişisel Bilgiler", icon: User },
        { num: 2, label: "Kimlik Belgeleri", icon: FileCheck },
        { num: 3, label: "Onay", icon: CheckCircle2 },
    ];

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                    <ShieldCheck size={32} className="text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Kimlik Doğrulama (KYC)</h1>
                <p className="text-white/60 text-lg max-w-xl mx-auto">
                    Hesabınızı güvence altına almak ve tüm bankacılık özelliklerine sınırsız erişim sağlamak için kimliğinizi saniyeler içinde doğrulayın.
                </p>
            </motion.div>

            {/* Modern Stepper */}
            <div className="relative mb-12 px-4 md:px-12">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 -translate-y-1/2 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                />

                <div className="relative flex justify-between z-10">
                    {steps.map((s) => {
                        const isCompleted = step > s.num;
                        const isCurrent = step === s.num;
                        const Icon = s.icon;

                        return (
                            <div key={s.num} className="flex flex-col items-center gap-3">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.1 : 1,
                                        backgroundColor: isCompleted ? '#22c55e' : isCurrent ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                        borderColor: isCompleted ? '#22c55e' : isCurrent ? '#818cf8' : 'rgba(255,255,255,0.1)'
                                    }}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-lg transition-colors ${isCompleted || isCurrent ? 'text-white' : 'text-white/40'
                                        }`}
                                >
                                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                </motion.div>
                                <span className={`text-[13px] font-semibold whitespace-nowrap transition-colors ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-indigo-400' : 'text-white/40'
                                    }`}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <AnimatePresence mode="wait">
                    {/* ── STEP 1: Kişisel Bilgiler ── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Kişisel Bilgileriniz</h3>
                                <p className="text-sm text-white/50">Lütfen kimliğinizde yazan bilgileri eksiksiz ve doğru şekilde girin.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/70">Adınız <span className="text-rose-400">*</span></label>
                                    <input
                                        name="first_name"
                                        value={form.first_name}
                                        onChange={handleChange}
                                        placeholder="Kimlikteki adınız"
                                        className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/70">Soyadınız <span className="text-rose-400">*</span></label>
                                    <input
                                        name="last_name"
                                        value={form.last_name}
                                        onChange={handleChange}
                                        placeholder="Kimlikteki soyadınız"
                                        className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/70">TC Kimlik Numaranız <span className="text-rose-400">*</span></label>
                                <input
                                    name="national_id"
                                    value={form.national_id}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    placeholder="11 Haneli TC Kimlik No"
                                    maxLength={11}
                                    className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all font-mono tracking-widest text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/70">Cep Telefonu <span className="text-rose-400">*</span></label>
                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        placeholder="+90 5XX XXX XX XX"
                                        className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-white/70">Doğum Tarihi <span className="text-rose-400">*</span></label>
                                    <input
                                        name="birth_date"
                                        type="date"
                                        value={form.birth_date}
                                        onChange={handleChange}
                                        className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/70">İkametgah Adresi <span className="text-rose-400">*</span></label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Açık adresiniz (Mahalle, Sokak, No, İlçe/İl)"
                                    rows={3}
                                    className="w-full bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all resize-y"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => {
                                        if (!form.first_name || !form.last_name || !form.national_id || !form.phone || !form.birth_date || !form.address) {
                                            toast.error("Lütfen tüm zorunlu alanları doldurun."); return;
                                        }
                                        setStep(2);
                                    }}
                                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                >
                                    Devam Et <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Kimlik Belgeleri ── */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Kimlik Belgeleriniz</h3>
                                <p className="text-sm text-white/50">Lütfen T.C. Kimlik kartınızın ön ve arka yüzünün net ve okunaklı fotoğraflarının bağlantılarını (URL) sağlayın.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/70 flex items-center justify-between">
                                        <span>Kimlik Ön Yüz URL <span className="text-rose-400">*</span></span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Upload size={16} className="text-white/40 group-focus-within:text-indigo-400 transition-colors" />
                                        </div>
                                        <input
                                            name="id_front_url"
                                            value={form.id_front_url}
                                            onChange={handleChange}
                                            placeholder="https://örnek.com/kimlik-on.jpg"
                                            className="w-full pl-11 bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                    <div className="h-40 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center bg-white/5 overflow-hidden">
                                        {form.id_front_url ? (
                                            <img src={form.id_front_url} alt="Ön Yüz Önizleme" className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        ) : (
                                            <div className="text-center text-white/30 p-4">Önizleme Yok</div>
                                        )}
                                        <div style={{ display: form.id_front_url ? 'none' : 'flex' }} className="text-center text-white/30 p-4 flex-col items-center gap-2">
                                            <AlertCircle size={20} /> Geçersiz URL
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-white/70 flex items-center justify-between">
                                        <span>Kimlik Arka Yüz URL <span className="text-rose-400">*</span></span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Upload size={16} className="text-white/40 group-focus-within:text-indigo-400 transition-colors" />
                                        </div>
                                        <input
                                            name="id_back_url"
                                            value={form.id_back_url}
                                            onChange={handleChange}
                                            placeholder="https://örnek.com/kimlik-arka.jpg"
                                            className="w-full pl-11 bg-deepblue-950/50 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                    <div className="h-40 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center bg-white/5 overflow-hidden">
                                        {form.id_back_url ? (
                                            <img src={form.id_back_url} alt="Arka Yüz Önizleme" className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        ) : (
                                            <div className="text-center text-white/30 p-4">Önizleme Yok</div>
                                        )}
                                        <div style={{ display: form.id_back_url ? 'none' : 'flex' }} className="text-center text-white/30 p-4 flex-col items-center gap-2">
                                            <AlertCircle size={20} /> Geçersiz URL
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200">
                                <AlertCircle size={18} className="shrink-0 mt-0.5 text-blue-400" />
                                <p className="text-xs leading-relaxed">
                                    Belgelerinizin köşelerinin tam görünür olduğuna (kesik olmamasına), üzerinde parlama olmadığına ve tüm yazıların net okunduğuna emin olun. Desteklenen formatlar: JPG, PNG.
                                </p>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3.5 text-white/60 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 font-semibold rounded-xl transition-all flex items-center gap-2"
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={() => {
                                        if (!form.id_front_url || !form.id_back_url) {
                                            toast.error("Kimlik ön ve arka yüz görselleri zorunludur.");
                                            return;
                                        }
                                        setStep(3);
                                    }}
                                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                >
                                    Devam Et <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: Onay ── */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Bilgilerinizi Doğrulayın</h3>
                                <p className="text-sm text-white/50">Başvurunuzu göndermeden önce tüm bilgilerin son kez kontrolünü sağlayın.</p>
                            </div>

                            <div className="bg-deepblue-950/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                                {[
                                    { k: "Ad Soyad", v: `${form.first_name} ${form.last_name}` },
                                    { k: "TC Kimlik No", v: form.national_id, isMono: true },
                                    { k: "Telefon Num.", v: form.phone, isMono: true },
                                    { k: "Doğum Tarihi", v: form.birth_date ? new Date(form.birth_date).toLocaleDateString('tr-TR') : '-' },
                                    { k: "İkametgah", v: form.address, full: true },
                                ].map((item, idx) => (
                                    <div key={idx} className={`p-4 ${item.full ? 'flex flex-col gap-1' : 'flex justify-between items-center'}`}>
                                        <span className="text-sm font-medium text-white/50">{item.k}</span>
                                        <span className={`text-sm ${item.isMono ? 'font-mono tracking-wider' : 'font-medium'} ${item.full ? 'text-white/80' : 'text-white mr-2 text-right'}`}>
                                            {item.v}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-deepblue-950/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                                    <span className="text-xs text-white/50 font-medium">Kimlik Ön Yüz</span>
                                    {form.id_front_url ? <CheckCircle2 size={24} className="text-emerald-400" /> : <XCircle size={24} className="text-rose-400" />}
                                </div>
                                <div className="bg-deepblue-950/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                                    <span className="text-xs text-white/50 font-medium">Kimlik Arka Yüz</span>
                                    {form.id_back_url ? <CheckCircle2 size={24} className="text-emerald-400" /> : <XCircle size={24} className="text-rose-400" />}
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200">
                                <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-400" />
                                <p className="text-xs leading-relaxed">
                                    Bu başvuruyu onaylayarak girdiğiniz tüm bilgi ve belgelerin doğru ve şahsınıza ait olduğunu beyan etmiş olursunuz.
                                    Gönderim sonrası bilgileriniz incelenme süresince değiştirilemez.
                                </p>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3.5 text-white/60 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 font-semibold rounded-xl transition-all flex items-center gap-2"
                                >
                                    Geri Düzenle
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 ml-4 px-8 py-3.5 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><Loader2 size={18} className="animate-spin" /> Gönderiliyor...</>
                                    ) : (
                                        <><FileCheck size={18} /> Başvuruyu Onayla ve Gönder</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
