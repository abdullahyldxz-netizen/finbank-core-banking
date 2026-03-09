import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    CheckCircle,
    Copy,
    Landmark,
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Wallet,
    User,
    CreditCard,
    ArrowRight
} from "lucide-react";
import { accountApi, transactionApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const TAB_CONFIG = [
    { id: "deposit", label: "Para Yatır", icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "withdraw", label: "Para Çek", icon: ArrowUpRight, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { id: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
];

export default function TransferPage() {
    const { user } = useAuth();
    const rolePath = `/${user?.role || 'customer'}`;
    const [accounts, setAccounts] = useState([]);
    const [easyAddresses, setEasyAddresses] = useState([]);
    const [balances, setBalances] = useState({});
    const [activeTab, setActiveTab] = useState("transfer");
    const [loading, setLoading] = useState(false);
    const [bootLoading, setBootLoading] = useState(true);
    const [receipt, setReceipt] = useState(null);

    // Transfer Wizard State
    const [transferStep, setTransferStep] = useState(1);

    // Forms
    const [depositForm, setDepositForm] = useState({ account_id: "", amount: "", description: "" });
    const [withdrawForm, setWithdrawForm] = useState({ account_id: "", amount: "", description: "" });
    const [transferForm, setTransferForm] = useState({ from_account_id: "", target: "", amount: "", description: "" });

    useEffect(() => {
        loadData();
    }, []);

    const totalBalance = useMemo(
        () => accounts.filter(a => a.account_type !== "credit").reduce((sum, acc) => sum + Number(acc.balance || 0), 0),
        [accounts]
    );

    const loadData = async () => {
        setBootLoading(true);
        try {
            const [accountsRes, aliasesRes] = await Promise.all([
                accountApi.listMine(),
                accountApi.listEasyAddresses(),
            ]);
            const nextAccounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
            const nextAliases = Array.isArray(aliasesRes.data) ? aliasesRes.data : [];
            setAccounts(nextAccounts);
            setEasyAddresses(nextAliases);

            const nextBalances = {};
            for (const account of nextAccounts) {
                const accountId = account.id || account.account_id;
                nextBalances[accountId] = account.account_type === 'credit'
                    ? Number(account.balance || 0) + Number(account.overdraft_limit || 0)
                    : Number(account.balance || 0);
            }
            setBalances(nextBalances);

            if (!depositForm.account_id && nextAccounts[0]) {
                const accountId = nextAccounts[0].id || nextAccounts[0].account_id;
                setDepositForm((prev) => ({ ...prev, account_id: accountId }));
                setWithdrawForm((prev) => ({ ...prev, account_id: accountId }));
                setTransferForm((prev) => ({ ...prev, from_account_id: accountId }));
            }
        } catch (error) {
            toast.error("Hesap verileri yüklenemedi.");
        } finally {
            setBootLoading(false);
        }
    };

    const showReceipt = (type, amount, description, targetLabel = "") => {
        setReceipt({
            type,
            amount: Number(amount),
            description,
            targetLabel,
            date: new Date().toLocaleString("tr-TR"),
            ref: `FIN-${Date.now().toString(36).toUpperCase()}`,
        });
    };

    const handleDeposit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            await transactionApi.deposit({
                ...depositForm,
                amount: Number(depositForm.amount),
            });
            toast.success("Para yatırma talebiniz alındı. Onaydan sonra hesabınıza geçecektir.");
            setDepositForm((prev) => ({ ...prev, amount: "", description: "" }));
            await loadData();
            showReceipt("Para Yatırma", depositForm.amount, depositForm.description);
        } catch (error) {
            toast.error(error.response?.data?.detail || "İşlem başarısız.");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            await transactionApi.withdraw({
                ...withdrawForm,
                amount: Number(withdrawForm.amount),
            });
            showReceipt("Para Çekme", withdrawForm.amount, withdrawForm.description);
            setWithdrawForm((prev) => ({ ...prev, amount: "", description: "" }));
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "İşlem başarısız.");
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        setLoading(true);
        try {
            const target = transferForm.target.trim();
            const payload = {
                from_account_id: transferForm.from_account_id,
                amount: Number(transferForm.amount),
                description: transferForm.description,
            };
            if (target.toUpperCase().startsWith("TR")) {
                payload.target_iban = target;
            } else if (/^[a-f\d]{24}$/i.test(target)) {
                payload.to_account_id = target;
            } else {
                payload.target_alias = target;
            }
            await transactionApi.transfer(payload);
            showReceipt("Transfer", transferForm.amount, transferForm.description, target);
            setTransferForm((prev) => ({ ...prev, target: "", amount: "", description: "" }));
            setTransferStep(1);
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Transfer başarısız.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAlias = async (id) => {
        try {
            await accountApi.deleteEasyAddress(id);
            toast.success("Kolay adres silindi.");
            await loadData();
        } catch (error) {
            toast.error("Silinemedi.");
        }
    };

    // Wizard Next Step Checks
    const handleNextStep = () => {
        if (transferStep === 1) {
            if (!transferForm.from_account_id) return toast.error("Gönderen hesabı seçin.");
            setTransferStep(2);
        } else if (transferStep === 2) {
            if (!transferForm.target) return toast.error("Alıcı IBAN, Kolay Adres veya Hesap No girin.");
            setTransferStep(3);
        } else if (transferStep === 3) {
            if (!transferForm.amount || Number(transferForm.amount) <= 0) return toast.error("Geçerli bir tutar girin.");
            setTransferStep(4);
        }
    };

    if (bootLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (receipt) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto p-6 pt-12 text-center"
            >
                <div className="bg-deepblue-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-8 relative z-10"
                    >
                        <CheckCircle size={48} className="text-white" />

                        {/* Flying Money Particles */}
                        <motion.div
                            initial={{ opacity: 0, y: 0, x: -20 }}
                            animate={{ opacity: [0, 1, 0], y: -80, x: -40 }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                            className="absolute text-emerald-300 font-bold"
                        >₺</motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 0, x: 20 }}
                            animate={{ opacity: [0, 1, 0], y: -60, x: 50 }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, delay: 0.5 }}
                            className="absolute text-emerald-300 font-bold"
                        >₺</motion.div>
                    </motion.div>

                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10">İşlem Başarılı</h2>
                    <p className="text-white/60 mb-8 relative z-10">{receipt.type} başarıyla gerçekleştirildi.</p>

                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-10 tracking-tight relative z-10">
                        {formatMoney(receipt.amount)}
                    </div>

                    <div className="bg-black/20 rounded-2xl p-6 text-left border border-white/5 space-y-4 mb-10 relative z-10">
                        <ReceiptRow label="İşlem Türü" value={receipt.type} />
                        <ReceiptRow label="Tarih" value={receipt.date} />
                        <ReceiptRow label="Referans" value={receipt.ref} copyable />
                        {receipt.targetLabel && <ReceiptRow label="Alıcı / Hedef" value={receipt.targetLabel} />}
                        {receipt.description && <ReceiptRow label="Açıklama" value={receipt.description} />}
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <button
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
                            onClick={() => { setReceipt(null); setTransferStep(1); }}
                        >
                            Yeni İşlem
                        </button>
                        <button
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl transition-all"
                            onClick={() => (window.location.href = `${rolePath}/ledger`)}
                        >
                            Dekont Görüntüle
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Para Transferleri</h1>
                <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
                    Hesaplarınız arası işlem yapın, IBAN veya Kolay Adres ile 7/24 hızlıca para gönderin.
                </p>
            </div>

            {/* Quick Balance Overview */}
            <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 mb-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <div className="text-sm font-semibold text-blue-200/70 uppercase tracking-widest mb-1">Toplam Varlıklar</div>
                    <div className="text-3xl font-black text-white">{formatMoney(totalBalance)}</div>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                    {accounts.map((account) => {
                        const accountId = account.id || account.account_id;
                        return (
                            <div key={accountId} className="px-4 py-2 bg-black/20 rounded-xl border border-white/5 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${account.account_type === 'credit' ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
                                <span className="text-sm font-semibold text-white/80">
                                    {account.account_type === 'credit' ? `Kredi Kartı (${account.account_number.slice(-4)})` : (account.account_name || account.account_number)}
                                </span>
                                <span className="text-sm font-bold text-white">{formatMoney(balances[accountId])}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 bg-black/20 p-2 rounded-2xl border border-white/5 w-fit mx-auto md:mx-0">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setTransferStep(1); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300
                            ${activeTab === tab.id ? `${tab.bg} ${tab.color} shadow-lg border ${tab.border}` : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"}`}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* TRANSFER WIZARD */}
                    {activeTab === "transfer" && (
                        <div className="bg-deepblue-900/40 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl overflow-hidden relative">
                            <h3 className="text-2xl font-black text-white mb-8">Kolay Transfer</h3>

                            {/* Progress Bar */}
                            <div className="flex items-center justify-between mb-8 relative">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full z-0"></div>
                                <div
                                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                                    style={{ width: `${((transferStep - 1) / 3) * 100}%` }}
                                ></div>

                                {[1, 2, 3, 4].map((step) => (
                                    <div
                                        key={step}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative z-10 transition-all duration-300
                                            ${transferStep > step ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border-none' :
                                                transferStep === step ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] border-2 border-white/20 scale-110' :
                                                    'bg-deepblue-900 border-2 border-white/10 text-white/30'}`}
                                        onClick={() => step < transferStep && setTransferStep(step)}
                                        style={{ cursor: step < transferStep ? 'pointer' : 'default' }}
                                    >
                                        {transferStep > step ? <CheckCircle size={18} /> : step}
                                    </div>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {/* STEP 1: Account */}
                                {transferStep === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                                                <Wallet size={32} />
                                            </div>
                                            <h4 className="text-lg font-bold text-white">Gönderen Hesabı Seçin</h4>
                                            <p className="text-sm text-white/50">Transferin yapılacağı kaynağı belirleyin.</p>
                                        </div>

                                        <div className="space-y-3">
                                            {accounts.map((account) => {
                                                const accountId = account.id || account.account_id;
                                                const isActive = transferForm.from_account_id === accountId;
                                                return (
                                                    <button
                                                        key={accountId}
                                                        onClick={() => setTransferForm({ ...transferForm, from_account_id: accountId })}
                                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between
                                                            ${isActive ? 'bg-blue-500/10 border-blue-500/50 shadow-inner' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                    >
                                                        <div>
                                                            <div className={`font-bold text-sm mb-1 ${isActive ? 'text-blue-300' : 'text-white'}`}>
                                                                {account.account_type === 'credit' ? `Kredi Kartı (${account.account_number.slice(-4)})` : (account.account_name || account.account_number)}
                                                            </div>
                                                            <div className="text-xs text-white/50">{account.currency || "TRY"}</div>
                                                        </div>
                                                        <div className={`font-black tracking-tight text-lg ${isActive ? 'text-white' : 'text-white/70'}`}>
                                                            {formatMoney(balances[accountId])}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <button onClick={handleNextStep} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-6 transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2">
                                            Devam Et <ArrowRight size={18} />
                                        </button>
                                    </motion.div>
                                )}

                                {/* STEP 2: Target */}
                                {transferStep === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                                                <User size={32} />
                                            </div>
                                            <h4 className="text-lg font-bold text-white">Alıcı Bilgileri</h4>
                                            <p className="text-sm text-white/50">Kime para göndermek istiyorsunuz?</p>
                                        </div>

                                        <div>
                                            <input
                                                className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-center tracking-wider focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-white/20 placeholder:font-sans"
                                                placeholder="IBAN, Hesap No veya Kolay Adres"
                                                value={transferForm.target}
                                                onChange={(e) => setTransferForm({ ...transferForm, target: e.target.value })}
                                                autoFocus
                                            />
                                        </div>

                                        {easyAddresses.length > 0 && (
                                            <div className="mt-8">
                                                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Veya Kolay Adres Seçin</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {easyAddresses.map((ea) => (
                                                        <button
                                                            key={ea.id}
                                                            onClick={() => setTransferForm({ ...transferForm, target: ea.alias_value })}
                                                            className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-all
                                                                ${transferForm.target === ea.alias_value ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-black/20 border-white/10 text-white/70 hover:bg-white/5'}`}
                                                        >
                                                            {ea.label || ea.alias_type} ({ea.masked_value || ea.alias_value})
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4 mt-8">
                                            <button onClick={() => setTransferStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-colors border border-white/10 flex justify-center items-center gap-2">
                                                <ChevronLeft size={18} /> Geri
                                            </button>
                                            <button onClick={handleNextStep} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2">
                                                Devam Et <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: Amount & Description */}
                                {transferStep === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                                <CreditCard size={32} />
                                            </div>
                                            <h4 className="text-lg font-bold text-white">Tutar ve Açıklama</h4>
                                            <p className="text-sm text-white/50">Gönderilecek tutarı belirleyin.</p>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <span className="text-white/40 text-2xl font-black">₺</span>
                                                </div>
                                                <input
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white text-3xl font-black tracking-tighter focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-white/10"
                                                    type="number" min="0.01" step="0.01"
                                                    value={transferForm.amount}
                                                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                                                    placeholder="0.00"
                                                    autoFocus
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Açıklama (Opsiyonel)</label>
                                                <input
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                                    value={transferForm.description}
                                                    onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                                                    placeholder="Örnek: Kira, Aidat, Borç"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-8">
                                            <button onClick={() => setTransferStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-colors border border-white/10 flex justify-center items-center gap-2">
                                                <ChevronLeft size={18} /> Geri
                                            </button>
                                            <button onClick={handleNextStep} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2">
                                                Devam Et <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 4: Confirmation */}
                                {transferStep === 4 && (
                                    <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
                                                <CheckCircle size={32} />
                                            </div>
                                            <h4 className="text-lg font-bold text-white">İşlemi Onaylayın</h4>
                                            <p className="text-sm text-white/50">Lütfen bilgileri kontrol edin.</p>
                                        </div>

                                        <div className="bg-black/20 rounded-2xl border border-white/5 p-6 space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-sm text-white/50">Gönderen</span>
                                                <span className="text-sm font-bold text-white">
                                                    {accounts.find(a => (a.id || a.account_id) === transferForm.from_account_id)?.account_number || "Seçilen Hesap"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-sm text-white/50">Alıcı</span>
                                                <span className="text-sm font-bold text-white tracking-widest font-mono">{transferForm.target}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-sm text-white/50">Tutar</span>
                                                <span className="text-xl font-black text-rose-400">-{formatMoney(transferForm.amount)}</span>
                                            </div>
                                            {transferForm.description && (
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-sm text-white/50">Açıklama</span>
                                                    <span className="text-sm font-medium text-white">{transferForm.description}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 mt-8">
                                            <button onClick={() => setTransferStep(3)} className="px-6 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-colors border border-white/10">
                                                Geri Dön
                                            </button>
                                            <button
                                                onClick={handleTransfer}
                                                disabled={loading}
                                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 disabled:opacity-50"
                                            >
                                                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <CheckCircle size={18} />}
                                                İşlemi Onayla
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* DEPOSIT FORM */}
                    {activeTab === "deposit" && (
                        <div className="bg-deepblue-900/40 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                    <ArrowDownLeft size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Para Yatır</h3>
                                    <p className="text-sm text-white/50">Hesabınıza nakit girişi sağlayın.</p>
                                </div>
                            </div>

                            <form onSubmit={handleDeposit} className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Hesap Seçimi</label>
                                    <select className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 appearance-none" value={depositForm.account_id} onChange={(e) => setDepositForm({ ...depositForm, account_id: e.target.value })} required>
                                        {accounts.map((account) => {
                                            const accountId = account.id || account.account_id;
                                            return (
                                                <option key={accountId} value={accountId} className="bg-slate-800">
                                                    {account.account_number} - {formatMoney(balances[accountId])}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Tutar (₺)</label>
                                    <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white text-xl font-bold tracking-tight focus:outline-none focus:border-emerald-500/50" type="number" min="0.01" step="0.01" value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })} required placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Açıklama (Opsiyonel)</label>
                                    <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500/50" value={depositForm.description} onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })} placeholder="Maaş, Harçlık vb." />
                                </div>

                                <button disabled={loading} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                                    {loading ? "İşleniyor..." : "Parayı Yatır"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* WITHDRAW FORM */}
                    {activeTab === "withdraw" && (
                        <div className="bg-deepblue-900/40 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                                    <ArrowUpRight size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Para Çek</h3>
                                    <p className="text-sm text-white/50">Hesabınızdan nakit çıkışı yapın.</p>
                                </div>
                            </div>

                            <form onSubmit={handleWithdraw} className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Hesap Seçimi</label>
                                    <select className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-rose-500/50 appearance-none" value={withdrawForm.account_id} onChange={(e) => setWithdrawForm({ ...withdrawForm, account_id: e.target.value })} required>
                                        {accounts.map((account) => {
                                            const accountId = account.id || account.account_id;
                                            return (
                                                <option key={accountId} value={accountId} className="bg-slate-800">
                                                    {account.account_number} - {formatMoney(balances[accountId])}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Tutar (₺)</label>
                                    <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white text-xl font-bold tracking-tight focus:outline-none focus:border-rose-500/50" type="number" min="0.01" step="0.01" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} required placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Açıklama (Opsiyonel)</label>
                                    <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-rose-500/50" value={withdrawForm.description} onChange={(e) => setWithdrawForm({ ...withdrawForm, description: e.target.value })} placeholder="ATM, Nakit Çekim vb." />
                                </div>

                                <button disabled={loading} className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50">
                                    {loading ? "İşleniyor..." : "Parayı Çek"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right Column: Address Book & Quick Stats */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Easy Address Book */}
                    <div className="bg-deepblue-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Adres Defteri</h3>
                            <button
                                onClick={() => window.location.href = `${rolePath}/easy-address`}
                                className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {easyAddresses.length === 0 ? (
                            <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5">
                                <Landmark size={24} className="mx-auto text-white/30 mb-2" />
                                <p className="text-sm text-white/50 px-4">Kayıtlı kolay adresiniz bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {easyAddresses.map((ea) => (
                                    <div key={ea.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                        <div>
                                            <div className="font-bold text-sm text-white">{ea.label || ea.alias_type}</div>
                                            <div className="text-xs text-white/50 mt-0.5">{ea.masked_value || ea.alias_value}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAlias(ea.id)}
                                            className="p-2 text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReceiptRow({ label, value, copyable = false }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-sm text-white/50">{label}</span>
            <span className="text-sm font-bold text-white flex items-center gap-2">
                {value}
                {copyable && (
                    <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Kopyalandı."); }} className="text-blue-400 hover:text-blue-300">
                        <Copy size={14} />
                    </button>
                )}
            </span>
        </div>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value || 0));
}
