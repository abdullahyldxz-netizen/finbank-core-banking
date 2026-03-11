import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { accountApi, customerApi, ledgerApi } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardPage() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [recentTx, setRecentTx] = useState([]);
    const [customerForm, setCustomerForm] = useState({
        full_name: "",
        national_id: "",
        phone: "",
        date_of_birth: "",
        address: "",
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);

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
        try {
            const res = await customerApi.create(customerForm);
            setCustomer(res.data);
            setShowCustomerForm(false);
            toast.success("Müşteri profili oluşturuldu!");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Profil oluşturulamadı");
        }
    };

    const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);
    const mainAccount = accounts[0];

    // Format helpers
    const formatMoney = (val) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(val);
    const wholeNumber = Math.floor(totalBalance).toLocaleString("tr-TR");
    const decimalPart = (totalBalance % 1).toFixed(2).substring(2);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-[calc(100vh-80px)] md:min-h-screen w-full flex-col overflow-x-hidden mesh-gradient pb-24 md:pb-8 font-display">
            {/* Header */}
            <header className="flex items-center px-6 pt-8 pb-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full border-2 border-primary/40 p-0.5 shadow-glow-green">
                        <img
                            alt="User Profile"
                            className="rounded-full w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY5NNeAkOaCfAMrl3FGAuzimQN7cCglkn6u31YB1Jy3JsfzU0czpLSnrd4gQXyLsfNl40dOg_34b8piCk9wDFJe4QgZd4pnJMjrJCL1TXEmSGp7Fot4s73y2y_XRhC6v_dxYKpKcp4VFEdc0KEg2VCATQg7QN6tKjqILd_dLrSwo8IZsaUw0pes33lCsHEgZIX6VxEcfOAikDqP89crh1Kaa6kj2Gjc_zHPjnZN1B0x0PrFpSmB_TWLL5xhuMLYPdZ5QRscYWIMWzU"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#a0a0a0] font-bold">Premium Tier</p>
                        <h2 className="text-white text-base font-semibold leading-tight font-outfit">
                            {customer?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Misafir"}
                        </h2>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex size-10 items-center justify-center rounded-full glass-card text-white hover:bg-white/10 transition-colors shadow-premium">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </button>
                    <button className="relative flex size-10 items-center justify-center rounded-full glass-card text-white hover:bg-white/10 transition-colors shadow-premium">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        {customer?.status !== "active" ? (
                            <span className="absolute top-2 right-2 size-2.5 bg-[#ff5252] rounded-full border-2 border-[#121212]"></span>
                        ) : (
                            <span className="absolute top-2 right-2 size-2.5 bg-primary rounded-full border-2 border-[#121212]"></span>
                        )}
                    </button>
                </div>
            </header>

            {/* Customer Registration Form */}
            {showCustomerForm && !customer && (
                <section className="px-6 mb-6">
                    <div className="glass-card !bg-amber-500/10 !border-amber-500/30 rounded-2xl p-6 shadow-premium">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle size={24} className="text-amber-500 flex-shrink-0" />
                            <h3 className="text-amber-400 font-bold text-lg font-outfit">Profili Tamamlayın</h3>
                        </div>
                        <p className="text-slate-300 mb-6 text-sm">
                            Bankacılık işlemlerine başlamak için lütfen profil bilgilerinizi doldurun.
                        </p>
                        <form onSubmit={createCustomer} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#a0a0a0] mb-1 uppercase tracking-wider">Ad Soyad</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Ali Veli" value={customerForm.full_name} onChange={e => setCustomerForm({ ...customerForm, full_name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#a0a0a0] mb-1 uppercase tracking-wider">TC Kimlik</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="11 haneli" value={customerForm.national_id} onChange={e => setCustomerForm({ ...customerForm, national_id: e.target.value })} required pattern="\\d{11}" maxLength="11" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#a0a0a0] mb-1 uppercase tracking-wider">Telefon</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="+905551234567" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#a0a0a0] mb-1 uppercase tracking-wider">Doğum Tarihi</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]" value={customerForm.date_of_birth} onChange={e => setCustomerForm({ ...customerForm, date_of_birth: e.target.value })} required />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-[#0a0a16] py-4 rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(19,236,91,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 font-outfit">
                                Profili Oluştur
                            </button>
                        </form>
                    </div>
                </section>
            )}

            {/* Balance Section */}
            {customer && (
                <section className="px-6 py-6 text-center cursor-pointer transition-transform active:scale-95" onClick={() => setShowBalance(!showBalance)}>
                    <p className="text-[#a0a0a0] text-sm font-medium mb-1 font-outfit">Toplam Bakiyen</p>
                    <h1 className="text-white tracking-tight text-5xl md:text-6xl font-bold leading-tight neon-glow font-outfit">
                        {showBalance ? (
                            <>
                                ₺{wholeNumber}<span className="text-2xl md:text-3xl opacity-60">.{decimalPart}</span>
                            </>
                        ) : (
                            <span className="tracking-widest opacity-80">••••••••</span>
                        )}
                    </h1>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-xs">trending_up</span>
                        <p className="text-primary text-[10px] font-bold uppercase tracking-wider">+%2.5 bu ay</p>
                    </div>
                </section>
            )}

            {/* 3D Floating Card */}
            {customer && accounts.length > 0 && (
                <section className="px-6 py-4 flex justify-center">
                    <div className="relative group w-full max-w-sm">
                        {/* Shadow/Glow behind card */}
                        <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-[2rem] translate-y-4"></div>

                        {/* Main Card Body */}
                        <div className="relative glass-card rounded-[2rem] p-7 aspect-[1.586/1] overflow-hidden flex flex-col justify-between border-white/20 shadow-card transition-transform duration-300 hover:scale-[1.02]">
                            {/* Card Background Elements */}
                            <div className="absolute -top-10 -right-10 size-40 bg-primary/20 rounded-full blur-3xl"></div>
                            <div className="absolute top-0 right-0 p-6 opacity-30 text-white">
                                <svg fill="none" height="40" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="40">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="4"></circle>
                                </svg>
                            </div>

                            <div className="flex justify-between items-start z-10">
                                <div className="flex flex-col">
                                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mb-1">Hesap Türü</p>
                                    <p className="text-white text-lg font-outfit font-bold tracking-wide">{mainAccount?.account_type === "checking" ? "Vadesiz" : "Tasarruf"}</p>
                                </div>
                                <span className="material-symbols-outlined text-white text-[32px] opacity-90">contactless</span>
                            </div>

                            <div className="space-y-4 z-10">
                                <div className="flex gap-4 items-center">
                                    <span className="text-white text-lg sm:text-xl md:text-2xl font-medium opacity-90 tracking-widest font-mono drop-shadow-md">
                                        {mainAccount?.iban ? `${mainAccount.iban.substring(0, 4)} ${mainAccount.iban.substring(4, 8)} **** **** ${mainAccount.iban.substring(mainAccount.iban.length - 4)}` : "**** **** **** 8829"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mb-1">Hesap Sahibi</p>
                                        <p className="text-white text-sm font-outfit tracking-wide font-semibold">{customer?.full_name?.toUpperCase()}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mb-1">Geçerlilik</p>
                                        <p className="text-white text-sm font-outfit font-semibold">09/28</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className="grid grid-cols-3 gap-4 px-6 py-6 max-w-md mx-auto w-full">
                <Link to="/customer/transfer" className="flex flex-col items-center gap-2 group cursor-pointer no-underline">
                    <div className="size-16 rounded-2xl glass-card flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5 border-primary/20 group-hover:scale-105 group-active:scale-95 transition-all duration-300 shadow-premium">
                        <span className="material-symbols-outlined text-primary text-[32px]">send</span>
                    </div>
                    <p className="text-xs font-semibold text-[#a0a0a0] group-hover:text-white transition-colors font-outfit">Gönder</p>
                </Link>
                <Link to="/customer/payment-requests" className="flex flex-col items-center gap-2 group cursor-pointer no-underline">
                    <div className="size-16 rounded-2xl glass-card flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-emerald-500/5 border-emerald-500/20 group-hover:scale-105 group-active:scale-95 transition-all duration-300 shadow-premium">
                        <span className="material-symbols-outlined text-emerald-500 text-[32px]">download</span>
                    </div>
                    <p className="text-xs font-semibold text-[#a0a0a0] group-hover:text-white transition-colors font-outfit">Al / İste</p>
                </Link>
                <Link to="/customer/accounts" className="flex flex-col items-center gap-2 group cursor-pointer no-underline">
                    <div className="size-16 rounded-2xl glass-card flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-amber-500/5 border-amber-500/20 group-hover:scale-105 group-active:scale-95 transition-all duration-300 shadow-premium">
                        <span className="material-symbols-outlined text-amber-500 text-[32px]">payments</span>
                    </div>
                    <p className="text-xs font-semibold text-[#a0a0a0] group-hover:text-white transition-colors font-outfit">Yeni Hesap</p>
                </Link>
            </section>

            {/* Transactions List */}
            <section className="px-6 py-4 flex-1 md:max-w-3xl md:mx-auto md:w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-outfit font-bold text-xl">Son İşlemler</h3>
                    <Link to="/customer/ledger" className="text-primary text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">Tümünü Gör</Link>
                </div>

                {recentTx.length === 0 ? (
                    <div className="p-8 text-center glass-card rounded-2xl shadow-premium">
                        <span className="material-symbols-outlined text-5xl text-slate-500 mb-2">receipt_long</span>
                        <p className="text-[#a0a0a0] text-sm font-medium">Henüz bir işleminiz bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentTx.map((tx, idx) => {
                            const isCredit = tx.type === "CREDIT";
                            const icon = isCredit ? "arrow_downward" : "arrow_upward";
                            const iconColorClass = isCredit ? "text-emerald-500" : "text-[#ff5252]";
                            const bgClass = isCredit ? "bg-emerald-500/10" : "bg-[#ff5252]/10";
                            const defaultTitle = isCredit ? "Gelen Para" : "Giden Para";

                            return (
                                <div key={tx.id || idx} className="glass-card rounded-2xl p-4 flex items-center justify-between border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
                                            <span className={`material-symbols-outlined ${iconColorClass} text-2xl`}>{icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-white font-outfit font-bold text-base truncate">
                                                {tx.description || defaultTitle}
                                            </p>
                                            <p className="text-[#a0a0a0] text-[10px] uppercase font-bold tracking-wider truncate mt-0.5">
                                                {tx.category || "Transfer"} • {new Date(tx.created_at).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`${isCredit ? 'text-emerald-500' : 'text-white'} font-outfit font-bold text-lg whitespace-nowrap`}>
                                        {isCredit ? '+' : '-'}₺{Math.abs(tx.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

