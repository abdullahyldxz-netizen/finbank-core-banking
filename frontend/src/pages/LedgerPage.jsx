import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Users, Plus, X, Check, RefreshCw, HandCoins, ArrowDownRight, ArrowUpRight, Receipt, CreditCard, Target } from "lucide-react";
import { ledgerApi, paymentRequestsApi } from "../services/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_LABELS = {
    DEPOSIT: "Para Yatırma",
    WITHDRAWAL: "Para Çekme",
    TRANSFER_IN: "Gelen Transfer",
    TRANSFER_OUT: "Giden Transfer",
    BILL_PAYMENT: "Fatura Ödeme",
    CARD_PAYMENT: "Kart Ödemesi",
    GOAL_CONTRIBUTION: "Hedef Birikim",
};

const CATEGORY_ICONS = {
    DEPOSIT: <ArrowDownRight size={24} className="text-emerald-400" />,
    WITHDRAWAL: <ArrowUpRight size={24} className="text-rose-400" />,
    TRANSFER_IN: <ArrowDownRight size={24} className="text-emerald-400" />,
    TRANSFER_OUT: <ArrowUpRight size={24} className="text-rose-400" />,
    BILL_PAYMENT: <Receipt size={24} className="text-blue-400" />,
    CARD_PAYMENT: <CreditCard size={24} className="text-purple-400" />,
    GOAL_CONTRIBUTION: <Target size={24} className="text-teal-400" />,
};

export default function LedgerPage() {
    const [entries, setEntries] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [skip, setSkip] = useState(0);
    const limit = 20;

    // Split Bill State
    const [splitModal, setSplitModal] = useState({ show: false, entry: null });
    const [splitTargets, setSplitTargets] = useState([{ alias: "", amount: "" }]);
    const [splitLoading, setSplitLoading] = useState(false);

    useEffect(() => {
        loadEntries();
    }, [skip]);

    const loadEntries = async () => {
        setLoading(true);
        try {
            const res = await ledgerApi.getEntries({ skip, limit });
            setEntries(Array.isArray(res.data?.entries) ? res.data.entries : []);
            setTotal(Number(res.data?.total || 0));
        } catch (error) {
            setEntries([]);
            setTotal(0);
            toast.error("Hesap hareketleri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleSplitSubmit = async (e) => {
        e.preventDefault();
        const validTargets = splitTargets.filter(t => t.alias && Number(t.amount) > 0);

        if (validTargets.length === 0) {
            toast.error("Lütfen en az bir kişi ve geçerli bir tutar girin.");
            return;
        }

        setSplitLoading(true);
        try {
            const promises = validTargets.map(t =>
                paymentRequestsApi.create({
                    target_alias: t.alias,
                    amount: Number(t.amount),
                    description: `Hesap Bölüştürme: ${splitModal.entry.description || CATEGORY_LABELS[splitModal.entry.category]}`
                })
            );

            await Promise.all(promises);
            toast.success("Hesap bölüştürme istekleri gönderildi.");
            setSplitModal({ show: false, entry: null });
            setSplitTargets([{ alias: "", amount: "" }]);
        } catch (error) {
            toast.error("İstek gönderilirken hata oluştu. Bazı kişiler bulunamamış olabilir.");
        } finally {
            setSplitLoading(false);
        }
    };

    const addSplitTarget = () => {
        setSplitTargets([...splitTargets, { alias: "", amount: "" }]);
    };

    const removeSplitTarget = (index) => {
        const newTargets = [...splitTargets];
        newTargets.splice(index, 1);
        setSplitTargets(newTargets.length ? newTargets : [{ alias: "", amount: "" }]);
    };

    const splitEqually = () => {
        if (!splitModal.entry) return;
        const totalAmount = Number(splitModal.entry.amount);
        const count = splitTargets.length + 1; // +1 for the current user
        const equalAmount = (totalAmount / count).toFixed(2);

        const newTargets = splitTargets.map(t => ({ ...t, amount: equalAmount }));
        setSplitTargets(newTargets);
    };

    if (loading && entries.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Hesap Defteri</h1>
                    <p className="text-white/60 text-sm md:text-base">
                        Tüm finansal hareketlerinizin detaylı kaydı. Toplam {total} işlem listeleniyor.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md">
                    <BookOpen className="text-blue-400" size={24} />
                    <div>
                        <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Kayıtlar</div>
                        <div className="text-white font-bold leading-none">{total} Adet</div>
                    </div>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="bg-black/20 border border-white/5 rounded-3xl p-12 text-center max-w-lg mx-auto">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={48} className="text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Henüz Kayıt Yok</h3>
                    <p className="text-white/60 mb-8">Hesabınızda henüz herhangi bir finansal işlem gerçekleşmedi.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {entries.map((entry, index) => {
                            const isCredit = entry.type === "CREDIT";
                            return (
                                <motion.div
                                    key={entry.id || entry.entry_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-white/20 transition-all group"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110
                                        ${isCredit ? "bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]"}
                                    `}>
                                        {CATEGORY_ICONS[entry.category] || <HandCoins size={24} className="text-white/60" />}
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="text-lg font-bold text-white mb-1">
                                            {CATEGORY_LABELS[entry.category] || entry.category || "Finansal İşlem"}
                                        </div>
                                        <div className="text-xs font-semibold text-white/50 mb-2">
                                            {new Date(entry.created_at).toLocaleString("tr-TR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                        {entry.description && (
                                            <div className="text-sm text-white/70 italic bg-white/5 px-3 py-2 rounded-xl inline-block">
                                                {entry.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-4 md:mt-0 gap-2">
                                        <div className={`text-xl md:text-2xl font-black drop-shadow-md whitespace-nowrap
                                            ${isCredit ? "text-emerald-400" : "text-rose-400"}
                                        `}>
                                            {isCredit ? "+" : "-"}
                                            {Number(entry.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                                        </div>

                                        {!isCredit && (
                                            <button
                                                onClick={() => {
                                                    setSplitModal({ show: true, entry });
                                                    setSplitTargets([{ alias: "", amount: "" }]);
                                                }}
                                                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
                                            >
                                                <Users size={14} /> Bölüştür
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center pt-8 mt-8 border-t border-white/10">
                        <button
                            className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-2xl transition-all border border-white/10 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => setSkip(Math.max(0, skip - limit))}
                            disabled={skip === 0}
                        >
                            <ChevronLeft size={20} /> Önceki
                        </button>
                        <span className="text-sm font-bold text-white/50 bg-black/30 border border-white/10 px-5 py-2 rounded-full">
                            {skip + 1} - {Math.min(skip + limit, total)} / {total}
                        </span>
                        <button
                            className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-2xl transition-all border border-white/10 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => setSkip(skip + limit)}
                            disabled={skip + limit >= total}
                        >
                            Sonraki <ChevronRight size={20} />
                        </button>
                    </div>
                </>
            )}

            {/* Split Bill Modal */}
            <AnimatePresence>
                {splitModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSplitModal({ show: false, entry: null })}
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-deepblue-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Users size={20} className="text-blue-400" />
                                    </div>
                                    Hesabı Bölüştür
                                </h2>
                                <button
                                    onClick={() => setSplitModal({ show: false, entry: null })}
                                    className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-black/30 border border-white/5 p-5 rounded-2xl mb-6">
                                <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Toplam Tutar</div>
                                <div className="text-3xl font-black text-white my-1">
                                    {Number(splitModal.entry.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                                </div>
                                <div className="text-sm font-semibold text-white/60">
                                    {splitModal.entry.description || CATEGORY_LABELS[splitModal.entry.category]}
                                </div>
                            </div>

                            <form onSubmit={handleSplitSubmit} className="space-y-4">
                                <div className="flex justify-between items-end pb-2 border-b border-white/5">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Kişiler</label>
                                    <button
                                        type="button"
                                        onClick={splitEqually}
                                        className="text-blue-400 hover:text-blue-300 font-bold text-sm bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Eşit Böl (%{(100 / (splitTargets.length + 1)).toFixed(0)})
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {splitTargets.map((target, index) => (
                                        <div key={index} className="flex gap-3 items-start relative group">
                                            <div className="flex-1">
                                                <input
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 font-semibold transition-colors"
                                                    placeholder="E-Posta (TC vs.)"
                                                    value={target.alias}
                                                    onChange={e => {
                                                        const newTargets = [...splitTargets];
                                                        newTargets[index].alias = e.target.value;
                                                        setSplitTargets(newTargets);
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div className="w-32">
                                                <div className="relative">
                                                    <input
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 pr-8 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-right font-mono transition-colors"
                                                        type="number" min="0.01" step="0.01"
                                                        placeholder="0.00"
                                                        value={target.amount}
                                                        onChange={e => {
                                                            const newTargets = [...splitTargets];
                                                            newTargets[index].amount = e.target.value;
                                                            setSplitTargets(newTargets);
                                                        }}
                                                        required
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">₺</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSplitTarget(index)}
                                                className="w-12 h-[50px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 transition-colors flex-shrink-0"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addSplitTarget}
                                    className="w-full bg-transparent border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 text-white/70 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
                                >
                                    <Plus size={18} /> Kişi Ekle
                                </button>

                                <button
                                    type="submit"
                                    disabled={splitLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-6"
                                >
                                    {splitLoading ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <Check size={20} />
                                    )}
                                    İstekleri Gönder
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
