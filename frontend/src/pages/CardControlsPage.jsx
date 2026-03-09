import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    CreditCard,
    Eye,
    EyeOff,
    Globe2,
    Lock,
    Shield,
    Smartphone,
    Trash2,
    Unlock,
    Wifi,
    Loader2
} from "lucide-react";
import { accountApi, cardApi, cardsApi } from "../services/api";
import { motion } from "framer-motion";

export default function CardControlsPage() {
    const [accounts, setAccounts] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [showIban, setShowIban] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [accountsRes, cardsRes] = await Promise.all([
                accountApi.listMine(),
                cardsApi.getMyCards(),
            ]);
            setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : []);
            setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
        } catch (error) {
            toast.error("Kontrol ekranları yüklenemedi.");
            setAccounts([]);
            setCards([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleAccountFreeze = async (accountId) => {
        setBusyKey(`account-${accountId}`);
        try {
            const res = await cardApi.toggleFreeze(accountId);
            toast.success(res.data.message || "Hesap durumu güncellendi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Hesap durumu güncellenemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const updateCardSetting = async (card, updates) => {
        const cardId = card.id || card.card_id;
        setBusyKey(`card-${cardId}`);
        try {
            await cardsApi.updateSettings(cardId, updates);
            toast.success("Kart ayarları güncellendi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Kart ayarı güncellenemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const toggleCardFreeze = async (card) => {
        const cardId = card.id || card.card_id;
        setBusyKey(`card-freeze-${cardId}`);
        try {
            const res = await cardsApi.toggleFreeze(cardId);
            toast.success(res.data.message || "Kart durumu güncellendi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Kart durumu güncellenemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const deleteVirtualCard = async (card) => {
        const cardId = card.id || card.card_id;
        if (!window.confirm("Bu sanal kart silinsin mi? (Bu işlem geri alınamaz)")) return;
        setBusyKey(`card-delete-${cardId}`);
        try {
            await cardsApi.deleteCard(cardId);
            toast.success("Sanal kart silindi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Sanal kart silinemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const toggleIban = (accountId) => {
        setShowIban((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Kart ve Hesap Kontrolleri</h1>
                    <p className="text-white/60 text-lg">
                        Hesaplarınızı güvene alın, kartlarınızın e-ticaret ve temassız ayarlarını dilediğiniz gibi yönetin.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sol Kolon: Hesap Kontrolleri */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Shield size={20} className="text-amber-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Hesap Kontrolleri</h2>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            {accounts.length === 0 ? (
                                <EmptyState message="Henüz hesabınız bulunmuyor." />
                            ) : accounts.map((account) => {
                                const accountId = account.id || account.account_id;
                                const isFrozen = account.status === "frozen";
                                const isBusy = busyKey === `account-${accountId}`;
                                return (
                                    <div key={accountId} className="group bg-deepblue-950/40 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="font-bold text-white text-lg tracking-tight">{account.account_number}</div>
                                            <div className="text-sm text-white/50 mt-1 flex items-center gap-2">
                                                <span className="capitalize">{account.account_type}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                                <span className="font-medium text-white/70">{account.currency}</span>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg w-fit">
                                                <span className="text-xs font-mono text-white/60 select-all tracking-wider">
                                                    {showIban[accountId] ? account.iban : maskIban(account.iban)}
                                                </span>
                                                <button
                                                    onClick={() => toggleIban(accountId)}
                                                    className="text-white/40 hover:text-white transition-colors p-1"
                                                    title={showIban[accountId] ? "Gizle" : "Görüntüle"}
                                                >
                                                    {showIban[accountId] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleAccountFreeze(accountId)}
                                                disabled={isBusy}
                                                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${isFrozen
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25 text-white'
                                                        : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-500/25 text-white'
                                                    }`}
                                            >
                                                {isBusy ? <Loader2 size={16} className="animate-spin" /> : (isFrozen ? <Unlock size={16} /> : <Lock size={16} />)}
                                                {isFrozen ? "Hesabı Aktifleştir" : "Hesabı Dondur"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Sağ Kolon: Kart Kontrolleri & Güvenlik Tavsiyesi */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                <CreditCard size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Kart Ayarları</h2>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            {cards.length === 0 ? (
                                <EmptyState message="Henüz kartınız bulunmuyor." />
                            ) : cards.map((card) => {
                                const cardId = card.id || card.card_id;
                                const isFrozen = card.status !== "active";
                                const isBusy = busyKey && busyKey !== `card-${cardId}` && busyKey.startsWith('card'); // Başka bir kart işlemdeyken disable edilebilir, ama şimdilik sadece ilgili butonu disable edelim.

                                return (
                                    <div key={cardId} className="group bg-deepblue-950/40 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-white text-lg">
                                                        {card.card_name || (card.is_virtual ? "Sanal Kart" : "Fiziksel Kart")}
                                                    </h3>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${card.is_virtual ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                        }`}>
                                                        {card.is_virtual ? "Sanal" : "Fiziksel"}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-mono text-white/50 tracking-widest">{maskCardNumber(card.card_number)}</div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCardFreeze(card)}
                                                    disabled={busyKey === `card-freeze-${cardId}`}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${isFrozen
                                                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                            : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                                        }`}
                                                >
                                                    {busyKey === `card-freeze-${cardId}` ? <Loader2 size={14} className="animate-spin" /> : (isFrozen ? <Unlock size={14} /> : <Lock size={14} />)}
                                                    {isFrozen ? "Aktifleştir" : "Dondur"}
                                                </button>

                                                {card.is_virtual && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteVirtualCard(card)}
                                                        disabled={busyKey === `card-delete-${cardId}`}
                                                        className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        {busyKey === `card-delete-${cardId}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                        Sil
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                                            <ToggleButton
                                                label="İnternet Alışverişi"
                                                icon={<Globe2 size={14} />}
                                                active={card.internet_enabled}
                                                onClick={() => updateCardSetting(card, { internet_enabled: !card.internet_enabled })}
                                                disabled={busyKey === `card-${cardId}`}
                                            />
                                            <ToggleButton
                                                label="Temassız Ödeme"
                                                icon={<Wifi size={14} />}
                                                active={card.contactless_enabled}
                                                onClick={() => updateCardSetting(card, { contactless_enabled: !card.contactless_enabled })}
                                                disabled={busyKey === `card-${cardId}`}
                                            />
                                            <ToggleButton
                                                label="Yurtdışı Kullanımı"
                                                icon={<Globe2 size={14} />}
                                                active={card.overseas_enabled}
                                                onClick={() => updateCardSetting(card, { overseas_enabled: !card.overseas_enabled })}
                                                disabled={busyKey === `card-${cardId}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 text-indigo-500/20">
                            <Shield size={100} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                    <Smartphone size={18} />
                                </div>
                                <h2 className="text-lg font-bold text-white">Güvenlik İpucu</h2>
                            </div>
                            <p className="text-indigo-200/70 text-[13px] leading-relaxed pr-8">
                                Sanal kartlarınızı yalnızca e-ticaret sitelerinde ödeme yapacağınız zaman açık tutmanızı öneririz. Şüpheli bir işlemle karşılaştığınızda saniyeler içinde kartınızı dondurabilir veya sanal kartınızı tamamen silerek kendinizi koruyabilirsiniz.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function ToggleButton({ label, icon, active, onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${active
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            {disabled ? <Loader2 size={14} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}

function EmptyState({ message }) {
    return (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center bg-white/5">
            <CreditCard size={32} className="text-white/20 mb-3" />
            <p className="text-white/50 font-medium">{message}</p>
        </div>
    );
}

function maskCardNumber(value) {
    if (!value || value.length < 8) return value || "";
    return `${value.slice(0, 4)} •••• •••• ${value.slice(-4)}`;
}

function maskIban(value) {
    if (!value || value.length < 8) return value || "";
    return `${value.slice(0, 4)} •••• •••• •••• ${value.slice(-4)}`;
}
