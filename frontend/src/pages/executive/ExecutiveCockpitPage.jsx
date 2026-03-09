import { useState, useEffect } from "react";
import {
    DollarSign, Users, TrendingUp, Activity, Clock,
    ArrowUpRight, ArrowDownRight, Eye, AlertTriangle, Shield, Search, CheckCircle, XCircle, ShieldAlert
} from "lucide-react";
import { customerApi, accountApi, ledgerApi, auditApi, adminApi, approvalsApi } from "../../services/api";
import toast from "react-hot-toast";
import ApprovalCard from "../../components/ApprovalCard";
import { ListSkeleton } from "../../components/SkeletonLoader";

export default function ExecutiveCockpitPage() {
    const [stats, setStats] = useState({
        totalDeposit: 0,
        activeCustomers: 0,
        todayTransactions: 0,
        todayVolume: 0,
    });
    const [recentTx, setRecentTx] = useState([]);
    const [recentAudit, setRecentAudit] = useState([]);
    const [loading, setLoading] = useState(true);

    // CEO Management States
    const [users, setUsers] = useState([]);
    const [searchQ, setSearchQ] = useState("");
    const [tab, setTab] = useState("dashboard"); // dashboard, users, approvals
    const [approvals, setApprovals] = useState([]);

    useEffect(() => {
        if (tab === "dashboard") loadData();
        if (tab === "users") loadUsers();
    }, [tab, searchQ]);

    const loadUsers = async () => {
        try {
            const res = await adminApi.listUsers({ limit: 50, q: searchQ });
            setUsers(res.data?.data || []);
        } catch (err) {
            console.error("Users load err", err);
        }
    };

    const loadData = async () => {
        try {
            const [customersRes, accountsRes, ledgerRes, auditRes, appRes] = await Promise.allSettled([
                customerApi.listAll(),
                accountApi.listAll(),
                ledgerApi.getEntries({ limit: 10 }),
                auditApi.getLogs({ limit: 5 }),
                approvalsApi.getApprovals("PENDING_CEO"),
            ]);

            const customers = customersRes.status === "fulfilled" ? customersRes.value.data : [];
            const accounts = accountsRes.status === "fulfilled" ? accountsRes.value.data : [];
            const ledger = ledgerRes.status === "fulfilled" ? ledgerRes.value.data : [];
            const audit = auditRes.status === "fulfilled" ? auditRes.value.data : [];
            const appList = appRes.status === "fulfilled" ? appRes.value.data : [];

            const totalDeposit = Array.isArray(accounts)
                ? accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
                : 0;

            const todayTx = Array.isArray(ledger) ? ledger : [];

            setStats({
                totalDeposit,
                activeCustomers: Array.isArray(customers) ? customers.length : 0,
                todayTransactions: todayTx.length,
                todayVolume: todayTx.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0),
            });
            setRecentTx(todayTx.slice(0, 8));
            setRecentAudit(Array.isArray(audit) ? audit.slice(0, 5) : []);
            setApprovals(Array.isArray(appList) ? appList : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprovalAction = async (approvalId, actionStr) => {
        try {
            await approvalsApi.reviewApproval(approvalId, { action: actionStr, notes: "" });
            toast.success(actionStr === "APPROVE" ? "Talep onaylandı ve işleme alındı." : "Talep nihai olarak reddedildi.");
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Onay işlemi başarısız.");
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Yükleniyor...</h1>
                </div>
                <ListSkeleton count={4} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <Crown className="text-amber-400" size={32} /> CEO Kontrol Paneli
                    </h1>
                    <p className="text-white/60 text-sm mt-1">
                        Banka genelindeki finansal durumun canlı görünümü ve sistem yönetimi
                    </p>
                </div>

                <div className="flex gap-2 p-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                    <button
                        onClick={() => setTab("dashboard")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${tab === "dashboard" ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                    >
                        <Activity size={16} /> Finansal Özet
                    </button>
                    <button
                        onClick={() => setTab("users")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${tab === "users" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                    >
                        <Shield size={16} /> Kullanıcı Yönetimi
                    </button>
                    <button
                        onClick={() => setTab("approvals")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${tab === "approvals" ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                    >
                        <ShieldAlert size={16} /> Son Onaylar
                        {approvals.length > 0 && (
                            <span className="bg-white text-rose-600 px-2 py-0.5 rounded-full text-[10px] ml-1">{approvals.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Users Tab ── */}
            {tab === "users" && (
                <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users size={20} className="text-blue-400" /> Sistem Kullanıcıları
                        </h2>
                        <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full sm:w-auto">
                            <Search size={16} className="text-white/40" />
                            <input
                                type="text"
                                placeholder="E-posta ile ara..."
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                className="bg-transparent border-none text-white placeholder-white/40 outline-none ml-2 w-full sm:w-48 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {users.length === 0 ? (
                            <div className="p-8 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10">Sonuç bulunamadı.</div>
                        ) : users.map(u => (
                            <div key={u.user_id} className="group bg-black/20 hover:bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-lg">
                                <div>
                                    <div className="font-bold text-white flex flex-wrap items-center gap-2 mb-1">
                                        {u.email}
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider
                                            ${u.role === "ceo" ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" :
                                                u.role === "admin" ? "bg-rose-500/20 text-rose-400 border border-rose-500/20" :
                                                    u.role === "employee" ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" :
                                                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"}
                                        `}>
                                            {u.role}
                                        </span>
                                    </div>
                                    <div className="text-xs text-white/40 font-mono">ID: {u.user_id?.substring(0, 8)}...</div>
                                </div>
                                <div className="flex gap-2">
                                    {u.role !== "ceo" && (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Bu yetkiyi değiştirmek istediğinize emin misiniz?")) {
                                                    try {
                                                        await adminApi.changeRole(u.user_id, { role: "admin" });
                                                        toast.success("Admin yetkisi verildi!");
                                                        loadUsers();
                                                    } catch (e) { toast.error("Hata oluştu"); }
                                                }
                                            }}
                                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Admin Yap
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Approvals Tab ── */}
            {tab === "approvals" && (
                <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="border-b border-white/10 pb-6 mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShieldAlert size={20} className="text-rose-400" /> CEO Son Onay Bekleyen İşlemler
                        </h2>
                    </div>
                    {approvals.length === 0 ? (
                        <div className="p-12 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10 font-medium">
                            Şu an onay bekleyen kritik bir işlem bulunmuyor.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {approvals.map((req, i) => (
                                <ApprovalCard
                                    key={req.id || i}
                                    request={req}
                                    onApprove={(id) => handleApprovalAction(id, "APPROVE")}
                                    onReject={(id) => handleApprovalAction(id, "REJECT")}
                                    isCeo={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Dashboard Tab ── */}
            {tab === "dashboard" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Toplam Mevduat */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/90 to-amber-700/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-500">
                                <DollarSign size={120} />
                            </div>
                            <div className="relative z-10 text-white">
                                <DollarSign size={24} className="mb-4 opacity-80" />
                                <div className="text-sm font-semibold tracking-wider uppercase opacity-90 mb-1">Toplam Mevduat</div>
                                <div className="text-3xl font-black tracking-tight">{formatCurrency(stats.totalDeposit)}</div>
                                <div className="text-xs font-medium opacity-75 mt-4 flex items-center gap-1.5">
                                    <ArrowUpRight size={14} /> Tüm hesaplar toplamı
                                </div>
                            </div>
                        </div>

                        {/* Aktif Müşteri */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/90 to-purple-700/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-500">
                                <Users size={120} />
                            </div>
                            <div className="relative z-10 text-white">
                                <Users size={24} className="mb-4 opacity-80" />
                                <div className="text-sm font-semibold tracking-wider uppercase opacity-90 mb-1">Aktif Müşteri</div>
                                <div className="text-3xl font-black tracking-tight">{stats.activeCustomers}</div>
                                <div className="text-xs font-medium opacity-75 mt-4 flex items-center gap-1.5">
                                    <TrendingUp size={14} /> Kayıtlı kullanıcılar
                                </div>
                            </div>
                        </div>

                        {/* İşlem Sayısı */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/90 to-teal-700/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-500">
                                <Activity size={120} />
                            </div>
                            <div className="relative z-10 text-white">
                                <Activity size={24} className="mb-4 opacity-80" />
                                <div className="text-sm font-semibold tracking-wider uppercase opacity-90 mb-1">Bugünkü İşlemler</div>
                                <div className="text-3xl font-black tracking-tight">{stats.todayTransactions}</div>
                                <div className="text-xs font-medium opacity-75 mt-4 flex items-center gap-1.5">
                                    <Clock size={14} /> Toplam kayıtlı işlem
                                </div>
                            </div>
                        </div>

                        {/* İşlem Hacmi */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/90 to-red-700/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-500">
                                <TrendingUp size={120} />
                            </div>
                            <div className="relative z-10 text-white">
                                <TrendingUp size={24} className="mb-4 opacity-80" />
                                <div className="text-sm font-semibold tracking-wider uppercase opacity-90 mb-1">İşlem Hacmi</div>
                                <div className="text-3xl font-black tracking-tight">{formatCurrency(stats.todayVolume)}</div>
                                <div className="text-xs font-medium opacity-75 mt-4 flex items-center gap-1.5">
                                    <ArrowUpRight size={14} /> Toplam hareket tutarı
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Son İşlemler */}
                        <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-white/10 bg-black/20">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Eye size={20} className="text-blue-400" /> Son İşlemler
                                </h2>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
                                {recentTx.length === 0 ? (
                                    <div className="p-8 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10 h-full flex items-center justify-center">
                                        Henüz işlem kaydı bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recentTx.map((tx, i) => (
                                            <div key={i} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                                <div>
                                                    <div className="font-bold text-white text-sm mb-1">
                                                        {tx.type === "DEPOSIT" ? "💰 Yatırma" :
                                                            tx.type === "WITHDRAW" ? "💸 Çekme" :
                                                                tx.type === "TRANSFER" ? "🔄 Transfer" : tx.type}
                                                    </div>
                                                    <div className="text-xs font-mono text-white/40">
                                                        {tx.account_id?.slice(0, 8)}...
                                                    </div>
                                                </div>
                                                <div className={`font-black text-base tracking-tight flex items-center gap-1
                                                    ${tx.direction === "DEBIT" ? "text-rose-400" : "text-emerald-400"}`}>
                                                    {tx.direction === "DEBIT" ? (
                                                        <><ArrowDownRight size={16} /> -{formatCurrency(Math.abs(tx.amount))}</>
                                                    ) : (
                                                        <><ArrowUpRight size={16} /> +{formatCurrency(Math.abs(tx.amount))}</>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Son Denetim Kayıtları */}
                        <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-white/10 bg-black/20">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-amber-400" /> Son Denetim Kayıtları (Audit)
                                </h2>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
                                {recentAudit.length === 0 ? (
                                    <div className="p-8 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10 h-full flex items-center justify-center">
                                        Henüz denetim kaydı bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recentAudit.map((log, i) => (
                                            <div key={i} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                                <div>
                                                    <div className="font-bold text-white text-sm mb-1">
                                                        {log.action}
                                                    </div>
                                                    <div className="text-xs text-white/40">
                                                        {log.user_email || "Sistem"}
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                                                    ${log.outcome === "SUCCESS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/20 text-rose-400 border border-rose-500/20"}
                                                `}>
                                                    {log.outcome}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
