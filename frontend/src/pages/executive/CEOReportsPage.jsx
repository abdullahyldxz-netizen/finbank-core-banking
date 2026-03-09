import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users, Activity, BarChart3, DollarSign, FileText, Loader2 } from "lucide-react";
import { analyticsApi } from "../../services/api";

export default function CEOReportsPage() {
    const [report, setReport] = useState(null);
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const [reportRes, overviewRes] = await Promise.all([
                    analyticsApi.monthlyReport({ year: selectedYear, month: selectedMonth }),
                    analyticsApi.overview(),
                ]);
                setReport(reportRes.data);
                setOverview(overviewRes.data);
            } catch { /* */ }
            setLoading(false);
        };
        fetch();
    }, [selectedMonth, selectedYear]);

    const fmt = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0);
    const fmtN = (n) => new Intl.NumberFormat("tr-TR").format(n || 0);

    if (loading) return (
        <div className="flex justify-center items-center p-20">
            <Loader2 size={40} className="animate-spin text-amber-500" />
        </div>
    );

    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-20 space-y-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <FileText size={32} className="text-amber-400" /> CEO Raporları
            </h1>

            {/* Period Selector */}
            <div className="flex flex-wrap gap-4 bg-deepblue-900/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-black/30 text-white border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none font-medium cursor-pointer"
                >
                    {months.map((m, i) => <option className="bg-deepblue-900 text-white" key={i} value={i + 1}>{m}</option>)}
                </select>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-black/30 text-white border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none font-medium cursor-pointer"
                >
                    {[2024, 2025, 2026].map((y) => <option className="bg-deepblue-900 text-white" key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Overview Stats */}
            {overview && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {[
                        { label: "Toplam Kullanıcı", val: fmtN(overview.total_users), icon: <Users size={24} />, colorClass: "text-indigo-400", bgClass: "bg-indigo-500/20", borderClass: "border-indigo-500/20" },
                        { label: "Aktif Kullanıcı", val: fmtN(overview.active_users), icon: <Activity size={24} />, colorClass: "text-emerald-400", bgClass: "bg-emerald-500/20", borderClass: "border-emerald-500/20" },
                        { label: "Toplam Hesap", val: fmtN(overview.total_accounts), icon: <DollarSign size={24} />, colorClass: "text-blue-400", bgClass: "bg-blue-500/20", borderClass: "border-blue-500/20" },
                        { label: "Toplam İşlem", val: fmtN(overview.total_transactions), icon: <BarChart3 size={24} />, colorClass: "text-amber-400", bgClass: "bg-amber-500/20", borderClass: "border-amber-500/20" },
                    ].map((s, i) => (
                        <div key={i} className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${s.bgClass} ${s.colorClass} ${s.borderClass} group-hover:scale-110 transition-transform duration-300`}>
                                {s.icon}
                            </div>
                            <div className="text-xs font-semibold tracking-wider uppercase text-white/50 mb-1">{s.label}</div>
                            <div className="text-2xl font-black text-white">{s.val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Monthly Report */}
            {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Deposits */}
                    <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-semibold tracking-wider text-white/50 uppercase">Toplam Yatırım</div>
                                <div className="text-xl font-bold text-emerald-400">{fmt(report.total_deposits)}</div>
                            </div>
                        </div>
                        <div className="text-sm font-medium text-white/40">{fmtN(report.deposit_count)} işlem</div>
                    </div>

                    {/* Withdrawals */}
                    <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                                <TrendingDown size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-semibold tracking-wider text-white/50 uppercase">Toplam Çekim</div>
                                <div className="text-xl font-bold text-rose-400">{fmt(report.total_withdrawals)}</div>
                            </div>
                        </div>
                        <div className="text-sm font-medium text-white/40">{fmtN(report.withdrawal_count)} işlem</div>
                    </div>

                    {/* Net Flow */}
                    <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-semibold tracking-wider text-white/50 uppercase">Net Akış</div>
                                <div className={`text-xl font-bold ${report.net_flow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {report.net_flow >= 0 ? "+" : ""}{fmt(report.net_flow)}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm font-medium text-white/40">
                            {months[selectedMonth - 1]} {selectedYear}
                        </div>
                    </div>

                    {/* Growth */}
                    <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-xl rounded-3xl p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 blur-sm pointer-events-none">
                            <TrendingUp size={140} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center gap-2">
                            📈 Büyüme
                        </h3>
                        <div className="flex flex-col gap-3 relative z-10">
                            <div className="flex justify-between items-center bg-black/20 rounded-xl p-3 border border-white/5">
                                <span className="text-sm font-medium text-white/60">Yeni Kullanıcılar</span>
                                <span className="font-bold text-emerald-400">+{fmtN(report.new_users)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-black/20 rounded-xl p-3 border border-white/5">
                                <span className="text-sm font-medium text-white/60">Yeni Hesaplar</span>
                                <span className="font-bold text-blue-400">+{fmtN(report.new_accounts)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
