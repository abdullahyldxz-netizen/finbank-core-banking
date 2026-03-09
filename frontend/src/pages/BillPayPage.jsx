import { useState, useEffect } from "react";
import {
    Zap, Droplets, Flame, Wifi, Phone, FileText,
    CreditCard, Clock, CheckCircle, Send, RefreshCw, Plus, XCircle
} from "lucide-react";
import { billsApi, billApi, accountApi } from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const BILL_TYPES = [
    { id: "electric", label: "Elektrik", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/20", gradient: "from-amber-500 to-amber-600" },
    { id: "water", label: "Su", icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/20", gradient: "from-blue-500 to-blue-600" },
    { id: "gas", label: "Doğalgaz", icon: Flame, color: "text-rose-500", bg: "bg-rose-500/20", gradient: "from-rose-500 to-rose-600" },
    { id: "internet", label: "İnternet", icon: Wifi, color: "text-violet-500", bg: "bg-violet-500/20", gradient: "from-violet-500 to-violet-600" },
    { id: "phone", label: "Telefon", icon: Phone, color: "text-emerald-500", bg: "bg-emerald-500/20", gradient: "from-emerald-500 to-emerald-600" },
    { id: "other", label: "Diğer", icon: FileText, color: "text-gray-400", bg: "bg-gray-500/20", gradient: "from-gray-500 to-gray-600" },
];

export default function BillPayPage() {
    const [accounts, setAccounts] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [activeTab, setActiveTab] = useState("pay");
    const [selectedType, setSelectedType] = useState(null);
    const [form, setForm] = useState({
        account_id: "",
        provider: "",
        subscriber_no: "",
        amount: "",
    });

    const [autoBills, setAutoBills] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [autoForm, setAutoForm] = useState({
        account_id: "",
        provider: "",
        subscriber_no: "",
        payment_day: 1,
        max_amount: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [accRes, histRes, autoRes] = await Promise.allSettled([
                accountApi.listMine(),
                billsApi.history(),
                billApi.listAuto(),
            ]);
            setAccounts(accRes.status === "fulfilled" ? (Array.isArray(accRes.value.data) ? accRes.value.data : (accRes.value.data?.data || [])) : []);
            setHistory(histRes.status === "fulfilled" ? (Array.isArray(histRes.value.data) ? histRes.value.data : (histRes.value.data?.data || [])) : []);
            setAutoBills(autoRes.status === "fulfilled" ? (Array.isArray(autoRes.value.data?.data) ? autoRes.value.data.data : []) : []);
        } catch { }
        finally { setLoading(false); }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        if (!selectedType || !form.account_id || !form.provider || !form.subscriber_no || !form.amount) {
            toast.error("Lütfen tüm alanları doldurun.");
            return;
        }
        setPaying(true);
        try {
            await billsApi.pay({
                account_id: form.account_id,
                bill_type: selectedType,
                provider: form.provider,
                subscriber_no: form.subscriber_no,
                amount: parseFloat(form.amount),
            });
            toast.success("Fatura başarıyla ödendi! ✅");
            setForm({ account_id: "", provider: "", subscriber_no: "", amount: "" });
            setSelectedType(null);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Ödeme başarısız.");
        } finally { setPaying(false); }
    };

    const handleCreateAuto = async (e) => {
        e.preventDefault();
        if (!selectedType || !autoForm.account_id || !autoForm.provider || !autoForm.subscriber_no || !autoForm.payment_day) {
            toast.error("Lütfen gerekli tüm alanları doldurun.");
            return;
        }
        setActionLoading(true);
        try {
            await billApi.createAuto({
                account_id: autoForm.account_id,
                bill_type: selectedType,
                provider: autoForm.provider,
                subscriber_no: autoForm.subscriber_no,
                payment_day: Number(autoForm.payment_day),
                max_amount: autoForm.max_amount ? Number(autoForm.max_amount) : null
            });
            toast.success("Otomatik ödeme talimatı oluşturuldu! ✅");
            setShowAutoModal(false);
            setAutoForm({ account_id: "", provider: "", subscriber_no: "", payment_day: 1, max_amount: "" });
            setSelectedType(null);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Talimat oluşturulamadı.");
        } finally { setActionLoading(false); }
    };

    const handleCancelAuto = async (id) => {
        if (!window.confirm("Bu otomatik ödeme talimatını iptal etmek istediğinize emin misiniz?")) return;
        setActionLoading(true);
        try {
            await billApi.cancelAuto(id);
            toast.success("Talimat iptal edildi.");
            loadData();
        } catch (err) {
            toast.error("İptal işlemi başarısız oldu.");
        } finally { setActionLoading(false); }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val || 0);

    const formatDate = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString("tr-TR", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8 pl-2 border-l-4 border-blue-500">
                <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Zap size={24} />
                    </div>
                    Fatura Ödeme
                </h1>
                <p className="text-white/60 mt-2 font-medium">
                    Elektrik, su, doğalgaz ve diğer faturalarınızı kolayca ödeyin ve otomatik talimat verin.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <TabBtn active={activeTab === "pay"} onClick={() => setActiveTab("pay")} icon={<CreditCard size={18} />}>
                    Fatura Öde
                </TabBtn>
                <TabBtn active={activeTab === "auto"} onClick={() => setActiveTab("auto")} icon={<RefreshCw size={18} />}>
                    Otomatik Ödemeler
                </TabBtn>
                <TabBtn active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<Clock size={18} />}>
                    Ödeme Geçmişi ({history.length})
                </TabBtn>
            </div>

            {/* Pay Tab */}
            <AnimatePresence mode="wait">
                {activeTab === "pay" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl"
                    >
                        {/* Bill Type Selection */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-white/80 mb-4 uppercase tracking-wider">Fatura Türü Seçin</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                {BILL_TYPES.map((bt) => {
                                    const Icon = bt.icon;
                                    const isActive = selectedType === bt.id;
                                    return (
                                        <button
                                            key={bt.id}
                                            onClick={() => setSelectedType(bt.id)}
                                            className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group
                                                ${isActive ? `bg-gradient-to-br ${bt.gradient} border-transparent shadow-lg shadow-${bt.color.split('-')[1]}-500/20 text-white scale-105`
                                                    : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/20 text-white/60 hover:text-white'}`}
                                        >
                                            <Icon size={28} className={isActive ? "text-white" : bt.color} />
                                            <div className="text-sm font-semibold">{bt.label}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedType && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                onSubmit={handlePay}
                                className="space-y-6 pt-6 border-t border-white/10"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Ödenecek Hesap</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none"
                                        value={form.account_id}
                                        onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                                        required
                                    >
                                        <option value="" className="bg-deepblue-900">Hesap seçin...</option>
                                        {accounts.filter(a => a.status === "active").map((a) => (
                                            <option key={a.id} value={a.id} className="bg-deepblue-900">
                                                {a.account_number} ({formatCurrency(a.balance)} {a.currency})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">Kurum / Sağlayıcı</label>
                                        <input
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="Örn: TEDAŞ, İGDAŞ..."
                                            value={form.provider}
                                            onChange={(e) => setForm({ ...form, provider: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">Abone No</label>
                                        <input
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="Abone numaranız"
                                            value={form.subscriber_no}
                                            onChange={(e) => setForm({ ...form, subscriber_no: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Tutar</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium font-mono">₺</span>
                                        <input
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white font-mono text-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70"
                                    disabled={paying}
                                >
                                    {paying ? (
                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <><Send size={20} /> İşlemi Tamamla</>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </motion.div>
                )}

                {/* History Tab */}
                {activeTab === "history" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {history.length === 0 ? (
                            <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-12 text-center shadow-xl">
                                <FileText size={48} className="mx-auto text-white/20 mb-4" />
                                <p className="text-white/60 font-medium">Henüz fatura ödemesi bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((bill, i) => {
                                    const bt = BILL_TYPES.find(b => b.id === bill.bill_type) || BILL_TYPES[5];
                                    const Icon = bt.icon;
                                    return (
                                        <div key={bill.bill_id || i} className="bg-deepblue-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 flex flex-wrap sm:flex-nowrap items-center gap-4 hover:bg-white/5 transition-colors shadow-lg">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bt.bg} ${bt.color}`}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white text-lg">{bill.provider} — {bt.label}</div>
                                                <div className="text-sm text-white/50 mt-1">
                                                    Abone: {bill.subscriber_no}
                                                </div>
                                            </div>
                                            <div className="text-right w-full sm:w-auto mt-2 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                                                <div className="font-mono font-bold text-white text-lg">
                                                    {formatCurrency(bill.amount)}
                                                </div>
                                                <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-bold mt-1 inline-flex items-center gap-1">
                                                    <CheckCircle size={12} /> Ödendi
                                                </div>
                                                <div className="text-xs text-white/40 mt-1 sm:hidden ml-2">{formatDate(bill.paid_at)}</div>
                                            </div>
                                            <div className="text-xs text-white/40 hidden sm:block text-right self-end ml-4">
                                                {formatDate(bill.paid_at)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Auto Bills Tab */}
                {activeTab === "auto" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <h3 className="text-xl font-bold text-white">Aktif Talimatlar</h3>
                            <button
                                onClick={() => setShowAutoModal(true)}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
                            >
                                <Plus size={18} /> Yeni Talimat
                            </button>
                        </div>

                        {autoBills.length === 0 ? (
                            <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-12 text-center shadow-xl">
                                <RefreshCw size={48} className="mx-auto text-white/20 mb-4" />
                                <p className="text-white/60 font-medium">Henüz otomatik ödeme talimatınız bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {autoBills.map(ab => {
                                    const bt = BILL_TYPES.find(b => b.id === ab.bill_type) || BILL_TYPES[5];
                                    const Icon = bt.icon;
                                    return (
                                        <div key={ab.auto_bill_id} className="bg-deepblue-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 flex flex-wrap justify-between items-center gap-4 hover:border-white/10 transition-colors shadow-lg group">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bt.bg} ${bt.color}`}>
                                                    <Icon size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-lg">{ab.provider}</div>
                                                    <div className="text-sm text-white/50 mt-1 flex items-center gap-2">
                                                        <span>Abone: {ab.subscriber_no}</span>
                                                        <span className="w-1 h-1 rounded-full bg-white/30"></span>
                                                        <span className="text-amber-400 font-medium">Her ayın {ab.payment_day}. günü</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                                {ab.max_amount && (
                                                    <div className="text-right">
                                                        <div className="text-xs text-white/40 mb-1 uppercase tracking-wider font-semibold">Limit</div>
                                                        <div className="font-mono font-bold text-white max-w-[120px] truncate">{formatCurrency(ab.max_amount)}</div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleCancelAuto(ab.auto_bill_id)}
                                                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm font-bold transition-colors opacity-80 group-hover:opacity-100"
                                                    disabled={actionLoading}
                                                >
                                                    İptal Et
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Auto Bill Create Modal */}
            <AnimatePresence>
                {showAutoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAutoModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-deepblue-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white truncate">Yeni Otomatik Talimat</h2>
                                <button onClick={() => { setShowAutoModal(false); setSelectedType(null); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-white/70 mb-3">Fatura Türü</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {BILL_TYPES.map((bt) => {
                                        const Icon = bt.icon;
                                        const isActive = selectedType === bt.id;
                                        return (
                                            <button
                                                key={bt.id}
                                                onClick={() => setSelectedType(bt.id)}
                                                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1.5
                                                    ${isActive ? `${bt.bg} border-${bt.color.split('-')[1]}-500/50 ${bt.color} shadow-inner` : 'bg-black/20 border-white/5 hover:bg-white/5 text-white/60'}`}
                                            >
                                                <Icon size={20} />
                                                <div className="text-xs font-semibold">{bt.label}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedType && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                    onSubmit={handleCreateAuto}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">Ödenecek Hesap</label>
                                        <select
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none appearance-none"
                                            value={autoForm.account_id}
                                            onChange={(e) => setAutoForm({ ...autoForm, account_id: e.target.value })}
                                            required
                                        >
                                            <option value="" className="bg-deepblue-900">Hesap seçin...</option>
                                            {accounts.filter(a => a.status === "active").map((a) => (
                                                <option key={a.id || a.account_id} value={a.id || a.account_id} className="bg-deepblue-900">
                                                    {a.account_number} ({formatCurrency(a.balance)} {a.currency})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">Kurum / Sağlayıcı</label>
                                            <input
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="Örn: TEDAŞ" required
                                                value={autoForm.provider} onChange={(e) => setAutoForm({ ...autoForm, provider: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">Abone No</label>
                                            <input
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="Abone numarası" required
                                                value={autoForm.subscriber_no} onChange={(e) => setAutoForm({ ...autoForm, subscriber_no: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">Ödeme Günü (1-31)</label>
                                            <input
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                                type="number" min="1" max="31" required
                                                value={autoForm.payment_day} onChange={(e) => setAutoForm({ ...autoForm, payment_day: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">Maks. Tutar <span className="text-white/40 text-xs font-normal">(Opsiyonel)</span></label>
                                            <input
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none font-mono"
                                                type="number" step="0.01" min="1" placeholder="Limitsiz"
                                                value={autoForm.max_amount} onChange={(e) => setAutoForm({ ...autoForm, max_amount: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full mt-4 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-70"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><CheckCircle size={20} /> Talimatı Kaydet</>}
                                    </button>
                                </motion.form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TabBtn({ active, onClick, icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300 flex items-center justify-center gap-2 flex-1
                ${active
                    ? "bg-white/10 text-white shadow-lg border border-white/20"
                    : "bg-black/20 hover:bg-white/5 text-white/60 hover:text-white border border-white/5"}`}
        >
            {icon}
            {children}
        </button>
    );
}
function Loader2({ className }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
