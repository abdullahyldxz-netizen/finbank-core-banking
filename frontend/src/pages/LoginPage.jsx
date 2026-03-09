import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import toast from "react-hot-toast";
import {
    Lock, Mail, UserPlus, LogIn, Shield, Zap, Globe,
    User, Phone, CreditCard, CheckCircle, AlertCircle,
    Eye, EyeOff, ArrowRight, ArrowLeft, FileCheck, ChevronRight,
} from "lucide-react";
import LoginBackground3D from "../components/3d/LoginBackground3D";
import { motion, AnimatePresence } from "framer-motion";

// ── TC Kimlik Numarası Doğrulama Algoritması ──
function validateTC(tc) {
    if (!tc || tc.length !== 11) return { valid: false, error: "TC Kimlik numarası 11 haneli olmalıdır." };
    if (!/^\d{11}$/.test(tc)) return { valid: false, error: "TC Kimlik numarası sadece rakamlardan oluşmalıdır." };
    if (tc[0] === "0") return { valid: false, error: "TC Kimlik numarası 0 ile başlayamaz." };

    const d = tc.split("").map(Number);
    const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
    const evenSum = d[1] + d[3] + d[5] + d[7];
    const check10 = ((oddSum * 7) - evenSum) % 10;
    const digit10 = check10 < 0 ? check10 + 10 : check10;
    if (digit10 !== d[9]) {
        return { valid: false, error: "TC Kimlik numarası geçersiz." };
    }
    const sum10 = d.slice(0, 10).reduce((a, b) => a + b, 0);
    if (sum10 % 10 !== d[10]) {
        return { valid: false, error: "TC Kimlik numarası geçersiz." };
    }
    return { valid: true, error: null };
}

// ── Şifre Güçlülük Analizi ──
function analyzePassword(password) {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    const score = Object.values(checks).filter(Boolean).length;
    let level = "Çok Zayıf", color = "bg-red-500", text = "text-red-500";
    if (score >= 5) { level = "Çok Güçlü"; color = "bg-emerald-500"; text = "text-emerald-500"; }
    else if (score >= 4) { level = "Güçlü"; color = "bg-emerald-400"; text = "text-emerald-400"; }
    else if (score >= 3) { level = "Orta"; color = "bg-amber-500"; text = "text-amber-500"; }
    else if (score >= 2) { level = "Zayıf"; color = "bg-orange-500"; text = "text-orange-500"; }
    return { checks, score, level, color, text, percent: (score / 5) * 100 };
}

function formatPhone(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("90") && digits.length <= 12) {
        let formatted = "+90";
        if (digits.length > 2) formatted += " " + digits.slice(2, 5);
        if (digits.length > 5) formatted += " " + digits.slice(5, 8);
        if (digits.length > 8) formatted += " " + digits.slice(8, 10);
        if (digits.length > 10) formatted += " " + digits.slice(10, 12);
        return formatted;
    }
    return value;
}

const STEPS = [
    { title: "Kişisel Bilgiler", icon: User, desc: "Temel kimlik bilgileriniz" },
    { title: "İletişim", icon: Phone, desc: "Telefon ve adres bilgileri" },
    { title: "Güvenlik", icon: Shield, desc: "Şifre ve hesap güvenliği" },
    { title: "Onay", icon: FileCheck, desc: "Bilgilerinizi kontrol edin" },
];

export default function LoginPage() {
    const { login } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        email: "", password: "", full_name: "", phone: "", national_id: "",
        date_of_birth: "", address: "", kvkk: false, terms: false,
    });

    const [errors, setErrors] = useState({});
    const [tcResult, setTcResult] = useState(null);
    const [pwdAnalysis, setPwdAnalysis] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newVal = type === "checkbox" ? checked : value;
        setForm(prev => ({ ...prev, [name]: newVal }));
        setErrors(prev => ({ ...prev, [name]: null }));

        if (name === "national_id") {
            if (value.length === 11) setTcResult(validateTC(value));
            else setTcResult(null);
        }
        if (name === "password") {
            setPwdAnalysis(value.length > 0 ? analyzePassword(value) : null);
        }
        if (name === "phone") {
            setForm(prev => ({ ...prev, phone: formatPhone(value) }));
        }
    };

    const validateStep = (s) => {
        const errs = {};
        if (s === 0) {
            if (!form.full_name || form.full_name.trim().length < 2) errs.full_name = "Ad Soyad en az 2 karakter olmalıdır.";
            if (!form.national_id) errs.national_id = "TC Kimlik numarası zorunludur.";
            else {
                const tc = validateTC(form.national_id);
                if (!tc.valid) errs.national_id = tc.error;
            }
            if (!form.date_of_birth) errs.date_of_birth = "Doğum tarihi zorunludur.";
        } else if (s === 1) {
            if (!form.email) errs.email = "E-posta adresi zorunludur.";
            if (!form.phone) errs.phone = "Telefon numarası zorunludur.";
        } else if (s === 2) {
            if (!form.password) errs.password = "Şifre zorunludur.";
            else {
                const pwd = analyzePassword(form.password);
                if (pwd.score < 3) errs.password = "Şifre en az 'Orta' güçlükte olmalıdır.";
            }
        } else if (s === 3) {
            if (!form.kvkk) errs.kvkk = "KVKK kabul edilmeli.";
            if (!form.terms) errs.terms = "Koşullar kabul edilmeli.";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const nextStep = () => validateStep(step) && setStep(step + 1);
    const prevStep = () => setStep(Math.max(0, step - 1));

    const handleRegister = async () => {
        if (!validateStep(3)) return;
        setLoading(true);
        try {
            const phoneDigits = "+" + form.phone.replace(/\D/g, "");
            await authApi.register({
                email: form.email, password: form.password, full_name: form.full_name.trim(),
                phone: phoneDigits, national_id: form.national_id,
            });
            toast.success("Hesabınız oluşturuldu! Giriş yapılıyor...");
            try {
                const res = await authApi.login({ email: form.email, password: form.password });
                login(res.data.access_token, { email: res.data.email, role: res.data.role });
            } catch {
                setIsRegister(false); setStep(0);
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Kayıt sırasında hata.");
        } finally { setLoading(false); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error("E-posta ve şifre gereklidir.");
        setLoading(true);
        try {
            const res = await authApi.login({ email: form.email, password: form.password });
            login(res.data.access_token, { email: res.data.email, role: res.data.role });
            toast.success("Giriş başarılı!");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Giriş başarısız.");
        } finally { setLoading(false); }
    };

    // Shared Input Style
    const inputCls = "w-full bg-deepblue-950/50 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm";
    const inputClsWithIcon = inputCls + " pl-10";

    if (isRegister) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <LoginBackground3D />
                <div className="relative max-w-5xl w-full flex flex-col md:flex-row bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 min-h-[600px]">
                    <div className="hidden md:flex flex-col flex-1 p-12 justify-center border-r border-white/10 bg-deepblue-950/40">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30">FB</div>
                            <span className="text-2xl font-bold text-white tracking-tight">FinBank</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">Güvenli Hesap<br />Oluşturma</h1>
                        <p className="text-blue-100/70 text-lg mb-8 leading-relaxed">Bankacılık düzeyinde güvenlik ile hesabınızı adım adım oluşturun. Bilgileriniz 256-bit şifreleme ile korunur.</p>

                        <div className="flex flex-col gap-2">
                            {STEPS.map((s, i) => (
                                <div key={i} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${i === step ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-transparent border border-transparent'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${i < step ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg' : i === step ? 'bg-blue-500 text-white shadow-blue-500/20 shadow-lg' : 'bg-white/5 text-white/40'}`}>
                                        {i < step ? <CheckCircle size={20} /> : <s.icon size={20} />}
                                    </div>
                                    <div>
                                        <div className={`text-sm ${i === step ? 'font-bold text-white' : 'font-medium text-white/60'}`}>{s.title}</div>
                                        <div className="text-xs text-white/40">{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 p-8 md:p-12 bg-deepblue-950/80 backdrop-blur-2xl">
                        <div className="max-w-md mx-auto h-full flex flex-col justify-center">
                            <div className="mb-8">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-blue-400">Adım {step + 1} / {STEPS.length}</span>
                                    <span className="text-xs text-white/50">{STEPS[step].title}</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{STEPS[step].title}</h2>
                            <p className="text-sm text-white/50 mb-6">{STEPS[step].desc}</p>

                            <AnimatePresence mode="wait">
                                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                                    {step === 0 && (
                                        <>
                                            <FormField label="Ad Soyad" error={errors.full_name}>
                                                <div className="relative">
                                                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                                    <input name="full_name" value={form.full_name} onChange={handleChange} className={inputClsWithIcon} placeholder="Örn: Ahmet Yılmaz" required />
                                                </div>
                                            </FormField>
                                            <FormField label="TC Kimlik Numarası" error={errors.national_id} success={tcResult?.valid ? "✅ TC Kimlik numarası geçerli" : null}>
                                                <div className="relative">
                                                    <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                                    <input name="national_id" value={form.national_id} onChange={handleChange} className={inputClsWithIcon} placeholder="12345678901" maxLength={11} inputMode="numeric" required />
                                                </div>
                                            </FormField>
                                            <FormField label="Doğum Tarihi" error={errors.date_of_birth}>
                                                <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className={`${inputCls} [color-scheme:dark]`} max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} required />
                                            </FormField>
                                        </>
                                    )}
                                    {step === 1 && (
                                        <>
                                            <FormField label="E-posta Adresi" error={errors.email}>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                                    <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClsWithIcon} placeholder="ornek@email.com" required />
                                                </div>
                                            </FormField>
                                            <FormField label="Telefon Numarası" error={errors.phone}>
                                                <div className="relative">
                                                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                                    <input name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClsWithIcon} placeholder="+90 555 123 45 67" required />
                                                </div>
                                            </FormField>
                                            <FormField label="Adres (Opsiyonel)">
                                                <textarea name="address" value={form.address} onChange={handleChange} className={`${inputCls} resize-none`} rows={2} placeholder="İl, İlçe, Mahalle..." />
                                            </FormField>
                                        </>
                                    )}
                                    {step === 2 && (
                                        <>
                                            <FormField label="Şifre" error={errors.password}>
                                                <div className="relative">
                                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                                    <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} className={`${inputClsWithIcon} pr-12`} placeholder="Güçlü bir şifre belirleyin" required />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </FormField>
                                            {pwdAnalysis && (
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-xs font-semibold text-white/70">Güç</span>
                                                        <span className={`text-xs font-bold ${pwdAnalysis.text}`}>{pwdAnalysis.level}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-white/10 mb-3 overflow-hidden">
                                                        <div className={`h-full transition-all duration-300 ${pwdAnalysis.color}`} style={{ width: `${pwdAnalysis.percent}%` }} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <PwdCheck ok={pwdAnalysis.checks.length} text="En az 8" />
                                                        <PwdCheck ok={pwdAnalysis.checks.uppercase} text="Büyük harf" />
                                                        <PwdCheck ok={pwdAnalysis.checks.lowercase} text="Küçük harf" />
                                                        <PwdCheck ok={pwdAnalysis.checks.number} text="Rakam (0-9)" />
                                                        <PwdCheck ok={pwdAnalysis.checks.special} text="Özel (!@#)" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {step === 3 && (
                                        <>
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                <h4 className="text-sm font-bold text-blue-400 mb-3">Bilgilerinizi Kontrol Edin</h4>
                                                <div className="flex flex-col gap-2">
                                                    <SummaryRow label="Ad Soyad" value={form.full_name} />
                                                    <SummaryRow label="TC Kimlik" value={form.national_id.slice(0, 3) + "•••••" + form.national_id.slice(-3)} />
                                                    <SummaryRow label="E-posta" value={form.email} />
                                                    <SummaryRow label="Telefon" value={form.phone} />
                                                </div>
                                            </div>

                                            <label className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${form.kvkk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                                                <input type="checkbox" name="kvkk" checked={form.kvkk} onChange={handleChange} className="w-5 h-5 accent-emerald-500 shrink-0 mt-0.5" />
                                                <div className="text-xs text-white/70"><span className="font-semibold text-white">KVKK Aydınlatma Metni</span>'ni okudum, kabul ediyorum.</div>
                                            </label>

                                            <label className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${form.terms ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                                                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} className="w-5 h-5 accent-emerald-500 shrink-0 mt-0.5" />
                                                <div className="text-xs text-white/70"><span className="font-semibold text-white">Koşullar ve Gizlilik Politikası</span>'nı okudum.</div>
                                            </label>
                                            {(errors.kvkk || errors.terms) && <div className="text-xs text-red-500">Lütfen tüm onayları işaretleyin.</div>}
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex gap-3 mt-6">
                                {step > 0 && (
                                    <button type="button" onClick={prevStep} className="shrink-0 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex flex-row items-center gap-2 transition-all">
                                        <ArrowLeft size={18} /> Geri
                                    </button>
                                )}
                                {step < 3 ? (
                                    <button type="button" onClick={nextStep} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all outline-none">
                                        Devam Et <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleRegister} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all outline-none">
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Hesabımı Oluştur</>}
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 text-center text-sm text-white/50">
                                Zaten hesabınız var mı? <button onClick={() => { setIsRegister(false); setStep(0); }} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Giriş Yap</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <LoginBackground3D />
            <div className="relative max-w-5xl w-full flex flex-col md:flex-row bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 min-h-[500px]">
                <div className="hidden md:flex flex-col flex-1 p-12 justify-center border-r border-white/10 bg-deepblue-950/40">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30">FB</div>
                        <span className="text-2xl font-bold text-white tracking-tight">FinBank</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">Finansal özgürlüğünüz<br />bir tık uzağınızda.</h1>
                    <p className="text-blue-100/70 text-lg mb-10 leading-relaxed">Modern bankacılığı deneyimleyin. Hızlı transfer, güvenli hesap yönetimi ve 7/24 finansal kontrol.</p>
                    <div className="flex flex-col gap-6">
                        <FeatureItem icon={<Shield size={20} />} title="Güvenli" desc="256-bit şifreleme ile korunur" />
                        <FeatureItem icon={<Zap size={20} />} title="Hızlı" desc="Anlık transfer ve işlemler" />
                        <FeatureItem icon={<Globe size={20} />} title="Erişilebilir" desc="Her cihazdan, her yerden" />
                    </div>
                </div>

                <div className="flex-1 p-8 md:p-14 bg-deepblue-950/80 backdrop-blur-2xl flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        <h2 className="text-2xl font-bold text-white mb-2">Hoş Geldiniz</h2>
                        <p className="text-white/50 text-sm mb-8">Hesabınıza güvenli giriş yapın.</p>

                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            <div>
                                <label className="text-[13px] font-semibold text-white/80 block mb-2 ml-1">E-posta Adresi</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClsWithIcon} placeholder="ornek@email.com" required />
                                </div>
                            </div>

                            <div>
                                <label className="text-[13px] font-semibold text-white/80 block mb-2 ml-1">Şifre</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} className={`${inputClsWithIcon} pr-12`} placeholder="Şifrenizi girin" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full mt-2 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all outline-none">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> Giriş Yap</>}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-white/50">
                            Hesabınız yok mu? <button onClick={() => { setIsRegister(true); setStep(0); }} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Kayıt Ol</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, error, success, children }) {
    return (
        <div>
            <label className="text-[13px] font-semibold text-white/80 block mb-1.5 ml-1">{label}</label>
            {children}
            {success && <div className="text-[11px] text-emerald-400 mt-1.5 font-semibold ml-1">{success}</div>}
            {error && <div className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 ml-1"><AlertCircle size={12} /> {error}</div>}
        </div>
    );
}

function PwdCheck({ ok, text }) {
    return (
        <div className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-400' : 'text-white/40'}`}>
            {ok ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-white/40" />}
            {text}
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between py-1.5 border-b border-white/5 last:border-0 text-xs text-white/70">
            <span>{label}</span>
            <span className="font-semibold text-white">{value}</span>
        </div>
    );
}

function FeatureItem({ icon, title, desc }) {
    return (
        <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <div className="font-bold text-white text-sm">{title}</div>
                <div className="text-xs text-blue-100/50">{desc}</div>
            </div>
        </div>
    );
}
