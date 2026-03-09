import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    Activity,
    AlertTriangle,
    Crown,
    CreditCard,
    Eye,
    FileText,
    Loader2,
    Mail,
    MessageSquare,
    RefreshCw,
    Shield,
    Trash2,
    UserCheck,
    UserX,
    Users,
} from "lucide-react";
import { adminApi, employeeApi, approvalsApi } from "../services/api";

const ROLE_OPTIONS = ["customer", "employee", "admin", "ceo"];
const PAGE_SIZE = 12;

export default function AdminPanelPage() {
    const [tab, setTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [userTotal, setUserTotal] = useState(0);
    const [messages, setMessages] = useState([]);
    const [bills, setBills] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [kycRequests, setKycRequests] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [roleFilter, setRoleFilter] = useState("");
    const [searchQ, setSearchQ] = useState("");
    const [page, setPage] = useState(1);
    const [busyKey, setBusyKey] = useState("");

    useEffect(() => {
        if (tab === "overview") loadOverview();
        if (tab === "users") loadUsers();
        if (tab === "messages") loadMessages();
        if (tab === "approvals") loadApprovals();
    }, [tab, page, roleFilter]); // searchQ is intentionally left out to trigger on search button

    const loadOverview = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, messagesRes, billsRes] = await Promise.all([
                adminApi.systemStats(),
                adminApi.listUsers({ page: 1, limit: 8 }),
                adminApi.allMessages({ page: 1, limit: 8 }),
                adminApi.allBills({ page: 1, limit: 8 }),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data?.data || []);
            setUserTotal(usersRes.data?.total || 0);
            setMessages(messagesRes.data?.data || []);
            setBills(billsRes.data?.data || []);
        } catch {
            toast.error("Admin dashboard verileri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = { page, limit: PAGE_SIZE };
            if (roleFilter) params.role = roleFilter;
            if (searchQ) params.q = searchQ;
            const res = await adminApi.listUsers(params);
            setUsers(res.data?.data || []);
            setUserTotal(res.data?.total || 0);
        } catch {
            toast.error("Kullanıcı listesi yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        setLoading(true);
        try {
            const [messagesRes, billsRes] = await Promise.all([
                adminApi.allMessages({ page: 1, limit: 30 }),
                adminApi.allBills({ page: 1, limit: 20 }),
            ]);
            setMessages(messagesRes.data?.data || []);
            setBills(billsRes.data?.data || []);
        } catch {
            toast.error("Mesaj ve ödeme listeleri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const loadApprovals = async () => {
        setLoading(true);
        try {
            const [appRes, kycRes] = await Promise.all([
                approvalsApi.getApprovals(),
                employeeApi.pendingKYC()
            ]);
            setApprovals(appRes.data || []);
            setKycRequests(kycRes.data || []);
        } catch {
            toast.error("Onay listeleri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleKycDecision = async (id, decision) => {
        setBusyKey(`kyc-${id}`);
        try {
            await employeeApi.kycDecision(id, { decision, notes: "Admin panelinden eklendi." });
            toast.success("KYC kararı işlendi.");
            loadApprovals();
        } catch (error) {
            toast.error(error.response?.data?.detail || "KYC güncellemesi başarısız.");
        } finally {
            setBusyKey("");
        }
    };

    const handleApprovalReview = async (id, action) => {
        setBusyKey(`appr-${id}`);
        try {
            await approvalsApi.reviewApproval(id, { action, notes: "Admin panelinden işlendi." });
            toast.success("İşlem başarılı.");
            loadApprovals();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Onay işlemi başarısız.");
        } finally {
            setBusyKey("");
        }
    };

    const openUser = async (userId) => {
        setDetailLoading(true);
        try {
            const res = await adminApi.getUser(userId);
            setSelectedUser(res.data);
        } catch {
            toast.error("Kullanıcı detayı yüklenemedi.");
        } finally {
            setDetailLoading(false);
        }
    };

    const changeRole = async (userId, role) => {
        setBusyKey(`role-${userId}`);
        try {
            await adminApi.changeRole(userId, { role });
            toast.success("Rol güncellendi.");
            loadUsers();
            if (selectedUser?.user?.user_id === userId) openUser(userId);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Rol güncellenemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const toggleStatus = async (user) => {
        const next = !user.is_active;
        setBusyKey(`status-${user.user_id}`);
        try {
            await adminApi.toggleStatus(user.user_id, { is_active: next });
            toast.success(next ? "Kullanıcı aktifleştirildi." : "Kullanıcı pasife alındı.");
            loadUsers();
            if (selectedUser?.user?.user_id === user.user_id) openUser(user.user_id);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Durum güncellenemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const removeUser = async (userId) => {
        if (!window.confirm("Bu kullanıcıyı silmek istiyor musunuz?")) return;
        setBusyKey(`delete-${userId}`);
        try {
            await adminApi.deleteUser(userId);
            toast.success("Kullanıcı silindi.");
            setSelectedUser((current) => (current?.user?.user_id === userId ? null : current));
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Kullanıcı silinemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const inactiveUsers = Math.max(Number(stats?.total_users || 0) - Number(stats?.active_users || 0), 0);
    const totalPages = Math.max(1, Math.ceil(Number(userTotal || 0) / PAGE_SIZE));
    const roles = [
        { key: "", label: "Tüm roller" },
        { key: "customer", label: "Customer" },
        { key: "employee", label: "Employee" },
        { key: "admin", label: "Admin" },
        { key: "ceo", label: "CEO" },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-20 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <Crown size={28} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
                    </div>
                    <p className="text-white/60 text-sm">Sistem kullanıcıları, işlemler ve güvenlik yönetimi merkezi.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={() => toast.success("Sistem bakıma alındı (Mock)")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm font-bold transition-colors"
                    >
                        <AlertTriangle size={16} /> Sistemi Duraklat
                    </button>
                    <button
                        type="button"
                        onClick={() => { setPage(1); if (tab === "overview") loadOverview(); if (tab === "users") loadUsers(); if (tab === "messages") loadMessages(); if (tab === "approvals") loadApprovals(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-bold transition-colors"
                    >
                        <RefreshCw size={16} /> Yenile
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap bg-deepblue-900/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit">
                {[
                    { id: "overview", label: "Genel Bakış" },
                    { id: "users", label: "Kullanıcı Yönetimi" },
                    { id: "messages", label: "Mesaj & Faturalar" },
                    { id: "approvals", label: "Onaylar & KYC" },
                ].map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => { setPage(1); setTab(item.id) }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === item.id ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {loading ? <LoadingState /> : null}

            {!loading && tab === "overview" && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard icon={<Users size={24} />} label="Toplam kullanıcı" value={formatNumber(stats?.total_users)} colorClass="text-blue-400" bgClass="bg-blue-500/20" borderClass="border-blue-500/20" />
                        <MetricCard icon={<UserCheck size={24} />} label="Aktif kullanıcı" value={formatNumber(stats?.active_users)} colorClass="text-emerald-400" bgClass="bg-emerald-500/20" borderClass="border-emerald-500/20" />
                        <MetricCard icon={<CreditCard size={24} />} label="Toplam hesap" value={formatNumber(stats?.total_accounts)} colorClass="text-indigo-400" bgClass="bg-indigo-500/20" borderClass="border-indigo-500/20" />
                        <MetricCard icon={<Activity size={24} />} label="Toplam işlem" value={formatNumber(stats?.total_transactions)} colorClass="text-amber-400" bgClass="bg-amber-500/20" borderClass="border-amber-500/20" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QueueCard icon={<AlertTriangle size={20} />} label="Bekleyen KYC" value={stats?.pending_kyc} colorClass="text-amber-400" bgClass="bg-amber-500/20" />
                        <QueueCard icon={<Mail size={20} />} label="Açık mesaj" value={stats?.open_messages} colorClass="text-rose-400" bgClass="bg-rose-500/20" />
                        <QueueCard icon={<Shield size={20} />} label="Donuk hesap" value={stats?.frozen_accounts} colorClass="text-indigo-400" bgClass="bg-indigo-500/20" />
                        <QueueCard icon={<UserX size={20} />} label="Pasif kullanıcı" value={inactiveUsers} colorClass="text-slate-400" bgClass="bg-slate-500/20" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Panel title="Son kullanıcılar" subtitle="Yeni kayıtları hızlı inceleyin">
                            {users.length === 0 ? <Empty message="Kullanıcı kaydı yok." /> : (
                                <div className="space-y-3">
                                    {users.map((user) => (
                                        <div key={user.user_id} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="font-bold text-white mb-1">{user.email}</div>
                                                <div className="text-xs text-white/50 flex items-center gap-2">
                                                    <span className="uppercase font-bold text-white/70">{user.role}</span>
                                                    <span>•</span>
                                                    <span className={user.is_active ? "text-emerald-400" : "text-rose-400"}>{user.is_active ? "Aktif" : "Pasif"}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openUser(user.user_id)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-colors"
                                            >
                                                <Eye size={14} /> Detay
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>

                        <Panel title="Mesaj ve ödeme akışı" subtitle="Operasyon sinyallerini kaçırmayın">
                            <div className="space-y-3 mb-6">
                                {(messages || []).slice(0, 4).map((message) => (
                                    <div key={message.message_id} className={`p-4 rounded-2xl border transition-colors ${message.status === "open" ? "bg-amber-500/10 border-amber-500/30" : "bg-black/20 border-white/5"}`}>
                                        <div className="font-bold text-white mb-2 line-clamp-1">{message.subject}</div>
                                        <div className="text-xs text-white/60 mb-2">{message.sender_email}</div>
                                        <div className="text-[10px] text-white/40">{formatDateTime(message.created_at)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                {(bills || []).slice(0, 4).map((bill) => (
                                    <div key={bill.bill_id || `${bill.provider}-${bill.subscriber_no}`} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                                        <div>
                                            <div className="font-bold text-white mb-1">{bill.provider || bill.bill_type || "Fatura Ödemesi"}</div>
                                            <div className="text-xs text-white/50">{formatDate(bill.paid_at || bill.created_at)}</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-rose-400 font-bold">
                                            <FileText size={16} />
                                            {formatMoney(bill.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>
                </div>
            )}

            {!loading && tab === "users" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="lg:col-span-2">
                        <Panel title="Kullanıcı yönetimi" subtitle="Rol, durum ve silme işlemleri">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="flex gap-2 flex-wrap">
                                    {roles.map((role) => (
                                        <button
                                            key={role.key || "all"}
                                            type="button"
                                            onClick={() => { setPage(1); setRoleFilter(role.key); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${roleFilter === role.key ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-white/5 text-white/60 border-transparent hover:bg-white/10 hover:text-white"}`}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex w-full md:w-auto gap-2">
                                    <input
                                        placeholder="E-posta ile ara..."
                                        value={searchQ}
                                        onChange={(e) => setSearchQ(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); loadUsers(); } }}
                                        className="bg-black/30 border border-white/10 text-white rounded-xl px-4 py-2 w-full md:w-48 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setPage(1); loadUsers(); }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Ara
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Kullanıcı</th>
                                            <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Rol</th>
                                            <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Durum</th>
                                            <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Kayıt</th>
                                            <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Aksiyon</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((user) => (
                                            <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 align-top">
                                                    <div className="font-bold text-white text-sm mb-1">{user.email}</div>
                                                    <div className="text-[10px] text-white/40 font-mono">{user.user_id}</div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <select
                                                        value={user.role}
                                                        onChange={(event) => changeRole(user.user_id, event.target.value)}
                                                        disabled={busyKey === `role-${user.user_id}`}
                                                        className="bg-black/30 text-white border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500/50"
                                                    >
                                                        {ROLE_OPTIONS.map((role) => <option className="bg-deepblue-900" key={role} value={role}>{role}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <Status active={user.is_active}>{user.is_active ? "Aktif" : "Pasif"}</Status>
                                                </td>
                                                <td className="p-4 align-top text-xs text-white/60 whitespace-nowrap">
                                                    {formatDate(user.created_at)}
                                                </td>
                                                <td className="p-4 align-top">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openUser(user.user_id)}
                                                            className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-xs font-bold transition-colors"
                                                        >
                                                            <Eye size={12} /> Detay
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStatus(user)}
                                                            disabled={busyKey === `status-${user.user_id}`}
                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-colors border ${user.is_active ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"}`}
                                                        >
                                                            {user.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                                                            {user.is_active ? "Pasif Yap" : "Aktifleştir"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUser(user.user_id)}
                                                            disabled={busyKey === `delete-${user.user_id}`}
                                                            className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-xs font-bold transition-colors"
                                                        >
                                                            <Trash2 size={12} /> Sil
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-white/10">
                                <span className="text-white/50 text-xs font-medium">
                                    Toplam {formatNumber(userTotal)} kayıt — Sayfa {page} / {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                        disabled={page <= 1}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white border border-white/10 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Geri
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                        disabled={page >= totalPages}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white border border-white/10 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        İleri
                                    </button>
                                </div>
                            </div>
                        </Panel>
                    </div>

                    <div className="lg:col-span-1">
                        {selectedUser ? <UserDetailCard data={selectedUser} loading={detailLoading} /> : (
                            <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                                <Users size={48} className="text-white/20 mb-4" />
                                <p className="text-white/40 text-sm">Detaylarını görmek için tablodan bir kullanıcı seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!loading && tab === "messages" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    <Panel title="Mesaj Merkezi" subtitle="Tüm açık ve yanıtlanmış mesajlar">
                        {messages.length === 0 ? <Empty message="Mesaj yok." /> : (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div key={message.message_id} className={`p-5 rounded-2xl border transition-colors ${message.status === "open" ? "bg-amber-500/10 border-amber-500/30" : "bg-black/20 border-white/5 hover:bg-white/5"}`}>
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                            <strong className="text-white text-base">{message.subject}</strong>
                                            <Status active={message.status !== "open"}>{message.status === "open" ? "Açık" : "Kapalı"}</Status>
                                        </div>
                                        <div className="text-sm text-white/70 leading-relaxed mb-4">{message.body}</div>
                                        <div className="text-xs text-white/40 flex items-center justify-between">
                                            <span>{message.sender_email}</span>
                                            <span>{formatDateTime(message.created_at)}</span>
                                        </div>
                                        {message.reply && (
                                            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-white/80">
                                                <strong className="text-blue-400 block mb-1 text-xs uppercase tracking-wider">Yanıt (Personel)</strong>
                                                {message.reply}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Ödeme Listesi" subtitle="Son gelen Kurum / Fatura ödemeleri">
                        {bills.length === 0 ? <Empty message="Ödeme kaydı yok." /> : (
                            <div className="space-y-3">
                                {bills.map((bill) => (
                                    <div key={bill.bill_id || `${bill.provider}-${bill.subscriber_no}`} className="flex justify-between items-center p-5 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                        <div>
                                            <div className="font-bold text-white text-base mb-1">{bill.provider || bill.bill_type || "Fatura"}</div>
                                            <div className="text-xs text-white/50 flex items-center gap-2">
                                                <span>No: {bill.subscriber_no || "-"}</span>
                                                <span>•</span>
                                                <span>{formatDateTime(bill.paid_at || bill.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="text-lg font-black text-rose-400">
                                            {formatMoney(bill.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            )}

            {!loading && tab === "approvals" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    <Panel title="Bekleyen KYC Talepleri" subtitle="Kimlik onayı bekleyen yeni hesap açılışları">
                        {kycRequests.length === 0 ? <Empty message="Bekleyen KYC talebi yok." /> : (
                            <div className="space-y-3">
                                {kycRequests.map(k => (
                                    <div key={k.customer_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                        <div>
                                            <div className="font-bold text-white mb-1">{k.full_name || k.user?.email || "İsim belirtilmemiş"}</div>
                                            <div className="text-xs text-white/60 mb-1">TC Kimlik: <span className="text-white/90 font-mono">{k.national_id}</span></div>
                                            <div className="text-xs text-white/60">E-Posta: <span className="text-white/90">{k.email || k.user?.email}</span></div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-colors"
                                                disabled={busyKey === `kyc-${k.customer_id}`}
                                                onClick={() => handleKycDecision(k.customer_id, "approved")}
                                            ><UserCheck size={16} /> Onayla</button>
                                            <button
                                                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold transition-colors"
                                                disabled={busyKey === `kyc-${k.customer_id}`}
                                                onClick={() => handleKycDecision(k.customer_id, "rejected")}
                                            ><UserX size={16} /> Reddet</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Kritik İşlem Onayları (Approvals)" subtitle="Onay bekleyen finansal talepler (Limit artışı, vb.)">
                        {approvals.length === 0 ? <Empty message="Bekleyen işlem onayı yok." /> : (
                            <div className="space-y-3">
                                {approvals.map(a => (
                                    <div key={a.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                        <div className="flex-1">
                                            <div className="font-bold text-white mb-1">{a.user_name}</div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-xs font-semibold bg-white/10 text-white px-2 py-0.5 rounded-full">{a.request_type}</span>
                                                <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${a.risk_score === "HIGH" ? "bg-rose-500/20 text-rose-400" :
                                                        a.risk_score === "MEDIUM" ? "bg-amber-500/20 text-amber-400" :
                                                            "bg-emerald-500/20 text-emerald-400"
                                                    }`}>
                                                    Risk: {a.risk_score}
                                                </span>
                                            </div>
                                            <div className="text-lg font-black text-white mb-1">{formatMoney(a.amount)}</div>
                                            {a.description && <div className="text-xs text-white/50">{a.description}</div>}
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <button
                                                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-colors"
                                                disabled={busyKey === `appr-${a.id}`}
                                                onClick={() => handleApprovalReview(a.id, "APPROVE")}
                                            ><UserCheck size={16} /> Onayla</button>
                                            <button
                                                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold transition-colors"
                                                disabled={busyKey === `appr-${a.id}`}
                                                onClick={() => handleApprovalReview(a.id, "REJECT")}
                                            ><UserX size={16} /> Reddet</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            )}
        </div>
    );
}

function UserDetailCard({ data, loading }) {
    return (
        <Panel title="Seçili Müşteri/Personel" subtitle="Hesap özeti, profil bilgileri">
            {loading ? <LoadingState compact /> : (
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col gap-1">
                        <div className="font-bold text-white text-lg">{data.user?.email || "-"}</div>
                        <div className="text-xs text-white/50 font-mono tracking-wider uppercase">{data.user?.role || "-"}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">Müşteri Adı</div>
                            <div className="text-sm text-white font-medium">{data.customer?.full_name || `${data.customer?.first_name || ""} ${data.customer?.last_name || ""}`.trim() || "Profil yok"}</div>
                        </div>
                        <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">KYC Durumu</div>
                            <div className="text-sm text-white font-medium">{data.user?.kyc_status || data.customer?.status || "-"}</div>
                        </div>
                        <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">Kimlik No</div>
                            <div className="text-sm text-white font-medium">{data.customer?.national_id || "-"}</div>
                        </div>
                        <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-semibold mb-1">Telefon</div>
                            <div className="text-sm text-white font-medium">{data.customer?.phone || "-"}</div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <CreditCard size={16} className="text-blue-400" /> Hesaplar / Bakiyeler
                        </h4>
                        {(data.accounts || []).length === 0 ? <Empty message="Kayıtlı hesap bulunamadı." /> : (
                            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
                                {data.accounts.map((account) => (
                                    <div key={account.account_id} className="p-3 flex justify-between items-center bg-black/20 rounded-xl border border-white/5">
                                        <div>
                                            <div className="font-bold text-white text-sm mb-1">{account.account_number}</div>
                                            <div className="text-[10px] text-white/50">{account.account_type} • {account.status}</div>
                                        </div>
                                        <div className="font-bold text-emerald-400">
                                            {formatMoney(account.balance || 0)} <span className="text-xs text-white/40 font-medium">{account.currency}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Panel>
    );
}

function Panel({ title, subtitle, children }) {
    return (
        <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, colorClass, bgClass, borderClass }) {
    return (
        <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
                <span className="text-white/50 text-sm font-semibold tracking-wider uppercase">{label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${bgClass} ${colorClass} ${borderClass}`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
        </div>
    );
}

function QueueCard({ icon, label, value, colorClass, bgClass }) {
    return (
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/5">
            <div className="flex justify-between items-start mb-3">
                <span className="text-white font-bold">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-black text-white">{formatNumber(value)}</div>
        </div>
    );
}

function Status({ active, children }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border
            ${active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}
        `}>
            {children}
        </span>
    );
}

function Empty({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-white/40 bg-black/10 rounded-2xl border border-dashed border-white/10">
            {message}
        </div>
    );
}

function LoadingState({ compact = false }) {
    return (
        <div className={`flex items-center justify-center ${compact ? "min-h-[120px]" : "min-h-[260px]"} w-full`}>
            <Loader2 size={compact ? 24 : 36} className="text-blue-500 animate-spin" />
        </div>
    );
}

function formatNumber(value) { return new Intl.NumberFormat("tr-TR").format(Number(value || 0)); }
function formatMoney(value) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value || 0)); }
function formatDate(value) { return value ? new Date(value).toLocaleDateString("tr-TR") : "-"; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString("tr-TR") : "-"; }
