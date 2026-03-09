import { useState, useEffect } from "react";
import {
    Users, FileCheck, Activity, Search,
    ArrowUpRight, ArrowDownRight, ShieldAlert,
    CheckCircle, XCircle, Clock, Eye, Briefcase
} from "lucide-react";
import { customerApi, accountApi, ledgerApi, transactionApi, approvalsApi } from "../../services/api";
import toast from "react-hot-toast";
import ApprovalCard from "../../components/ApprovalCard";
import { ListSkeleton } from "../../components/SkeletonLoader";

export default function EmployeePortalPage() {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [recentTx, setRecentTx] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, todayTx: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [approvals, setApprovals] = useState([]);

    // 360 Modal States
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerAccounts, setCustomerAccounts] = useState([]);
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [depositForm, setDepositForm] = useState({ accountId: "", amount: "", description: "" });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            setFilteredCustomers(
                customers.filter(c =>
                    (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (c.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredCustomers(customers);
        }
    }, [searchTerm, customers]);

    const loadData = async () => {
        try {
            const [cusRes, ledRes, appRes] = await Promise.allSettled([
                customerApi.listAll(),
                ledgerApi.getEntries({ limit: 10 }),
                approvalsApi.getApprovals("PENDING_EMPLOYER"),
            ]);

            const cusList = cusRes.status === "fulfilled" ? (Array.isArray(cusRes.value.data) ? cusRes.value.data : []) : [];
            const txList = ledRes.status === "fulfilled" ? (Array.isArray(ledRes.value.data) ? ledRes.value.data : []) : [];
            const appList = appRes.status === "fulfilled" ? (Array.isArray(appRes.value.data) ? appRes.value.data : []) : [];

            setCustomers(cusList);
            setFilteredCustomers(cusList);
            setRecentTx(txList.slice(0, 8));
            setApprovals(appList);

            setStats({
                total: cusList.length,
                pending: cusList.filter(c => c.status === "pending").length,
                verified: cusList.filter(c => c.status === "active").length,
                todayTx: txList.length,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleKycAction = async (customerId, action) => {
        try {
            await customerApi.updateStatus(customerId, {
                status: action === "approve" ? "active" : "suspended",
                kyc_verified: action === "approve" ? true : false,
            });
            toast.success(action === "approve" ? "KYC onaylandı! ✅" : "KYC reddedildi.");
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "İşlem başarısız.");
        }
    };

    const handleApprovalAction = async (approvalId, actionStr) => {
        try {
            await approvalsApi.reviewApproval(approvalId, { action: actionStr, notes: "" });
            toast.success(actionStr === "APPROVE" ? "Talep üst onaya (CEO) gönderildi." : "Talep reddedildi.");
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Onay işlemi başarısız.");
        }
    };

    const openCustomerModal = async (customer) => {
        setSelectedCustomer(customer);
        setCustomerAccounts([]);
        try {
            const res = await accountApi.listByCustomer(customer.id);
            if (Array.isArray(res.data)) {
                setCustomerAccounts(res.data);
            }
        } catch (err) {
            toast.error("Müşteri hesapları alınamadı.");
        }
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!depositForm.amount || depositForm.amount <= 0) return toast.error("Geçerli bir tutar girin.");
        setActionLoading(true);
        try {
            await transactionApi.deposit({
                account_id: depositForm.accountId,
                amount: parseFloat(depositForm.amount),
                description: depositForm.description || "Gişe Yatırımı (Personel İşlemi)"
            });
            toast.success("Para yatırma başarılı! ✅");
            setDepositModalOpen(false);
            setDepositForm({ accountId: "", amount: "", description: "" });
            openCustomerModal(selectedCustomer);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "İşlem başarısız.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val || 0);

    const tabs = [
        { id: "overview", label: "📊 Genel Bakış", icon: Activity },
        { id: "customers", label: "👥 Müşteriler", icon: Users },
        { id: "kyc", label: "📋 KYC Onay", icon: FileCheck },
        { id: "approvals", label: "📋 Bekleyen Onaylar", icon: ShieldAlert },
    ];

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">Yükleniyor...</h1>
                </div>
                <ListSkeleton count={4} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <Briefcase size={32} className="text-blue-400" /> Çalışan İşlem Portalı
                    </h1>
                    <p className="text-white/60 text-sm mt-1">
                        Müşteri yönetimi, KYC onay ve işlem takibi
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-2 bg-deepblue-900/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 border ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-white/10"
                                    : "text-white/60 hover:text-white hover:bg-white/5 border-transparent"
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label.split(" ")[1]} {tab.label.split(" ")[2]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<Users size={24} />} label="Toplam Müşteri" value={stats.total} tone="blue" />
                        <StatCard icon={<Clock size={24} />} label="Bekleyen KYC" value={stats.pending} tone="amber" />
                        <StatCard icon={<CheckCircle size={24} />} label="Onaylı Müşteri" value={stats.verified} tone="emerald" />
                        <StatCard icon={<Activity size={24} />} label="Son İşlemler" value={stats.todayTx} tone="purple" />
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl overflow-hidden flex flex-col">
                        <div className="border-b border-white/10 pb-4 mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Eye size={20} className="text-blue-400" /> Son İşlemler (Genel)
                            </h2>
                        </div>
                        <div>
                            {recentTx.length === 0 ? (
                                <div className="p-8 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10 font-medium">
                                    Henüz işlem kaydı yok.
                                </div>
                            ) : (
                                <div className="space-y-3">
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
                                            <div className={`font-black tracking-tight flex items-center gap-1 text-base
                                                ${tx.direction === "DEBIT" ? "text-rose-400" : "text-emerald-400"}`}>
                                                {tx.direction === "DEBIT" ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                                {formatCurrency(Math.abs(tx.amount))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === "customers" && (
                <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users size={20} className="text-blue-400" /> Sistem Müşterileri
                        </h2>
                        <div className="flex items-center w-full sm:w-auto relative">
                            <Search size={18} className="absolute left-4 text-white/40" />
                            <input
                                type="text"
                                className="bg-black/30 w-full sm:w-64 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Müşteri ara... (isim/e-posta)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {filteredCustomers.length === 0 ? (
                            <div className="p-8 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10 font-medium">
                                {searchTerm ? "Aramanıza uyan müşteri bulunamadı." : "Kayıtlı müşteri yok."}
                            </div>
                        ) : filteredCustomers.map((c, i) => (
                            <div key={c.id || i}
                                onClick={() => openCustomerModal(c)}
                                className="group bg-black/20 hover:bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all cursor-pointer hover:shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30 text-blue-400 font-bold text-lg">
                                        {(c.full_name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{c.full_name || "—"}</div>
                                        <div className="text-xs text-white/50 mt-1">{c.email || "—"}</div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border
                                    ${c.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        c.status === "suspended" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                            "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                                    {c.status || "PENDING"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KYC Tab */}
            {activeTab === "kyc" && (
                <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="border-b border-white/10 pb-6 mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileCheck size={20} className="text-amber-400" /> Bekleyen KYC Onayları
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {customers.filter(c => c.status === "pending").length === 0 ? (
                            <div className="p-8 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10 font-medium">
                                ✅ Harika! Bekleyen KYC onayı yok.
                            </div>
                        ) : customers.filter(c => c.status === "pending").map((c, i) => (
                            <div key={c.id || i} className="bg-black/20 rounded-2xl p-5 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                                        {(c.full_name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{c.full_name || "—"}</div>
                                        <div className="text-xs text-white/50 mt-1">{c.email || "—"}</div>
                                        <div className="text-xs text-white/40 mt-1">Tel: {c.phone || "—"}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button
                                        onClick={() => handleKycAction(c.id, "approve")}
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                                    >
                                        <CheckCircle size={16} /> Onayla
                                    </button>
                                    <button
                                        onClick={() => handleKycAction(c.id, "reject")}
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-rose-500/20 active:scale-95"
                                    >
                                        <XCircle size={16} /> Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Approvals Tab */}
            {activeTab === "approvals" && (
                <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="border-b border-white/10 pb-6 mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShieldAlert size={20} className="text-rose-400" /> Üst Onay Bekleyen İşlemler
                        </h2>
                        <p className="text-sm text-white/50 mt-1">Yüksek riskli müşteri işlemleri personel seviyesinde kısmi onay gerektirir.</p>
                    </div>
                    <div className="space-y-4">
                        {approvals.length === 0 ? (
                            <div className="p-8 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10 font-medium">
                                Şu an bekleyen onay talebi bulunmuyor.
                            </div>
                        ) : approvals.map((req, i) => (
                            <ApprovalCard
                                key={req.id || i}
                                request={req}
                                onApprove={(id) => handleApprovalAction(id, "APPROVE")}
                                onReject={(id) => handleApprovalAction(id, "REJECT")}
                                isCeo={false}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Müşteri 360 Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-deepblue-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setSelectedCustomer(null)} className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors">
                            <XCircle size={24} />
                        </button>

                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Müşteri 360°</h2>

                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <div className="font-bold text-xl text-white mb-2">{selectedCustomer.full_name}</div>
                                    <div className="text-sm text-white/60 mb-4">{selectedCustomer.email} • {selectedCustomer.phone}</div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white/70">
                                            TC: {selectedCustomer.national_id}
                                        </span>
                                        <span className={`px-3 py-1 border rounded-lg text-xs font-bold uppercase tracking-wider
                                            ${selectedCustomer.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                                            {selectedCustomer.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-4">Müşteri Hesapları</h3>
                            {customerAccounts.length === 0 ? (
                                <div className="p-6 text-center text-white/50 bg-black/10 rounded-2xl border border-dashed border-white/10">
                                    Müşteriye ait hesap bulunmuyor.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {customerAccounts.map(acc => (
                                        <div key={acc.id} className="bg-black/20 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                            <div>
                                                <div className="font-bold text-white text-base mb-1">{acc.account_type === 'checking' ? 'Vadesiz' : 'Tasarruf'} Hesabı</div>
                                                <div className="text-xs font-mono text-white/50">{acc.iban || acc.account_number}</div>
                                            </div>
                                            <button onClick={() => {
                                                setDepositForm({ ...depositForm, accountId: acc.id });
                                                setDepositModalOpen(true);
                                            }} className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform active:scale-95 border border-emerald-500/50">
                                                Nakit Yatır
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Form Modal */}
            {depositModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleDeposit} className="bg-deepblue-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md relative p-8 animate-in zoom-in-95 duration-200">
                        <button type="button" onClick={() => setDepositModalOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors">
                            <XCircle size={24} />
                        </button>
                        <h3 className="text-2xl font-bold text-white mb-6">Gişeden Nakit Yatırma</h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Tutar (TRY)</label>
                                <input type="number" step="0.01" required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    value={depositForm.amount} onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })}
                                    placeholder="Örn: 5000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Açıklama (Opsiyonel)</label>
                                <input type="text"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    value={depositForm.description} onChange={e => setDepositForm({ ...depositForm, description: e.target.value })}
                                    placeholder="Gişe nakit yatırma" />
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4 border border-emerald-500/50">
                                {actionLoading ? "İşleniyor..." : "Yatırımı Onayla"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, tone }) {
    const colors = {
        amber: "bg-amber-500/20 text-amber-400 border-amber-500/20",
        blue: "bg-blue-500/20 text-blue-400 border-blue-500/20",
        purple: "bg-purple-500/20 text-purple-400 border-purple-500/20",
        emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
        rose: "bg-rose-500/20 text-rose-400 border-rose-500/20",
    };

    return (
        <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 shadow-xl flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform cursor-default">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[tone]}`}>
                {icon}
            </div>
            <div>
                <div className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-1">{label}</div>
                <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
            </div>
        </div>
    );
}
