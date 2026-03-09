import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Eye, EyeOff, Landmark, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { accountApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

const ACCOUNT_TYPE_LABELS = {
    checking: "Vadesiz Hesap",
    savings: "Tasarruf Hesabı",
};

const CURRENCY_COLORS = {
    TRY: "from-blue-600 to-indigo-900 border-blue-500/30",
    USD: "from-emerald-600 to-teal-900 border-emerald-500/30",
    EUR: "from-violet-600 to-purple-900 border-violet-500/30",
};

const CURRENCY_GLOWS = {
    TRY: "shadow-[0_0_40px_rgba(59,130,246,0.3)]",
    USD: "shadow-[0_0_40px_rgba(16,185,129,0.3)]",
    EUR: "shadow-[0_0_40px_rgba(139,92,246,0.3)]",
};

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [visibleIban, setVisibleIban] = useState({});
    const [copiedValue, setCopiedValue] = useState("");
    const [newAccount, setNewAccount] = useState({ account_type: "checking", currency: "TRY" });
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await accountApi.listMine();
            setAccounts(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            toast.error("Hesaplar yüklenemedi.");
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        setSubmitLoading(true);
        try {
            await accountApi.create(newAccount);
            toast.success("Yeni hesap başarıyla oluşturuldu.");
            setShowModal(false);
            await loadAccounts();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Hesap açılamadı.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCopy = async (value, label) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedValue(value);
            toast.success(`${label} kopyalandı.`);
            setTimeout(() => setCopiedValue(""), 2000);
        } catch {
            toast.error("Kopyalama başarısız.");
        }
    };

    const toggleIban = (accountId) => {
        setVisibleIban((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Hesaplarım</h1>
                    <p className="text-white/60 text-sm md:text-base">
                        Vadesiz ve tasarruf hesaplarınızı, IBAN bilgilerinizi tek ekrandan yönetin.
                    </p>
                </div>
                <button
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={20} /> Yeni Hesap Aç
                </button>
            </div>

            {accounts.length === 0 ? (
                <div className="bg-black/20 border border-white/5 rounded-3xl p-12 text-center max-w-lg mx-auto">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Landmark size={48} className="text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Henüz Hesabınız Yok</h3>
                    <p className="text-white/60 mb-8">Hemen yeni bir vadesiz veya tasarruf hesabı açarak bankacılık işlemlerinize başlayabilirsiniz.</p>
                    <button
                        className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all"
                        onClick={() => setShowModal(true)}
                    >
                        İlk Hesabınızı Açın
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 perspective-1000">
                    {accounts.map((account, index) => {
                        const accountId = account.id || account.account_id;
                        const gradient = CURRENCY_COLORS[account.currency] || "from-slate-800 to-slate-900 border-slate-700/50";
                        const glow = CURRENCY_GLOWS[account.currency] || "shadow-[0_0_30px_rgba(0,0,0,0.3)]";
                        const maskedIban = maskIban(account.iban);
                        const balance = Number(account.balance || 0);

                        return (
                            <motion.div
                                key={accountId || index}
                                initial={{ opacity: 0, y: 30, rotateX: 10 }}
                                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
                                className={`relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br ${gradient} border ${glow} transform-gpu transition-all duration-300 group`}
                            >
                                {/* Abstract Background Elements */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                                <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-white/5 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>

                                {/* Pattern Overlay */}
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start gap-4 mb-8">
                                        <div>
                                            <div className="text-xs font-black text-white/60 uppercase tracking-widest mb-1 shadow-sm">
                                                {ACCOUNT_TYPE_LABELS[account.account_type] || "Banka Hesabı"}
                                            </div>
                                            <div className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                                                {balance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-2xl text-white/80">{account.currency}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider
                                                ${account.status === "active" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                                                    account.status === "frozen" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                                                        "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}
                                            >
                                                {account.status === "active" ? "Aktif" : account.status === "frozen" ? "Donduruldu" : "Pasif"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Hesap Numarası</div>
                                        <div className="font-mono text-xl tracking-widest font-bold text-white drop-shadow-sm">
                                            {formatAccountNumber(account.account_number)}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <DetailRow
                                            label="IBAN"
                                            value={visibleIban[accountId] ? account.iban : maskedIban}
                                            action={
                                                <button
                                                    onClick={() => toggleIban(accountId)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-colors backdrop-blur-md"
                                                >
                                                    {visibleIban[accountId] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    {visibleIban[accountId] ? "Gizle" : "Göster"}
                                                </button>
                                            }
                                        />
                                        <DetailRow
                                            label={copiedValue === account.iban ? "Kopyalandı!" : "Paylaş"}
                                            value={copiedValue === account.account_number ? "Hesap No Kopyalandı" : "Bilgileri Kopyala"}
                                            action={
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCopy(account.account_number, "Hesap Numarası")}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-colors backdrop-blur-md"
                                                    >
                                                        <Copy size={13} /> Hesap No
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(account.iban, "IBAN")}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-colors backdrop-blur-md"
                                                    >
                                                        {copiedValue === account.iban ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />} IBAN
                                                    </button>
                                                </div>
                                            }
                                            isFooter
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-deepblue-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-2xl font-black text-white mb-2">Yeni Hesap Aç</h3>
                            <p className="text-white/50 text-sm mb-8">İhtiyacınıza uygun hesap türünü ve para birimini seçin.</p>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Hesap Tipi</label>
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500/50 appearance-none font-semibold"
                                        value={newAccount.account_type}
                                        onChange={(event) => setNewAccount((prev) => ({ ...prev, account_type: event.target.value }))}
                                    >
                                        <option value="checking" className="bg-slate-800">Vadesiz Hesap (Günlük Kullanım)</option>
                                        <option value="savings" className="bg-slate-800">Tasarruf Hesabı (Birikim)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Para Birimi</label>
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500/50 appearance-none font-semibold"
                                        value={newAccount.currency}
                                        onChange={(event) => setNewAccount((prev) => ({ ...prev, currency: event.target.value }))}
                                    >
                                        <option value="TRY" className="bg-slate-800">TRY - Türk Lirası</option>
                                        <option value="USD" className="bg-slate-800">USD - Amerikan Doları</option>
                                        <option value="EUR" className="bg-slate-800">EUR - Euro</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-colors border border-white/10"
                                        onClick={() => setShowModal(false)}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {submitLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "Hesabı Aç"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DetailRow({ label, value, action, isFooter }) {
    return (
        <div className={`
            flex justify-between items-center gap-3 backdrop-blur-md rounded-2xl
            ${isFooter ? 'pt-4 border-t border-white/10' : 'bg-black/20 border border-white/10 p-3'}
        `}>
            {isFooter ? (
                <div className="text-xs font-semibold text-white/70">{value}</div>
            ) : (
                <div>
                    <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</div>
                    <div className="font-mono text-sm font-bold text-white mt-0.5">{value}</div>
                </div>
            )}
            <div>{action}</div>
        </div>
    );
}

function maskIban(iban) {
    if (!iban) return "";
    if (iban.length <= 8) return iban;
    return `${iban.slice(0, 4)} ${"•".repeat(Math.max(iban.length - 8, 0))} ${iban.slice(-4)}`;
}

function formatAccountNumber(value) {
    if (!value) return "";
    return value.replace(/(.{4})/g, "$1 ").trim();
}
