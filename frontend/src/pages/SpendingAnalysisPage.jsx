import { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingDown, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { analyticsApi } from "../services/api";
import { motion } from "framer-motion";

const CATEGORY_LABELS = {
    WITHDRAWAL: "Para Çekme",
    TRANSFER_OUT: "Transfer (Giden)",
    DEPOSIT: "Para Yatırma",
    TRANSFER_IN: "Transfer (Gelen)",
};

const CATEGORY_COLORS = {
    WITHDRAWAL: "from-rose-500 to-red-600",
    TRANSFER_OUT: "from-amber-400 to-orange-500",
    DEPOSIT: "from-emerald-400 to-green-500",
    TRANSFER_IN: "from-blue-400 to-indigo-500",
};

const CATEGORY_TEXT_COLORS = {
    WITHDRAWAL: "text-rose-400",
    TRANSFER_OUT: "text-amber-400",
    DEPOSIT: "text-emerald-400",
    TRANSFER_IN: "text-blue-400",
};

export default function SpendingAnalysisPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await analyticsApi.spendingAnalysis();
                setData(res.data);
            } catch { /* fail silently */ }
            setLoading(false);
        };
        fetch();
    }, []);

    const fmt = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-purple-500" />
            </div>
        );
    }

    const totalSpent = data?.by_category?.reduce((s, c) => s + c.total, 0) || 0;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Harcama Analizi</h1>
                        <p className="text-white/60 text-sm md:text-base">Finansal hareketlerinizi detaylı inceleyin.</p>
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <SummaryCard
                    icon={<TrendingDown size={24} />}
                    label="Toplam Harcama (Son 30 gün)"
                    value={fmt(totalSpent)}
                    colorClass="text-rose-400"
                    bgClass="bg-rose-500/10 border-rose-500/20"
                    delay={0.1}
                />
                <SummaryCard
                    icon={<Activity size={24} />}
                    label="Toplam İşlem Sayısı"
                    value={data?.by_category?.reduce((s, c) => s + c.count, 0) || 0}
                    colorClass="text-indigo-400"
                    bgClass="bg-indigo-500/10 border-indigo-500/20"
                    delay={0.2}
                />
                <SummaryCard
                    icon={<PieChart size={24} />}
                    label="Farklı Kategori"
                    value={data?.by_category?.length || 0}
                    colorClass="text-emerald-400"
                    bgClass="bg-emerald-500/10 border-emerald-500/20"
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Category Breakdown */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-5 bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col h-full"
                >
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-purple-400" />
                        Kategorilere Göre Dağılım
                    </h2>

                    {(!data?.by_category || data.by_category.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <PieChart size={48} className="text-white/10 mb-4" />
                            <p className="text-white/50 text-sm">Harcama verisi bulunamadı.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {data.by_category.sort((a, b) => b.total - a.total).map((c, idx) => {
                                const pct = totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0;
                                const gradient = CATEGORY_COLORS[c.category] || "from-purple-400 to-indigo-500";
                                const textColor = CATEGORY_TEXT_COLORS[c.category] || "text-purple-400";

                                return (
                                    <div key={c.category} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <div className="text-sm font-semibold text-white mb-0.5">{CATEGORY_LABELS[c.category] || c.category}</div>
                                                <div className="text-xs font-medium text-white/40">{c.count} işlem</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${textColor}`}>{fmt(c.total)}</div>
                                                <div className="text-xs font-bold text-white/60">{pct}%</div>
                                            </div>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-deepblue-950/80 overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "easeOut" }}
                                                className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Daily Trends */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-7 bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col h-full"
                >
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-blue-400" />
                        Günlük Hareketler
                    </h2>

                    {(!data?.daily || data.daily.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <Activity size={48} className="text-white/10 mb-4" />
                            <p className="text-white/50 text-sm">Günlük hareket verisi bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="pb-4 font-semibold text-white/50 text-xs uppercase tracking-wider border-b border-white/10 pl-2">Tarih</th>
                                        <th className="pb-4 font-semibold text-white/50 text-xs uppercase tracking-wider border-b border-white/10 px-4">Tür</th>
                                        <th className="pb-4 font-semibold text-white/50 text-xs uppercase tracking-wider border-b border-white/10 text-right pr-2">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.daily.map((d, i) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 + (i * 0.05) }}
                                            key={i}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-4 border-b border-white/5 text-sm font-medium text-white/80 whitespace-nowrap pl-2">
                                                {new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 border-b border-white/5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${d.type === "CREDIT"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    }`}>
                                                    {d.type === "CREDIT" ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                                                    {d.type === "CREDIT" ? "GELEN" : "GİDEN"}
                                                </span>
                                            </td>
                                            <td className={`py-4 border-b border-white/5 text-right font-bold text-sm whitespace-nowrap pr-2 ${d.type === "CREDIT" ? "text-emerald-400" : "text-rose-400"
                                                }`}>
                                                {d.type === "CREDIT" ? "+" : "-"}{fmt(d.total)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

function SummaryCard({ icon, label, value, colorClass, bgClass, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 flex items-center gap-5 hover:bg-white/10 transition-colors"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${bgClass} ${colorClass}`}>
                {icon}
            </div>
            <div>
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">{label}</div>
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
            </div>
        </motion.div>
    );
}
