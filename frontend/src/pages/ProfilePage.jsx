import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { customerApi } from "../services/api";
import {
    User, Phone, MapPin, Calendar, Shield, CreditCard,
    Save, CheckCircle, Lock, Key, AlertCircle, Loader2,
    Mail, Clock, UserCheck, Edit3, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user } = useAuth();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ full_name: "", phone: "", address: "", date_of_birth: "" });

    const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
    const [pwdLoading, setPwdLoading] = useState(false);

    const loadProfile = async () => {
        try {
            const res = await customerApi.getProfile();
            setCustomer(res.data);
            setForm({
                full_name: res.data.full_name || "",
                phone: res.data.phone || "",
                address: res.data.address || "",
                date_of_birth: res.data.date_of_birth || "",
            });
        } catch { /* */ }
        setLoading(false);
    };

    useEffect(() => { loadProfile(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await customerApi.updateMe(form);
            toast.success("Profil güncellendi! ✅");
            setEditing(false);
            loadProfile();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Güncelleme yapılamadı.");
        }
        setSaving(false);
    };

    const handlePwdSubmit = async (e) => {
        e.preventDefault();
        if (!pwdForm.current_password || !pwdForm.new_password || !pwdForm.confirm_password) {
            toast.error("Tüm alanları doldurun."); return;
        }
        if (pwdForm.new_password !== pwdForm.confirm_password) {
            toast.error("Yeni şifreler eşleşmiyor."); return;
        }
        if (pwdForm.new_password.length < 8) {
            toast.error("Yeni şifre en az 8 karakter olmalıdır."); return;
        }

        setPwdLoading(true);
        try {
            await customerApi.changePassword({
                current_password: pwdForm.current_password,
                new_password: pwdForm.new_password
            });
            toast.success("Şifreniz başarıyla değiştirildi! 🔒");
            setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
        } catch (err) {
            toast.error(err.response?.data?.detail || "Şifre değiştirilemedi.");
        }
        setPwdLoading(false);
    };

    const getInitials = (name) => {
        if (!name) return "??";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
    );

    if (!customer && !loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] p-4">
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Profil Bulunamadı</h2>
                    <p className="text-white/50 text-sm mb-6">
                        Lütfen önce anasayfadan müşteri profilinizi oluşturun veya KYC sürecini tamamlayın.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-32 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                            <User size={28} />
                        </div>
                        Profil ve Ayarlar
                    </h1>
                    <p className="text-white/60 mt-1">
                        Kişisel bilgilerinizi ve hesap güvenliğinizi yönetin.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-7 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl"
                >
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] shrink-0 border-2 border-white/20">
                            {getInitials(customer.full_name)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{customer.full_name}</h2>
                            <div className="text-sm font-medium text-white/50 mb-3">{user?.email}</div>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-md
                                ${customer.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10"}`}>
                                {customer.status === "active" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {customer.status === "active" ? "Doğrulanmış Hesap" : customer.status}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <InfoRow
                            icon={<User size={18} />}
                            label="Ad Soyad"
                            value={
                                editing ? <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50" placeholder="Ad Soyad" />
                                    : (customer.full_name || "-")
                            }
                        />
                        <InfoRow icon={<Mail size={18} />} label="E-posta" value={user?.email || "-"} />
                        <InfoRow icon={<CreditCard size={18} />} label="TC Kimlik No" value={maskTC(customer.national_id)} />
                        <InfoRow icon={<UserCheck size={18} />} label="Rol" value={
                            user?.role === "customer" ? "Müşteri" :
                                user?.role === "admin" ? "Yönetici" :
                                    user?.role === "employee" ? "Personel" :
                                        user?.role === "ceo" ? "Üst Yönetim" : user?.role
                        } />
                        <InfoRow icon={<Calendar size={18} />} label="Kayıt Tarihi" value={customer.created_at ? new Date(customer.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" }) : "-"} />
                        <InfoRow icon={<Calendar size={18} />} label="Doğum Tarihi" value={
                            editing ? <input type="date" value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50" />
                                : (customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString("tr-TR") : "Belirtilmemiş")
                        } />

                        <InfoRow icon={<Phone size={18} />} label="Telefon" value={
                            editing ? <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50" placeholder="+905551234567" />
                                : (customer.phone || "-")
                        } />
                        <InfoRow icon={<MapPin size={18} />} label="Açık Adres" value={
                            editing ? <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 resize-y" placeholder="Adresiniz" />
                                : (customer.address || "-")
                        } />

                        <InfoRow icon={<Shield size={18} />} label="KYC Durumu" value={
                            <span className={`font-bold ${customer.kyc_verified ? "text-emerald-400" : "text-amber-400"}`}>
                                {customer.kyc_verified ? "✅ Doğrulandı" : "⏳ Beklemede"}
                            </span>
                        } />
                    </div>

                    <div className="mt-8 flex gap-3">
                        {editing ? (
                            <>
                                <button onClick={() => setEditing(false)} className="flex-1 py-3.5 px-6 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">İptal</button>
                                <button onClick={handleSave} disabled={saving} className="flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-500 hover:to-indigo-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Kaydet</>}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setEditing(true)} className="w-full py-3.5 px-6 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                <Edit3 size={18} /> Bilgileri Düzenle
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Security & Password Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-5 flex flex-col gap-6"
                >
                    <div className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg"><Key size={20} /></div>
                            Şifre Değiştir
                        </h3>
                        <form onSubmit={handlePwdSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">Mevcut Şifre</label>
                                <input type="password" value={pwdForm.current_password} onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">Yeni Şifre</label>
                                <input type="password" value={pwdForm.new_password} onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors" placeholder="En az 8 karakter" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">Yeni Şifre (Tekrar)</label>
                                <input type="password" value={pwdForm.confirm_password} onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors" placeholder="••••••••" />
                            </div>
                            <button type="submit" disabled={pwdLoading} className="w-full py-3.5 px-6 mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:from-amber-400 hover:to-orange-500 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                                {pwdLoading ? <Loader2 size={18} className="animate-spin" /> : "Şifreyi Güncelle"}
                            </button>
                        </form>
                    </div>

                    {/* Account Info Card */}
                    <div className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg"><Clock size={20} /></div>
                            Hesap Bilgileri
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-3 sm:px-4 bg-black/20 rounded-xl border border-white/5">
                                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Hesap Türü</span>
                                <span className="text-sm font-bold text-white">{user?.role === "customer" ? "Bireysel" : "Kurumsal"}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 sm:px-4 bg-black/20 rounded-xl border border-white/5">
                                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Hesap Durumu</span>
                                <span className={`text-sm font-bold ${customer.status === "active" ? "text-emerald-400" : "text-amber-400"}`}>
                                    {customer.status === "active" ? "Aktif" : "Beklemede"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 sm:px-4 bg-black/20 rounded-xl border border-white/5">
                                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Müşteri ID</span>
                                <span className="text-xs font-mono font-bold text-white/70">{customer.id?.slice(0, 8)}...</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 rounded-[2rem] border border-blue-500/20 p-6 md:p-8 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 text-blue-500/10 group-hover:scale-110 transition-transform duration-500">
                            <Shield size={120} />
                        </div>
                        <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2 relative z-10">
                            <Shield size={20} /> Güvenlik İpuçları
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-100/70 relative z-10 list-disc pl-5">
                            <li>Şifrenizi kimseyle paylaşmayın, banka personeli dahil.</li>
                            <li>Başka sitelerde kullandığınız şifreleri burada kullanmayın.</li>
                            <li>İki faktörlü doğrulamayı (2FA) Güvenlik Ayarları sayfasından açabilirsiniz.</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex gap-4 items-center bg-black/20 border border-white/5 p-3.5 sm:px-5 rounded-2xl group hover:bg-white/5 transition-colors">
            <div className="text-blue-400/50 group-hover:text-blue-400 transition-colors bg-white/5 p-2 rounded-xl shrink-0">{icon}</div>
            <div className="flex-1 w-full overflow-hidden">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{label}</div>
                <div className="text-sm font-medium text-white/90 break-words">{value}</div>
            </div>
        </div>
    );
}

function maskTC(tc) {
    if (!tc || tc.length !== 11) return "Belirtilmemiş";
    return tc.slice(0, 3) + "•••••" + tc.slice(-3);
}
