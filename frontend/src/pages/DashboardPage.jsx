import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { accountApi, customerApi, ledgerApi } from "../services/api";
import { Link } from "react-router-dom";
import {
    Wallet, ArrowDownLeft, ArrowUpRight,
    ArrowLeftRight, CreditCard, Plus, AlertCircle,
    Shield, Eye, EyeOff, Copy, CheckCircle2,
    Activity, ChevronRight, Zap
} from "lucide-react";
import toast from "react-hot-toast";
import BalanceOrb3D from "../components/BalanceOrb3D";
import QuickActionsWidget from "../components/QuickActionsWidget";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [copiedIban, setCopiedIban] = useState(null);
    const [recentTx, setRecentTx] = useState([]);
    const [customerForm, setCustomerForm] = useState({
        full_name: "",
        national_id: "",
        phone: "",
        date_of_birth: "",
        address: "",
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const accRes = await accountApi.listMine();
            setAccounts(accRes.data);
            const balanceMap = {};
            for (const acc of accRes.data) {
                try {
                    const balRes = await accountApi.getBalance(acc.id);
                    balanceMap[acc.id] = balRes.data.balance;
                } catch {
                    balanceMap[acc.id] = 0;
                }
            }
            setBalances(balanceMap);
            try {
                const custRes = await customerApi.getMe();
                setCustomer(custRes.data);
            } catch {
                setShowCustomerForm(true);
            }
            // Load recent transactions
            try {
                const txRes = await ledgerApi.getEntries({ skip: 0, limit: 5 });
                setRecentTx(txRes.data.entries || []);
            } catch {
                // ignore
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createCustomer = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await customerApi.create(customerForm);
            setCustomer(res.data);
            setShowCustomerForm(false);
            toast.success("Müşteri profili oluşturuldu!");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Profil oluşturulamadı");
        } finally {
            setSubmitLoading(false);
        }
    };

    const copyIban = (iban) => {
        navigator.clipboard.writeText(iban);
        setCopiedIban(iban);
        toast.success("IBAN kopyalandı!");
        setTimeout(() => setCopiedIban(null), 2000);
    };

    const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-32 space-y-8">
            {/* ── Welcome Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
                        Merhaba, {customer?.full_name?.split(" ")[0] || user?.email?.split("@")[0]} 👋
                    </h1>
                    <p className="text-white/60 text-sm font-medium">
                        Finansal özetinize hoş geldiniz.
                    </p>
                </div>
                {customer && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-lg
                        ${customer?.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5"}`}>
                        <Shield size={16} />
                        KYC: {customer?.status === "active" ? "Onaylandı" : "Beklemede"}
                    </div>
                )}
            </motion.div>

            {/* ── Customer Registration Form (only if no profile) ── */}
            {showCustomerForm && !customer && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl shadow-amber-500/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <AlertCircle size={20} className="text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-amber-400">Müşteri Profili Oluşturun</h3>
                    </div>
                    <p className="text-amber-100/70 mb-8 text-sm">
                        Bankacılık işlemlerine başlayabilmek ve hesap açabilmek için müşteri profilinizi tamamlamanız gerekmektedir.
                    </p>
                    <form onSubmit={createCustomer} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-amber-200/50 uppercase tracking-widest mb-1.5">Ad Soyad</label>
                                <input
                                    className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    placeholder="Ad Soyad"
                                    value={customerForm.full_name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                                    required minLength={2}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-amber-200/50 uppercase tracking-widest mb-1.5">TC Kimlik No</label>
                                <input
                                    className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    placeholder="11 Haneli TC"
                                    value={customerForm.national_id}
                                    onChange={(e) => setCustomerForm({ ...customerForm, national_id: e.target.value })}
                                    required pattern="\d{11}" maxLength={11}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-amber-200/50 uppercase tracking-widest mb-1.5">Telefon</label>
                                <input
                                    className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    placeholder="05XX XXX XX XX"
                                    value={customerForm.phone}
                                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-amber-200/50 uppercase tracking-widest mb-1.5">Doğum Tarihi</label>
                                <input
                                    className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    type="date"
                                    value={customerForm.date_of_birth}
                                    onChange={(e) => setCustomerForm({ ...customerForm, date_of_birth: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-amber-200/50 uppercase tracking-widest mb-1.5">Adres (Opsiyonel)</label>
                            <input
                                className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                placeholder="Açık Adres"
                                value={customerForm.address}
                                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitLoading}
                            className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-4 px-8 rounded-xl w-full md:w-auto transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                        >
                            {submitLoading ? <div className="w-5 h-5 border-2 border-amber-950/20 border-t-amber-950 rounded-full animate-spin"></div> : "Profili Oluştur"}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* ── Total Balance Card & Quick Actions Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Total Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-8 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] p-8 md:p-10 text-white min-h-[280px] flex flex-col justify-between group cursor-pointer"
                >
                    {/* Abstract Orbs */}
                    <div className="absolute -right-20 -top-20 opacity-80 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-12">
                        <BalanceOrb3D color="#bfdbfe" className="w-[400px] h-[400px]" />
                    </div>
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-3 backdrop-blur-md bg-white/10 border border-white/10 px-4 py-2 rounded-full">
                            <Wallet size={16} className="text-blue-200" />
                            <span className="text-xs font-bold tracking-wider text-blue-100 uppercase">Toplam Varlıklar</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10"
                        >
                            {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="relative z-10 mt-12">
                        <div className="text-sm font-semibold text-blue-200 mb-2">Güncel Bakiye</div>
                        <div className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-lg flex items-baseline gap-2">
                            {showBalance ? (
                                <>
                                    {totalBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    <span className="text-3xl font-bold text-blue-200">₺</span>
                                </>
                            ) : (
                                "••••••••••"
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-4 grid grid-cols-2 gap-4"
                >
                    {[
                        { to: "/customer/transfer", icon: <ArrowLeftRight size={24} />, label: "Para Gönder", bg: "from-emerald-600/20 to-emerald-900/40 border-emerald-500/30", text: "text-emerald-400", hover: "hover:bg-emerald-500/10 hover:border-emerald-500/50" },
                        { to: "/customer/transfer", icon: <ArrowDownLeft size={24} />, label: "Para İste", bg: "from-blue-600/20 to-indigo-900/40 border-blue-500/30", text: "text-blue-400", hover: "hover:bg-blue-500/10 hover:border-blue-500/50" },
                        { to: "/customer/qr", icon: <Zap size={24} />, label: "QR İşlemleri", bg: "from-orange-600/20 to-amber-900/40 border-orange-500/30", text: "text-orange-400", hover: "hover:bg-orange-500/10 hover:border-orange-500/50" },
                        { to: "/customer/accounts", icon: <Plus size={24} />, label: "Yeni Hesap", bg: "from-purple-600/20 to-fuchsia-900/40 border-purple-500/30", text: "text-purple-400", hover: "hover:bg-purple-500/10 hover:border-purple-500/50" },
                    ].map((action, i) => (
                        <Link
                            key={action.label}
                            to={action.to}
                            className={`group bg-gradient-to-br ${action.bg} ${action.hover} backdrop-blur-md rounded-[2rem] border p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.03] active:scale-95 text-center`}
                        >
                            <div className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ${action.text} shadow-lg group-hover:scale-110 transition-transform`}>
                                {action.icon}
                            </div>
                            <span className="font-bold text-white text-sm">{action.label}</span>
                        </Link>
                    ))}
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Account Cards ── */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Wallet size={20} className="text-blue-400" />
                            Varlıklarım
                        </h2>
                        <Link to="/customer/accounts" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors">
                            Tümü <ChevronRight size={14} />
                        </Link>
                    </div>

                    {accounts.length === 0 ? (
                        <div className="bg-black/20 border border-white/5 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center min-h-[250px]">
                            <Wallet size={48} className="text-white/20 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Hesabınız Yok</h3>
                            <p className="text-white/50 text-sm mb-6 max-w-[250px]">
                                Para transferi ve işlemler için hemen ilk hesabınızı açın.
                            </p>
                            <Link to="/customer/accounts" className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-2.5 px-6 rounded-full transition-colors flex items-center gap-2 text-sm">
                                <Plus size={16} /> Hesap Aç
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accounts.slice(0, 3).map((acc) => (
                                <div key={acc.id} className="bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-5 transition-colors group">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner
                                                ${acc.account_type === "checking"
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : "bg-emerald-500/20 text-emerald-400"}`}>
                                                <CreditCard size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white/90 group-hover:text-white transition-colors">
                                                    {acc.account_type === "checking" ? "Vadesiz Hesap" : "Tasarruf Hesabı"}
                                                </div>
                                                <div className="text-xs font-mono text-white/50">{acc.iban.slice(0, 18)}...</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-white">
                                                {showBalance
                                                    ? `${(balances[acc.id] || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
                                                    : "••••••"
                                                }
                                            </div>
                                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{acc.currency}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* ── Recent Transactions ── */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                >
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Activity size={20} className="text-emerald-400" />
                            Son İşlemler
                        </h2>
                        <Link to="/customer/ledger" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors">
                            Tümü <ChevronRight size={14} />
                        </Link>
                    </div>

                    {recentTx.length === 0 ? (
                        <div className="bg-black/20 border border-white/5 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center min-h-[250px]">
                            <Activity size={48} className="text-white/20 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">İşlem Yok</h3>
                            <p className="text-white/50 text-sm max-w-[250px]">
                                Henüz herhangi bir finansal işlem gerçekleştirmediniz.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentTx.map((tx, i) => {
                                const isCredit = tx.type === "CREDIT";
                                const Icon = tx.category === "DEPOSIT" ? ArrowDownLeft :
                                    tx.category === "WITHDRAWAL" ? ArrowUpRight :
                                        tx.category === "TRANSFER_IN" ? ArrowDownLeft :
                                            tx.category === "TRANSFER_OUT" ? ArrowUpRight : CreditCard;

                                return (
                                    <div key={tx.id || i} className="group bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110
                                                ${isCredit ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white/90 group-hover:text-white transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                                                    {tx.description || (tx.category === "DEPOSIT" ? "Para Yatırma"
                                                        : tx.category === "WITHDRAWAL" ? "Nakit Çekim"
                                                            : tx.category === "TRANSFER_IN" ? "Gelen Transfer"
                                                                : tx.category === "TRANSFER_OUT" ? "Giden Transfer"
                                                                    : "Kart İşlemi")}
                                                </div>
                                                <div className="text-[11px] font-semibold text-white/40 mt-0.5">
                                                    {new Date(tx.created_at).toLocaleDateString("tr-TR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`font-black tracking-tight ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {isCredit ? "+" : "-"}{Math.abs(tx.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Quick Actions Widget */}
            {user?.role === "customer" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <QuickActionsWidget role="customer" />
                </motion.div>
            )}
        </div>
    );
}
