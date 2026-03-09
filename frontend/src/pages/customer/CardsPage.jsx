import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    CalendarDays,
    Copy,
    CreditCard,
    DollarSign,
    Eye,
    EyeOff,
    Layers3,
    Percent,
    PlusCircle,
    RefreshCw,
    ShoppingCart,
    ShieldCheck,
    Smartphone,
    Landmark,
    Send,
} from "lucide-react";
import { accountApi, cardsApi, approvalsApi } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function CardsPage() {
    const [cards, setCards] = useState([]);
    const [debitCards, setDebitCards] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState("");
    const [cardTypeTab, setCardTypeTab] = useState("credit"); // "credit" or "debit"
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("transactions");
    const [selectedAccount, setSelectedAccount] = useState("");
    const [payAmount, setPayAmount] = useState("");
    const [purchaseAmount, setPurchaseAmount] = useState("");
    const [purchaseDescription, setPurchaseDescription] = useState("");
    const [virtualCardForm, setVirtualCardForm] = useState({ alias: "", online_limit: "" });
    const [showSensitive, setShowSensitive] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedCardId) {
            loadTransactions(selectedCardId);
        } else {
            setTransactions([]);
        }
    }, [selectedCardId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cardsRes, accountsRes, debitRes] = await Promise.all([
                cardsApi.getMyCards(),
                accountApi.listMine(),
                accountApi.getDebitCards().catch(() => ({ data: [] })),
            ]);
            const nextCards = Array.isArray(cardsRes.data) ? cardsRes.data : [];
            const nextDebitCards = Array.isArray(debitRes.data) ? debitRes.data : [];
            const nextAccounts = Array.isArray(accountsRes.data) ? accountsRes.data.filter((account) => account.status === "active") : [];
            setCards(nextCards);
            setDebitCards(nextDebitCards);
            setAccounts(nextAccounts);

            if (!selectedCardId && nextCards[0]) {
                setSelectedCardId(nextCards[0].id || nextCards[0].card_id);
            } else if (selectedCardId && !nextCards.some((card) => (card.id || card.card_id) === selectedCardId)) {
                setSelectedCardId(nextCards[0] ? (nextCards[0].id || nextCards[0].card_id) : "");
            }

            if (!selectedAccount && nextAccounts[0]) {
                setSelectedAccount(nextAccounts[0].id || nextAccounts[0].account_id);
            }
        } catch (error) {
            toast.error("Kart verileri yüklenemedi.");
            setCards([]);
            setAccounts([]);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async (cardId) => {
        try {
            const res = await cardsApi.getCardTransactions(cardId);
            setTransactions(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            setTransactions([]);
        }
    };

    const handleApply = async () => {
        if (!window.confirm("Fiziksel kredi kartı başvurusu oluşturulsun mu?")) return;
        setActionLoading(true);
        try {
            await cardsApi.applyForCard({});
            toast.success("Kredi kartı başvurusu alındı.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Kart başvurusu başarısız.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateVirtualCard = async (event) => {
        event.preventDefault();
        setActionLoading(true);
        try {
            await cardsApi.createVirtualCard({
                alias: virtualCardForm.alias || undefined,
                online_limit: virtualCardForm.online_limit ? Number(virtualCardForm.online_limit) : undefined,
            });
            toast.success("Sanal kart oluşturuldu.");
            setVirtualCardForm({ alias: "", online_limit: "" });
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Sanal kart oluşturulamadı.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApplyLimit = async () => {
        if (!selectedCardId) return;
        const requestedLimitStr = window.prompt("Yeni talep ettiğiniz kredi limitini giriniz:");
        if (!requestedLimitStr) return;
        const requestedLimit = parseFloat(requestedLimitStr);
        if (isNaN(requestedLimit) || requestedLimit <= 0) {
            toast.error("Geçerli bir tutar giriniz.");
            return;
        }

        setActionLoading(true);
        try {
            await approvalsApi.createApproval({
                request_type: "CREDIT_LIMIT_INCREASE",
                amount: requestedLimit,
                currency: "TRY",
                description: "Kredi Kartı Limit Artış Talebi",
                metadata: {
                    card_id: selectedCardId
                }
            });
            toast.success("Limit artış talebiniz alındı ve onaya gönderildi.");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Talep gönderilemedi.");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePayDebt = async (event) => {
        event.preventDefault();
        if (!selectedCard || !selectedAccount || !payAmount) {
            toast.error("Ödeme için kart, hesap ve tutar seçin.");
            return;
        }
        setActionLoading(true);
        try {
            await cardsApi.payCardDebt(selectedCard.id || selectedCard.card_id, selectedAccount, Number(payAmount));
            toast.success("Kart borcu ödendi.");
            setPayAmount("");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Kart borcu ödenemedi.");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePurchase = async (event) => {
        event.preventDefault();
        if (!selectedCard || !purchaseAmount || !purchaseDescription.trim()) {
            toast.error("Harcama için tutar ve açıklama girin.");
            return;
        }
        setActionLoading(true);
        try {
            await cardsApi.purchase(selectedCard.id || selectedCard.card_id, Number(purchaseAmount), purchaseDescription.trim());
            toast.success("Kart harcaması kaydedildi.");
            setPurchaseAmount("");
            setPurchaseDescription("");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Harcama başarısız oldu.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleSetting = async (settingName, currentValue) => {
        if (!selectedCard) return;
        setActionLoading(true);
        try {
            await cardsApi.updateSettings(selectedCard.id || selectedCard.card_id, {
                [settingName]: !currentValue
            });
            toast.success("Kart ayarları güncellendi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Ayar güncellenemedi.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleFreeze = async () => {
        if (!selectedCard) return;
        setActionLoading(true);
        try {
            await cardsApi.toggleFreeze(selectedCard.id || selectedCard.card_id);
            toast.success(selectedCard.status === "active" ? "Kart donduruldu." : "Kart aktif edildi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Durum değiştirilemedi.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteVirtualCard = async () => {
        if (!selectedCard || !selectedCard.is_virtual) return;
        if (!window.confirm("Bu sanal kartı kalıcı olarak silmek istediğinize emin misiniz?")) return;
        setActionLoading(true);
        try {
            await cardsApi.deleteCard(selectedCard.id || selectedCard.card_id);
            toast.success("Sanal kart silindi.");
            setSelectedCardId("");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Sanal kart silinemedi.");
        } finally {
            setActionLoading(false);
        }
    };

    const displayCards = cardTypeTab === "credit" ? cards : debitCards;
    const selectedCard = displayCards.find((card) => (card.id || card.card_id) === selectedCardId) || displayCards[0] || null;
    const hasPhysicalCard = cards.some((card) => !card.is_virtual);
    const paymentAccounts = useMemo(() => accounts.map((account) => ({
        id: account.id || account.account_id,
        account_number: account.account_number,
        balance: Number(account.balance || 0),
    })), [accounts]);

    const linkedAccount = paymentAccounts.find(a => a.account_number === selectedCard?.account_number) || {};
    const linkedBalance = linkedAccount.balance || 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <RefreshCw size={48} className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (!hasPhysicalCard) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto p-6"
            >
                <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <CreditCard size={48} className="text-blue-400" />
                    </div>

                    <h1 className="text-3xl font-black mb-4 relative z-10 text-white tracking-tight">Kredi kartınızı açın</h1>
                    <p className="text-white/60 leading-relaxed max-w-lg mx-auto mb-8 relative z-10">
                        Fiziksel kredi kartınızı oluşturduktan sonra sanal kart ekleyebilir, internet limiti belirleyebilir ve kart hareketlerini tek panelden modern 3D arayüzle takip edebilirsiniz.
                    </p>

                    <button
                        onClick={handleApply}
                        disabled={actionLoading}
                        className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
                    >
                        {actionLoading ? <RefreshCw size={20} className="animate-spin" /> : <PlusCircle size={20} />}
                        Fiziksel kart oluştur
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight">Kartlarım</h1>
                <p className="text-white/60 mt-1 text-sm sm:text-base">
                    Kartlarınızı yönetin, limitleri düzenleyin ve 3D görünümle detayları inceleyin.
                </p>
            </div>

            {/* Type Tabs */}
            <div className="flex gap-2 sm:gap-4 mb-8 bg-black/20 p-1.5 rounded-2xl w-fit border border-white/5">
                <button
                    onClick={() => { setCardTypeTab("credit"); setSelectedCardId(""); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${cardTypeTab === "credit" ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                >
                    <CreditCard size={18} /> Kredi Kartları
                </button>
                <button
                    onClick={() => { setCardTypeTab("debit"); setSelectedCardId(""); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${cardTypeTab === "debit" ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                >
                    <Landmark size={18} /> Banka Kartları
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Card Selection & Creation */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Select Card */}
                    <div className="bg-deepblue-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Kart Seçimi</h3>
                            <span className="text-xs font-semibold px-3 py-1 bg-black/30 rounded-full text-white/70 border border-white/5">{displayCards.length} kart</span>
                        </div>

                        <div className="space-y-3">
                            {displayCards.length === 0 && (
                                <p className="text-sm text-white/50 text-center py-4 bg-black/20 rounded-xl">Bu kategoride kartınız bulunmuyor.</p>
                            )}
                            {displayCards.map((card) => {
                                const cardKey = card.id || card.card_id;
                                const active = cardKey === (selectedCard?.id || selectedCard?.card_id);
                                return (
                                    <button
                                        key={cardKey}
                                        onClick={() => {
                                            setSelectedCardId(cardKey);
                                            setIsFlipped(false);
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group
                                            ${active ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
                                    >
                                        <div>
                                            <div className={`font-bold text-sm mb-1 transition-colors ${active ? "text-blue-100" : "text-white/80 group-hover:text-white"}`}>
                                                {card.card_name || (card.is_virtual ? "Sanal Kart" : "Fiziksel Kart")}
                                            </div>
                                            <div className={`text-xs font-mono tracking-wider ${active ? "text-blue-300/80" : "text-white/50"}`}>
                                                {maskCardNumber(card.card_number)}
                                            </div>
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border
                                            ${card.is_virtual ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}
                                            ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                                            {card.is_virtual ? "Sanal" : "Fiziksel"}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Create Virtual Card */}
                    {cardTypeTab === "credit" && (
                        <div className="bg-deepblue-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
                                    <Smartphone size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white">Sanal Kart Oluştur</h3>
                            </div>

                            <form onSubmit={handleCreateVirtualCard} className="space-y-4 relative z-10">
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Kart Etiketi</label>
                                    <input
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-white/30"
                                        value={virtualCardForm.alias}
                                        onChange={(e) => setVirtualCardForm((prev) => ({ ...prev, alias: e.target.value }))}
                                        placeholder="Örn: Netflix, Amazon"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Aylık Limit (₺)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-white/30"
                                        value={virtualCardForm.online_limit}
                                        onChange={(e) => setVirtualCardForm((prev) => ({ ...prev, online_limit: e.target.value }))}
                                        placeholder="0.00"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                                >
                                    {actionLoading ? <RefreshCw size={18} className="animate-spin" /> : <Layers3 size={18} />}
                                    Sanal Kart Ekle
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right Column: Card Details & Actions */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedCard ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedCard.id || selectedCard.card_id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* 3D Flip Card Container */}
                                <div className="group [perspective:2000px] w-full max-w-md mx-auto h-[260px]">
                                    <div
                                        className={`relative w-full h-full transition-transform duration-1000 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        {/* Front Face */}
                                        <div
                                            className="absolute w-full h-full [backface-visibility:hidden] rounded-[24px] shadow-2xl p-6 overflow-hidden border border-white/20 cursor-pointer flex flex-col justify-between"
                                            style={{
                                                background: cardTypeTab === "debit"
                                                    ? "linear-gradient(135deg, #0f172a 0%, #7f1d1d 50%, #ea580c 100%)"
                                                    : selectedCard.is_virtual
                                                        ? "linear-gradient(135deg, #064e3b 0%, #059669 100%)"
                                                        : "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)"
                                            }}
                                        >
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                                            {/* Card Top */}
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-md">FinBank</h2>
                                                    <p className="text-[10px] text-white/70 uppercase tracking-[0.2em] mt-1 font-semibold">
                                                        {selectedCard.card_name || (cardTypeTab === "debit" ? "Debit Card" : "Credit Card")}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <WifiIcon />
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-white/10 text-white/90 border-white/20 shadow-sm backdrop-blur-sm`}>
                                                        {cardTypeTab === "debit" ? "Banka" : selectedCard.is_virtual ? "Sanal" : "Fiziksel"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Chip & Number */}
                                            <div className="relative z-10 my-auto pt-4">
                                                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 overflow-hidden relative shadow-sm border border-yellow-600/30 mb-4 opacity-90">
                                                    <div className="absolute top-1/2 left-0 w-full h-px bg-black/20"></div>
                                                    <div className="absolute left-1/3 top-0 w-px h-full bg-black/20"></div>
                                                    <div className="absolute left-2/3 top-0 w-px h-full bg-black/20"></div>
                                                </div>

                                                <div className="font-mono text-[22px] font-medium text-white tracking-[0.15em] drop-shadow-sm flex items-center justify-between group-hover:text-white/90 transition-colors">
                                                    <span>{showSensitive ? formatCardNumber(selectedCard.card_number) : maskCardNumber(selectedCard.card_number)}</span>
                                                </div>
                                            </div>

                                            {/* Card Bottom */}
                                            <div className="flex justify-between items-end relative z-10">
                                                <div>
                                                    <div className="text-[9px] text-white/60 uppercase tracking-widest mb-1">Card Holder</div>
                                                    <div className="text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                        {selectedCard.cardholder_name || selectedCard.holder_name || "Müşteri"}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8 opacity-90" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Back Face */}
                                        <div
                                            className="absolute w-full h-full [backface-visibility:hidden] rounded-[24px] shadow-2xl overflow-hidden border border-white/20 cursor-pointer flex flex-col pt-6 bg-slate-800 [transform:rotateY(180deg)]"
                                        >
                                            <div className="w-full h-12 bg-black/80 mt-2 shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]"></div>

                                            <div className="px-6 mt-6">
                                                <div className="flex gap-2 mb-4">
                                                    <div className="bg-white/90 h-10 w-3/4 rounded-sm flex items-center justify-end pr-4 text-black font-mono font-medium italic shadow-inner">
                                                        {showSensitive ? selectedCard.cvv : "***"}
                                                    </div>
                                                    <div className="w-1/4 h-10 bg-white/20 rounded-sm"></div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-white/70 mb-6">
                                                    <div>EXP: <span className="font-mono text-white ml-2">{showSensitive ? selectedCard.expiry_date : "**/**"}</span></div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShowSensitive(!showSensitive); }}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
                                                    >
                                                        {showSensitive ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        {showSensitive ? "Gizle" : "Göster"}
                                                    </button>
                                                </div>

                                                <div className="flex gap-2 flex-wrap">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(selectedCard.card_number); toast.success("Kopyalandı."); }}
                                                        className="text-[11px] font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-white transition-colors"
                                                    >
                                                        <Copy size={12} /> No Kopyala
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggleFreeze(); }}
                                                        className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${selectedCard.status === "active" ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"}`}
                                                    >
                                                        <ShieldCheck size={12} />
                                                        {selectedCard.status === "active" ? "Dondur" : "Aç"}
                                                    </button>
                                                    {selectedCard.is_virtual && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteVirtualCard(); }}
                                                            className="text-[11px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                                                        >
                                                            Kartı Sil
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center mt-4">
                                        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                                            <RefreshCw size={12} /> Detaylar için karta tıklayın
                                        </p>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                                    {cardTypeTab === "credit" ? (
                                        <>
                                            <MetricBox label="Kullanılabilir Limit" value={formatMoney(selectedCard.available_limit)} icon={<ShieldCheck size={16} />} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/20" />
                                            <MetricBox label="Güncel Borç" value={formatMoney(selectedCard.current_debt)} icon={<DollarSign size={16} />} colorClass="text-rose-400" bgClass="bg-rose-500/10" borderClass="border-rose-500/20" />
                                            <MetricBox label="Asgari Ödeme" value={formatMoney(selectedCard.min_payment_due)} icon={<CalendarDays size={16} />} colorClass="text-amber-400" bgClass="bg-amber-500/10" borderClass="border-amber-500/20" />
                                            <MetricBox label="Online Limit" value={formatMoney(selectedCard.online_limit)} icon={<Percent size={16} />} colorClass="text-blue-400" bgClass="bg-blue-500/10" borderClass="border-blue-500/20" />
                                        </>
                                    ) : (
                                        <>
                                            <MetricBox label="Bağlı Hesap Bakiyesi" value={formatMoney(linkedBalance)} icon={<ShieldCheck size={16} />} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/20" />
                                            <MetricBox label="Hesap Türü" value={selectedCard.account_type === "checking" ? "Vadesiz" : "Tasarruf"} icon={<Landmark size={16} />} colorClass="text-blue-400" bgClass="bg-blue-500/10" borderClass="border-blue-500/20" />
                                        </>
                                    )}
                                </div>

                                {/* Actions & Settings Tabs */}
                                {cardTypeTab === "credit" && (
                                    <div className="bg-deepblue-900/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl mt-6">
                                        <div className="flex border-b border-white/5 overflow-x-auto hide-scrollbar">
                                            <ActionButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} icon={<Activity size={16} />} label="Hareketler" />
                                            <ActionButton active={activeTab === "pay"} onClick={() => setActiveTab("pay")} icon={<DollarSign size={16} />} label="Borç Öde" />
                                            <ActionButton active={activeTab === "simulate"} onClick={() => setActiveTab("simulate")} icon={<ShoppingCart size={16} />} label="Harcama Test" />
                                            <ActionButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<ShieldCheck size={16} />} label="Ayarlar" />
                                        </div>

                                        <div className="p-6">
                                            <AnimatePresence mode="wait">
                                                {activeTab === "transactions" && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                        <div className="flex justify-between items-center mb-6">
                                                            <h3 className="text-lg font-bold text-white">Son İşlemler</h3>
                                                            <button onClick={() => loadTransactions(selectedCard.id || selectedCard.card_id)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                                                                <RefreshCw size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {transactions.length === 0 ? (
                                                                <p className="text-center text-white/40 py-8 bg-black/20 rounded-2xl border border-white/5">Henüz hareket bulunmuyor.</p>
                                                            ) : transactions.map((t) => {
                                                                const isPayment = t.type === "payment";
                                                                return (
                                                                    <div key={t.id || t.transaction_id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`p-3 rounded-xl ${isPayment ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                                                                {isPayment ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-bold text-white text-sm">{t.description || (isPayment ? "Kart ödemesi" : "Kart harcaması")}</p>
                                                                                <p className="text-xs text-white/50 mt-0.5">{new Date(t.created_at).toLocaleString("tr-TR")}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className={`font-black tracking-tight ${isPayment ? "text-emerald-400" : "text-rose-400"}`}>
                                                                            {isPayment ? "+" : "-"}{formatMoney(t.amount)}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {activeTab === "pay" && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                        <h3 className="text-lg font-bold text-white mb-2">Borç Öde</h3>
                                                        <p className="text-sm text-white/60 mb-6">Bağlı hesaplarınızdan biri ile kredi kartı borcunuzu ödeyin.</p>
                                                        <form onSubmit={handlePayDebt} className="space-y-5 max-w-md">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Ödeme Hesabı</label>
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 appearance-none"
                                                                        value={selectedAccount}
                                                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                                                        required
                                                                    >
                                                                        <option value="" className="bg-slate-800">Hesap seçin</option>
                                                                        {paymentAccounts.map((account) => (
                                                                            <option key={account.id} value={account.id} className="bg-slate-800">
                                                                                {account.account_number} - {formatMoney(account.balance)}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                                                        <ArrowDownRight size={16} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Tutar (₺)</label>
                                                                <input
                                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                                                    type="number" min="1" max={selectedCard.current_debt} step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required placeholder="0.00"
                                                                />
                                                                <div className="mt-2 text-xs text-white/40 flex justify-between">
                                                                    <span>Maks: {formatMoney(selectedCard.current_debt)}</span>
                                                                    <button type="button" onClick={() => setPayAmount(selectedCard.current_debt)} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Tamamını Öde</button>
                                                                </div>
                                                            </div>
                                                            <button type="submit" disabled={actionLoading || Number(selectedCard.current_debt) <= 0} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                                                {actionLoading ? <RefreshCw size={18} className="animate-spin" /> : <DollarSign size={18} />}
                                                                Borcu Öde
                                                            </button>
                                                        </form>
                                                    </motion.div>
                                                )}

                                                {activeTab === "simulate" && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                        <h3 className="text-lg font-bold text-white mb-2">Harcama Simülatörü</h3>
                                                        <p className="text-sm text-white/60 mb-6">Sistem testi için seçili karttan sanal harcama yapın.</p>
                                                        <form onSubmit={handlePurchase} className="space-y-5 max-w-md">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Harcama Tutarı (₺)</label>
                                                                <input
                                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50"
                                                                    type="number" min="1" max={selectedCard.available_limit} step="0.01" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} required placeholder="0.00"
                                                                />
                                                                <div className="mt-2 text-xs text-emerald-400/80">Kullanılabilir Limit: {formatMoney(selectedCard.available_limit)}</div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Açıklama / İşyeri</label>
                                                                <input
                                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50"
                                                                    value={purchaseDescription} onChange={(e) => setPurchaseDescription(e.target.value)} required placeholder="Örn: Steam, Amazon, Market"
                                                                />
                                                            </div>
                                                            <button type="submit" disabled={actionLoading || Number(selectedCard.available_limit) <= 0} className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                                                {actionLoading ? <RefreshCw size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                                                                Harcama Yap
                                                            </button>
                                                        </form>
                                                    </motion.div>
                                                )}

                                                {activeTab === "settings" && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                        <h3 className="text-lg font-bold text-white mb-6">Kart Kontrolleri</h3>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                                <div>
                                                                    <div className="font-bold text-white text-sm mb-1">İnternet Alışverişi</div>
                                                                    <div className="text-xs text-white/50">Yurtiçi ve yurtdışı e-ticaret siteleri</div>
                                                                </div>
                                                                <Switch active={selectedCard.internet_shopping} onClick={() => handleToggleSetting("internet_shopping", selectedCard.internet_shopping)} disabled={actionLoading} />
                                                            </div>
                                                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                                <div>
                                                                    <div className="font-bold text-white text-sm mb-1">Temassız İşlem</div>
                                                                    <div className="text-xs text-white/50">Fiziksel POS cihazları</div>
                                                                </div>
                                                                <Switch active={selectedCard.contactless} onClick={() => handleToggleSetting("contactless", selectedCard.contactless)} disabled={actionLoading || selectedCard.is_virtual} />
                                                            </div>

                                                            {!selectedCard.is_virtual && (
                                                                <div className="mt-8 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl relative overflow-hidden group">
                                                                    <div className="absolute inset-0 bg-blue-500/5 w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
                                                                    <h4 className="font-bold text-blue-400 mb-2 relative z-10">Limit Artırım Talebi</h4>
                                                                    <p className="text-xs text-white/70 mb-4 leading-relaxed relative z-10">Kredi kartı limitinizin yetersiz kaldığı durumlarda, gelir belgesi sunmadan anında değerlendirilecek limit artış talebinde bulunabilirsiniz.</p>
                                                                    <button onClick={handleApplyLimit} disabled={actionLoading} className="relative z-10 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                                                        <ArrowUpRight size={16} /> Talep Oluştur
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// Subcomponents

function MetricBox({ label, value, icon, colorClass, bgClass, borderClass }) {
    return (
        <div className={`p-4 rounded-2xl border bg-deepblue-900/60 backdrop-blur-sm shadow-lg ${borderClass}`}>
            <div className={`flex items-center gap-2 mb-2 ${colorClass}`}>
                <div className={`p-1.5 rounded-lg ${bgClass}`}>{icon}</div>
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-lg sm:text-xl font-black ${colorClass} tracking-tight`}>{value}</div>
        </div>
    );
}

function ActionButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap
            ${active ? "border-blue-500 text-white bg-blue-500/5" : "border-transparent text-white/50 hover:text-white hover:bg-white/5"}`}
        >
            {icon} {label}
        </button>
    );
}

function Switch({ active, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${active ? 'bg-emerald-500' : 'bg-white/20'}`}
        >
            <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value || 0));
}

function formatCardNumber(value) {
    if (!value) return "";
    return value.replace(/(\d{4})/g, "$1 ").trim();
}

function maskCardNumber(value) {
    if (!value || value.length < 8) return value || "";
    return `${value.slice(0, 4)} **** **** ${value.slice(-4)}`;
}

function WifiIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 opacity-80">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
    )
}
