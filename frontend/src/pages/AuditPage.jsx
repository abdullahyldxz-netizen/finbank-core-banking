import { useState, useEffect } from "react";
import { auditApi } from "../services/api";
import { Shield, ChevronLeft, ChevronRight, Filter, Activity, Server, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function AuditPage() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [skip, setSkip] = useState(0);
    const [actionFilter, setActionFilter] = useState("");
    const [outcomeFilter, setOutcomeFilter] = useState("");
    const limit = 20;

    useEffect(() => {
        loadLogs();
    }, [skip, actionFilter, outcomeFilter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = { skip, limit };
            if (actionFilter) params.action = actionFilter;
            if (outcomeFilter) params.outcome = outcomeFilter;
            const res = await auditApi.getLogs(params);
            setLogs(res.data.logs);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const actionLabels = {
        LOGIN_SUCCESS: "Giriş Başarılı",
        LOGIN_FAILED: "Giriş Başarısız",
        REGISTER: "Kayıt",
        CUSTOMER_CREATED: "Müşteri Oluşturma",
        CUSTOMER_UPDATED: "Müşteri Güncelleme",
        ACCOUNT_CREATED: "Hesap Açma",
        DEPOSIT_EXECUTED: "Para Yatırma",
        WITHDRAWAL_EXECUTED: "Para Çekme",
        TRANSFER_EXECUTED: "Transfer",
        TRANSFER_FAILED: "Transfer Başarısız",
        KYC_STATUS_UPDATED: "KYC Güncelleme",
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-32 space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2"
            >
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <Shield size={28} />
                        </div>
                        Denetim Kayıtları
                    </h1>
                    <p className="text-white/60 mt-1 flex items-center gap-2">
                        <Server size={14} /> Tüm sistem eylemlerinin güvenlik izi
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md flex items-center gap-3">
                    <Activity size={18} className="text-blue-400" />
                    <span className="text-sm font-bold text-white/80">Toplam Kayıt: <span className="text-white">{total}</span></span>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-wrap gap-4 items-center"
            >
                <div className="flex items-center gap-2 text-white/50 px-2 font-bold uppercase text-xs tracking-wider">
                    <Filter size={16} /> Filtreler
                </div>
                <select
                    className="bg-black/30 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[200px]"
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setSkip(0); }}
                >
                    <option value="">Tüm Eylemler</option>
                    {Object.entries(actionLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select
                    className="bg-black/30 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[150px]"
                    value={outcomeFilter}
                    onChange={(e) => { setOutcomeFilter(e.target.value); setSkip(0); }}
                >
                    <option value="">Tüm Sonuçlar</option>
                    <option value="SUCCESS">Başarılı</option>
                    <option value="FAILURE">Başarısız</option>
                </select>
            </motion.div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            ) : logs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center backdrop-blur-md"
                >
                    <Shield size={64} className="text-white/10 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Kayıt Bulunamadı</h3>
                    <p className="text-white/40 max-w-sm">
                        Seçilen filtrelere uygun herhangi bir denetim kaydı bulunmamaktadır.
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/40 border-b border-white/10">
                                        <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Zaman</th>
                                        <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Kullanıcı</th>
                                        <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Rol</th>
                                        <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Eylem</th>
                                        <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Sonuç</th>
                                        <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">IP Adresi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map((log, index) => (
                                        <motion.tr
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            key={log.id}
                                            className="hover:bg-white/5 transition-colors group cursor-default"
                                        >
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-white/90">
                                                    {new Date(log.timestamp).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                                                </div>
                                                <div className="text-xs text-white/40">
                                                    {new Date(log.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{log.user_email || "Sistem"}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                                    ${log.role === "admin" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                                                    {log.role === "admin" ? "Yönetici" : log.role || "Bilinmiyor"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex px-2.5 py-1 rounded-lg bg-white/10 text-white/80 text-xs font-bold border border-white/5">
                                                    {actionLabels[log.action] || log.action}
                                                </span>
                                                {log.details && (
                                                    <div className="text-[11px] text-white/40 mt-1 max-w-[200px] truncate" title={log.details}>
                                                        {log.details}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                                                    ${log.outcome === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                                                    {log.outcome === "SUCCESS" ? "Başarılı" : <><AlertTriangle size={12} /> Başarısız</>}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-white/50">{log.ip_address || "—"}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-4">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                            {skip + 1} - {Math.min(skip + limit, total)} / {total}
                        </span>
                        <div className="flex gap-2">
                            <button
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors disabled:opacity-30 disabled:hover:bg-white/5"
                                onClick={() => setSkip(Math.max(0, skip - limit))}
                                disabled={skip === 0}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors disabled:opacity-30 disabled:hover:bg-white/5"
                                onClick={() => setSkip(skip + limit)}
                                disabled={skip + limit >= total}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
