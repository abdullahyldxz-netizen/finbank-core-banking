import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
    ArrowRight,
    BadgeCheck,
    Eye,
    EyeOff,
    Landmark,
    Lock,
    Mail,
    ShieldCheck,
    Sparkles,
    User,
    UserPlus,
} from "lucide-react";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SegmentedTabs } from "../components/banking/BankUi";

function validateNationalId(value) {
    if (!/^\d{11}$/.test(value)) return false;
    if (value[0] === "0") return false;
    const digits = value.split("").map(Number);
    const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const even = digits[1] + digits[3] + digits[5] + digits[7];
    return (((odd * 7) - even) % 10 + 10) % 10 === digits[9] && digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10 === digits[10];
}

function getPasswordStrength(password) {
    const checks = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
    const score = checks.filter(Boolean).length;
    if (score <= 2) return { label: "Zayıf", color: "bg-rose-500", width: "40%" };
    if (score === 3) return { label: "Orta", color: "bg-amber-400", width: "65%" };
    if (score === 4) return { label: "Güçlü", color: "bg-emerald-400", width: "82%" };
    return { label: "Çok Güçlü", color: "bg-emerald-500", width: "100%" };
}

export default function LoginPage() {
    const { login } = useAuth();
    const [mode, setMode] = useState("login");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        national_id: "",
        kvkk: false,
        terms: false,
    });

    const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        if (!form.email || !form.password) {
            toast.error("E-posta ve şifre gerekli.");
            return;
        }

        setLoading(true);
        try {
            const res = await authApi.login({ email: form.email, password: form.password });
            login(res.data.access_token, { email: res.data.email, role: res.data.role, full_name: res.data.full_name });
            toast.success("Giriş başarılı.");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Giriş başarısız.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        if (!validateNationalId(form.national_id)) {
            toast.error("Geçerli bir TC kimlik numarası gir.");
            return;
        }
        if (!form.kvkk || !form.terms) {
            toast.error("KVKK ve kullanım koşullarını kabul etmelisin.");
            return;
        }

        setLoading(true);
        try {
            await authApi.register({
                email: form.email,
                password: form.password,
                full_name: form.full_name.trim(),
                phone: form.phone,
                national_id: form.national_id,
            });
            const loginRes = await authApi.login({ email: form.email, password: form.password });
            login(loginRes.data.access_token, { email: loginRes.data.email, role: loginRes.data.role, full_name: form.full_name.trim() });
            toast.success("Hesap oluşturuldu.");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Kayıt sırasında hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
            <section className="relative hidden overflow-hidden border-r border-white/8 px-12 py-14 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_30%),linear-gradient(180deg,#05070f_0%,#091225_100%)]" />
                <div className="relative">
                    <div className="bank-brand mb-12">
                        <span className="bank-logo"><Landmark size={18} /></span>
                        <span className="bank-brand-text">FinBank</span>
                    </div>
                    <p className="bank-section-label mb-4">Digital Banking Suite</p>
                    <h1 className="max-w-xl font-display text-6xl font-black leading-[1.02] tracking-[-0.08em] text-white">
                        Geleceğin bankacılık deneyimi, bugün elinin altında.
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                        Müşteri paneli, transfer, kart yönetimi ve çalışan operasyonları tek tasarım sisteminde birleşir.
                    </p>
                </div>

                <div className="relative grid gap-4">
                    {[
                        { icon: ShieldCheck, title: "256-bit Güvenlik", text: "Her oturum bankacılık seviyesinde şifrelenir." },
                        { icon: Sparkles, title: "Premium Arayüz", text: "Masaüstü ve mobilde net, hızlı ve kontrollü akış." },
                        { icon: BadgeCheck, title: "Gerçek Zamanlı İşlem", text: "Bakiyeler, bildirimler ve onaylar tek akışta." },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.title} className="flex items-start gap-4 rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary"><Icon size={20} /></span>
                                <div>
                                    <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="relative flex items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_30%),linear-gradient(180deg,rgba(5,7,15,0.92),rgba(5,7,15,0.98))]" />
                <div className="relative w-full max-w-[34rem] rounded-[2rem] border border-white/10 bg-[rgba(8,14,28,0.84)] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.42)] backdrop-blur-2xl sm:p-8">
                    <div className="mb-8 lg:hidden">
                        <div className="bank-brand mb-6">
                            <span className="bank-logo"><Landmark size={18} /></span>
                            <span className="bank-brand-text">FinBank</span>
                        </div>
                    </div>

                    <SegmentedTabs
                        tabs={[
                            { id: "login", label: "Giriş" },
                            { id: "register", label: "Kayıt" },
                        ]}
                        active={mode}
                        onChange={setMode}
                        className="mb-8 w-full justify-center"
                    />

                    <div className="mb-8">
                        <p className="bank-section-label mb-3">{mode === "login" ? "Secure Sign In" : "New Account"}</p>
                        <h2 className="font-display text-4xl font-black tracking-[-0.07em] text-white">
                            {mode === "login" ? "FinBank hesabına giriş yap" : "Dakikalar içinde hesap oluştur"}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                            {mode === "login"
                                ? "Dashboard, transfer ve kart yönetimi modüllerine güvenli şekilde eriş."
                                : "Kimlik ve iletişim bilgilerini gir, sonra dijital bankacılık paneline otomatik geç."}
                        </p>
                    </div>

                    <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="grid gap-4">
                        {mode === "register" ? (
                            <>
                                <label>
                                    <span className="form-label">Ad Soyad</span>
                                    <div className="relative">
                                        <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                        <input className="form-input" style={{ paddingLeft: "3rem" }} name="full_name" value={form.full_name} onChange={handleChange} placeholder="Ad Soyad" required />
                                    </div>
                                </label>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label>
                                        <span className="form-label">Telefon</span>
                                        <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+90 5xx xxx xx xx" required />
                                    </label>
                                    <label>
                                        <span className="form-label">TC Kimlik</span>
                                        <input className="form-input" name="national_id" value={form.national_id} onChange={handleChange} placeholder="11 haneli" maxLength="11" required />
                                    </label>
                                </div>
                            </>
                        ) : null}

                        <label>
                            <span className="form-label">E-posta</span>
                            <div className="relative">
                                <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                <input className="form-input" style={{ paddingLeft: "3rem" }} type="email" name="email" value={form.email} onChange={handleChange} placeholder="ornek@finbank.com" required />
                            </div>
                        </label>

                        <label>
                            <span className="form-label">Şifre</span>
                            <div className="relative">
                                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                <input className="form-input" style={{ paddingLeft: "3rem", paddingRight: "3rem" }} type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Güçlü bir şifre belirle" required />
                                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </label>

                        {mode === "register" ? (
                            <>
                                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-white">
                                        <span>Şifre Gücü</span>
                                        <span>{strength.label}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/8">
                                        <div className={`${strength.color} h-2 rounded-full`} style={{ width: strength.width }} />
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
                                    <input type="checkbox" name="kvkk" checked={form.kvkk} onChange={handleChange} className="mt-1 h-4 w-4 accent-primary" />
                                    <span>KVKK aydınlatma metnini okudum ve kişisel verilerimin işlenmesini kabul ediyorum.</span>
                                </label>
                                <label className="flex items-start gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
                                    <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} className="mt-1 h-4 w-4 accent-primary" />
                                    <span>Kullanım koşullarını ve dijital bankacılık sözleşmesini kabul ediyorum.</span>
                                </label>
                            </>
                        ) : null}

                        <button type="submit" disabled={loading} className="bank-primary-btn mt-2 w-full justify-center !min-h-[3.8rem]">
                            {loading ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
                            {!loading ? (mode === "login" ? <ArrowRight size={18} /> : <UserPlus size={18} />) : null}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
