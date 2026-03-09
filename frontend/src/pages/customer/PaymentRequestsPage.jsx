import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { accountApi, paymentRequestsApi } from "../../services/api";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Ban,
    RefreshCw,
    Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentRequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Tab state: "incoming" | "outgoing"
    const [activeTab, setActiveTab] = useState("incoming");

    // Create new request state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ target_alias: "", amount: "", description: "" });

    // Approve modal state
    const [approveModal, setApproveModal] = useState({ show: false, request: null, account_id: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reqRes, accRes] = await Promise.all([
                paymentRequestsApi.list(),
                accountApi.listMine()
            ]);
            setRequests(Array.isArray(reqRes.data) ? reqRes.data : reqRes.data?.data || []);

            const activeAccounts = Array.isArray(accRes.data)
                ? accRes.data.filter(a => a.status === "active")
                : accRes.data?.data?.filter(a => a.status === "active") || [];

            setAccounts(activeAccounts);
        } catch (error) {
            toast.error("Ödeme istekleri yüklenemedi.");
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await paymentRequestsApi.create({
                target_alias: createForm.target_alias,
                amount: Number(createForm.amount),
                description: createForm.description || "Ödeme İsteği"
            });
            toast.success("Ödeme isteği gönderildi.");
            setShowCreateModal(false);
            setCreateForm({ target_alias: "", amount: "", description: "" });
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Ödeme isteği gönderilemedi.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (e) => {
        e.preventDefault();
        if (!approveModal.account_id) {
            toast.error("Lütfen ödeme yapılacak hesabı seçin.");
            return;
        }
        setActionLoading(true);
        try {
            await paymentRequestsApi.approve(approveModal.request.request_id, {
                account_id: approveModal.account_id
            });
            toast.success("Ödeme başarıyla gerçekleştirildi.");
            setApproveModal({ show: false, request: null, account_id: "" });
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Ödeme onaylanamadı.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Bu ödeme isteğini reddetmek istediğinize emin misiniz?")) return;
        setActionLoading(true);
        try {
            await paymentRequestsApi.reject(id);
            toast.success("Ödeme isteği reddedildi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "İşlem başarısız.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Bu ödeme isteğini iptal etmek istediğinize emin misiniz?")) return;
        setActionLoading(true);
        try {
            await paymentRequestsApi.cancel(id);
            toast.success("Ödeme isteği iptal edildi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "İşlem başarısız.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("tr-TR", {
            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    // Filter requests
    const incomingRequests = requests.filter(r => r.target_user_id === user?.user_id);
    const outgoingRequests = requests.filter(r => r.requester_user_id === user?.user_id);
    const displayedRequests = activeTab === "incoming" ? incomingRequests : outgoingRequests;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 relative">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-10"
            >
                <div>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight">
                        Ödeme İsteği
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-xl">
                        Arkadaşlarınızdan veya müşterilerinizden kolayca ödeme isteyin, hesaplaşmaları hızlandırın.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none py-3 px-6 rounded-2xl text-sm md:text-base font-bold shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Yeni İstek
                </motion.button>
            </motion.div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl mb-8 relative max-w-md"
            >
                <div
                    className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-white/10 rounded-xl transition-all duration-300 ease-spring"
                    style={{ left: activeTab === "incoming" ? "6px" : "calc(50%)" }}
                />
                <button
                    onClick={() => setActiveTab("incoming")}
                    className={`relative flex-1 py-3 text-sm md:text-base font-bold rounded-xl transition-colors flex items-center justify-center gap-2 z-10 ${activeTab === "incoming" ? "text-white" : "text-gray-400 hover:text-gray-300"
                        }`}
                >
                    <ArrowDownLeft size={18} className={activeTab === "incoming" ? "text-emerald-400" : ""} />
                    Gelen
                    {incomingRequests.filter(r => r.status === "pending").length > 0 && (
                        <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs font-bold border border-rose-400 shadow-sm shadow-rose-500/50 ml-1">
                            {incomingRequests.filter(r => r.status === "pending").length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("outgoing")}
                    className={`relative flex-1 py-3 text-sm md:text-base font-bold rounded-xl transition-colors flex items-center justify-center gap-2 z-10 ${activeTab === "outgoing" ? "text-white" : "text-gray-400 hover:text-gray-300"
                        }`}
                >
                    <ArrowUpRight size={18} className={activeTab === "outgoing" ? "text-amber-400" : ""} />
                    Giden
                </button>
            </motion.div>

            {/* List */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid gap-4 md:gap-6"
            >
                {displayedRequests.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center shadow-lg">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/10">
                            {activeTab === "incoming"
                                ? <ArrowDownLeft size={36} className="text-gray-500" />
                                : <ArrowUpRight size={36} className="text-gray-500" />
                            }
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {activeTab === "incoming" ? "Gelen İstek Yok" : "Giden İstek Yok"}
                        </h3>
                        <p className="text-gray-400 text-sm md:text-base max-w-sm">
                            Şu anda bu kategoride herhangi bir ödeme isteğiniz bulunmuyor.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {displayedRequests.map((req, index) => {
                            const isPending = req.status === "pending";
                            const isPaid = req.status === "paid";
                            const isCancelled = req.status === "cancelled";

                            let statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                            let iconColor = "text-rose-400";
                            let iconBg = "bg-rose-500/20";
                            let StatusIcon = XCircle;
                            let statusText = "Reddedildi";

                            if (isPending) {
                                statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                                iconColor = "text-amber-400";
                                iconBg = "bg-amber-500/20";
                                StatusIcon = Clock;
                                statusText = "Bekliyor";
                            } else if (isPaid) {
                                statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                                iconColor = "text-emerald-400";
                                iconBg = "bg-emerald-500/20";
                                StatusIcon = CheckCircle;
                                statusText = "Ödendi";
                            } else if (isCancelled) {
                                statusColor = "text-gray-400 bg-gray-500/10 border-gray-500/20";
                                iconColor = "text-gray-400";
                                iconBg = "bg-gray-500/20";
                                StatusIcon = Ban;
                                statusText = "İptal Edildi";
                            }

                            return (
                                <motion.div
                                    key={req.request_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-lg hover:bg-white/10 transition-colors group"
                                >
                                    <div className="flex gap-4 md:gap-5 items-center w-full md:w-auto">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner group-hover:scale-110 transition-transform ${iconBg} ${iconColor}`}>
                                            <StatusIcon size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white text-base md:text-lg mb-1 tracking-wide">
                                                {activeTab === "incoming" ? req.requester_name : req.target_name}
                                            </div>
                                            <div className="text-xs md:text-sm text-gray-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                                                <span>{formatDate(req.created_at)}</span>
                                                <span className="hidden sm:inline opacity-30">•</span>
                                                <span className="text-gray-300 italic">"{req.description}"</span>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-lg border inline-block ${statusColor}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
                                        <div className="text-2xl md:text-3xl font-black text-white shrink-0 tracking-tight">
                                            {formatMoney(req.amount)}
                                        </div>

                                        {isPending && (
                                            <div className="flex gap-2 w-full md:w-auto">
                                                {activeTab === "incoming" ? (
                                                    <>
                                                        <button
                                                            onClick={() => setApproveModal({ show: true, request: req, account_id: "" })}
                                                            disabled={actionLoading}
                                                            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                                                        >
                                                            Onayla & Öde
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.request_id)}
                                                            disabled={actionLoading}
                                                            className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
                                                            title="Reddet"
                                                        >
                                                            <Ban size={20} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCancel(req.request_id)}
                                                        disabled={actionLoading}
                                                        className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                                                    >
                                                        İptal Et
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#121827]/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 z-10">
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white transition-colors focus:outline-none">
                                    <XCircle size={28} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-6 pr-10">Yeni Ödeme İsteği</h2>

                            <form onSubmit={handleCreateRequest} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Kimden İsteniyor?</label>
                                    <input
                                        className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner"
                                        value={createForm.target_alias}
                                        onChange={e => setCreateForm(prev => ({ ...prev, target_alias: e.target.value }))}
                                        placeholder="Telefon, E-Posta veya TCKN"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Tutar (TL)</label>
                                    <div className="relative">
                                        <input
                                            className="w-full pl-12 pr-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner"
                                            type="number"
                                            min="0.01" step="0.01"
                                            value={createForm.amount}
                                            onChange={e => setCreateForm(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="0.00"
                                            required
                                        />
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₺</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Açıklama</label>
                                    <input
                                        className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner"
                                        value={createForm.description}
                                        onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Örn: Akşam Yemeği, Borç vs."
                                        maxLength={100}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-300 mt-4 ${actionLoading
                                            ? 'bg-amber-500/50 cursor-wait'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-95'
                                        }`}
                                >
                                    {actionLoading ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={20} />}
                                    İsteği Gönder
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {approveModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#121827]/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 z-10">
                                <button onClick={() => setApproveModal({ show: false, request: null, account_id: "" })} className="text-gray-400 hover:text-white transition-colors focus:outline-none">
                                    <XCircle size={28} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-6 pr-10">Ödemeyi Onayla</h2>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl mb-6 flex items-start gap-4">
                                <div className="mt-1 bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <div className="text-sm md:text-base text-gray-300 leading-relaxed">
                                        <strong className="text-white">{approveModal.request?.requester_name}</strong> adlı kişiye <strong className="text-white">{formatMoney(approveModal.request?.amount)}</strong> ödeme yapacaksınız.
                                    </div>
                                    <div className="text-xs md:text-sm text-emerald-400 mt-2 font-medium italic">
                                        Not: {approveModal.request?.description}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleApprove} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Ödeme Yapılacak Hesap</label>
                                    <select
                                        className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner appearance-none cursor-pointer"
                                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 1rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "3rem" }}
                                        value={approveModal.account_id}
                                        onChange={e => setApproveModal(prev => ({ ...prev, account_id: e.target.value }))}
                                        required
                                    >
                                        <option value="" disabled className="bg-gray-800 text-gray-400">Hesap Seçin</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id || acc.account_id} value={acc.id || acc.account_id} className="bg-gray-800 text-white">
                                                {acc.account_number} • {formatMoney(acc.balance, acc.currency)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${actionLoading
                                            ? 'bg-emerald-500/50 cursor-wait'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95'
                                        }`}
                                >
                                    {actionLoading ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                                    Onayla ve Öde
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
