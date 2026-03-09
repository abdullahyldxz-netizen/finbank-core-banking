import { useState, useEffect, useCallback } from "react";
import { Target, Plus, Trash2, ArrowRight, Loader2, Calendar, TrendingUp } from "lucide-react";
import { goalsApi, accountApi } from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function SavingsGoalsPage() {
    const [goals, setGoals] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: "", target_amount: "", deadline: "" });
    const [contributeForm, setContributeForm] = useState({ goal_id: null, account_id: "", amount: "" });
    const [processing, setProcessing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [goalsRes, accRes] = await Promise.all([goalsApi.list(), accountApi.listMine()]);
            setGoals(goalsRes.data);
            setAccounts(accRes.data.filter((a) => a.status === "active"));
        } catch {
            toast.error("Veriler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name || !form.target_amount) return toast.error("İsim ve hedef tutar gerekli.");
        setProcessing(true);
        try {
            await goalsApi.create({ ...form, target_amount: parseFloat(form.target_amount) });
            toast.success("Hedef başarıyla oluşturuldu! 🎯");
            setForm({ name: "", target_amount: "", deadline: "" });
            setShowCreate(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Hedef oluşturulurken hata oluştu.");
        } finally {
            setProcessing(false);
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!contributeForm.account_id || !contributeForm.amount) return toast.error("Hesap ve tutar seçin.");

        const account = accounts.find(a => a.account_id === contributeForm.account_id);
        if (account && parseFloat(contributeForm.amount) > account.balance) {
            return toast.error("Seçili hesapta yeterli bakiye yok.");
        }

        setProcessing(true);
        try {
            await goalsApi.contribute(contributeForm.goal_id, {
                account_id: contributeForm.account_id,
                amount: parseFloat(contributeForm.amount),
            });
            toast.success("Hedefe başarıyla para eklendi! 💰");
            setContributeForm({ goal_id: null, account_id: "", amount: "" });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Para aktarılırken hata oluştu.");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu hedefi silmek istediğinize emin misiniz?")) return;
        try {
            await goalsApi.delete(id);
            toast.success("Hedef silindi.");
            fetchData();
        } catch {
            toast.error("Silinemedi.");
        }
    };

    const fmt = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0);

    const calculateDaysLeft = (deadline) => {
        if (!deadline) return null;
        const diff = new Date(deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days > 0 ? days : 0;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                            <Target size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Tasarruf Hedefleri</h1>
                            <p className="text-white/60 text-sm md:text-base">Hayalleriniz için birikim yapmaya başlayın.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Yeni Hedef
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {/* Create Form */}
                {showCreate && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        onSubmit={handleCreate}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-5 overflow-hidden"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Yeni Birikim Hedefi</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 ml-1">Hedef Adı</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Örn: Yaz Tatili, Yeni Araba"
                                    className="w-full bg-deepblue-950/50 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 ml-1">Hedef Tutar (₺)</label>
                                <input
                                    type="number"
                                    value={form.target_amount}
                                    onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-deepblue-950/50 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 ml-1">Son Tarih (İsteğe bağlı)</label>
                                <input
                                    type="date"
                                    value={form.deadline}
                                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                    className="w-full bg-deepblue-950/50 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
                            >
                                {processing ? <Loader2 size={18} className="animate-spin" /> : <Target size={18} />}
                                Hedefi Oluştur
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Goals List */}
            {goals.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl text-center min-h-[400px]"
                >
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Target size={48} className="text-white/20" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Hedef Belirleyin</h3>
                    <p className="text-white/50 mb-8 max-w-sm">Tasarruf yapmaya başlamak için ilk hedefinizi oluşturun.</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
                    >
                        <Plus size={20} /> İlk Hedefini Oluştur
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map((g, idx) => {
                        const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                        const isComplete = g.status === "completed" || pct === 100;
                        const daysLeft = calculateDaysLeft(g.deadline);

                        return (
                            <motion.div
                                key={g.goal_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-6 transition-all relative overflow-hidden ${isComplete
                                        ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                        : "border-white/10 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                                    }`}
                            >
                                {isComplete && (
                                    <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {isComplete ? (
                                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                                    <Target size={16} />
                                                </span>
                                            ) : (
                                                <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                                                    <Target size={16} />
                                                </span>
                                            )}
                                            <h3 className="text-xl font-bold text-white">{g.name}</h3>
                                        </div>
                                        {g.deadline && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-white/50 ml-10">
                                                <Calendar size={12} />
                                                <span>{new Date(g.deadline).toLocaleDateString('tr-TR')}</span>
                                                {!isComplete && daysLeft !== null && (
                                                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${daysLeft < 7 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'
                                                        }`}>
                                                        {daysLeft === 0 ? "Bugün Son" : `${daysLeft} gün kaldı`}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(g.goal_id)}
                                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                                            title="Hedefi Sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm font-medium text-white/50 mb-1">Biriken Tutar</p>
                                            <div className="text-2xl font-bold text-white flex items-baseline gap-2">
                                                {fmt(g.current_amount)}
                                                <span className="text-sm font-medium text-white/40">/ {fmt(g.target_amount)}</span>
                                            </div>
                                        </div>
                                        <div className={`text-3xl font-black ${isComplete ? "text-emerald-400" : "text-amber-500"}`}>
                                            {pct}%
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-3 rounded-full bg-deepblue-950/80 overflow-hidden border border-white/5 relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full rounded-full relative overflow-hidden ${isComplete
                                                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                                    : "bg-gradient-to-r from-amber-500 to-orange-400"
                                                }`}
                                        >
                                            <div className="absolute top-0 bottom-0 left-0 right-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]" />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Actions or Form */}
                                {!isComplete && (
                                    <>
                                        {contributeForm.goal_id !== g.goal_id ? (
                                            <button
                                                onClick={() => setContributeForm({ ...contributeForm, goal_id: g.goal_id, account_id: "", amount: "" })}
                                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <TrendingUp size={18} className="text-amber-400" /> Para Ekle
                                            </button>
                                        ) : (
                                            <motion.form
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                onSubmit={handleContribute}
                                                className="bg-deepblue-950/40 rounded-2xl p-4 border border-white/5 space-y-3"
                                            >
                                                <select
                                                    value={contributeForm.account_id}
                                                    onChange={(e) => setContributeForm({ ...contributeForm, account_id: e.target.value })}
                                                    className="w-full bg-deepblue-950/80 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-white outline-none text-sm"
                                                    required
                                                >
                                                    <option value="">Kaynak hesap seçin</option>
                                                    {accounts.map((a) => (
                                                        <option key={a.account_id} value={a.account_id}>
                                                            {a.account_number} (Bakiye: {fmt(a.balance)})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={contributeForm.amount}
                                                        onChange={(e) => setContributeForm({ ...contributeForm, amount: e.target.value })}
                                                        placeholder="Tutar (₺)"
                                                        className="flex-1 bg-deepblue-950/80 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-white outline-none text-sm [&::-webkit-inner-spin-button]:appearance-none"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setContributeForm({ ...contributeForm, goal_id: null })}
                                                        className="px-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm transition-colors border border-white/10"
                                                    >
                                                        İptal
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center"
                                                    >
                                                        {processing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={18} />}
                                                    </button>
                                                </div>
                                            </motion.form>
                                        )}
                                    </>
                                )}
                                {isComplete && (
                                    <div className="w-full py-3 bg-emerald-500/10 text-emerald-400 font-bold text-center rounded-xl border border-emerald-500/20">
                                        Tebrikler! Hedefe Ulaşıldı 🎉
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes progress-stripes {
                    0% { background-position: 1rem 0; }
                    100% { background-position: 0 0; }
                }
            `}</style>
        </div>
    );
}
