import { useState, useEffect, useCallback } from "react";
import { Crown, Users, Activity, MessageSquare, Search, Loader2, Shield, Trash2, UserCheck, UserX } from "lucide-react";
import { adminApi } from "../services/api";
import toast from "react-hot-toast";

export default function AdminPanelPage() {
    const [tab, setTab] = useState("stats");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [userTotal, setUserTotal] = useState(0);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchRole, setSearchRole] = useState("");
    const [page, setPage] = useState(1);

    const fetchStats = useCallback(async () => {
        try { const res = await adminApi.systemStats(); setStats(res.data); } catch { /* */ }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (searchRole) params.role = searchRole;
            const res = await adminApi.listUsers(params);
            setUsers(res.data.data);
            setUserTotal(res.data.total);
        } catch { /* */ }
        setLoading(false);
    }, [page, searchRole]);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try { const res = await adminApi.allMessages({ page: 1, limit: 30 }); setMessages(res.data.data); } catch { /* */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (tab === "stats") fetchStats();
        else if (tab === "users") fetchUsers();
        else if (tab === "messages") fetchMessages();
        setLoading(false);
    }, [tab, fetchStats, fetchUsers, fetchMessages]);

    const changeRole = async (userId, role) => {
        try { await adminApi.changeRole(userId, { role }); toast.success("Rol güncellendi."); fetchUsers(); } catch { toast.error("Hata."); }
    };
    const toggleStatus = async (userId, active) => {
        try { await adminApi.toggleStatus(userId, { is_active: active }); toast.success(active ? "Aktifleştirildi." : "Devre dışı bırakıldı."); fetchUsers(); } catch { toast.error("Hata."); }
    };
    const deleteUser = async (userId) => {
        if (!window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
        try { await adminApi.deleteUser(userId); toast.success("Kullanıcı silindi."); fetchUsers(); } catch { toast.error("Hata."); }
    };

    const fmt = (n) => new Intl.NumberFormat("tr-TR").format(n || 0);

    const tabs = [
        { id: "stats", label: "İstatistikler", icon: <Activity size={16} /> },
        { id: "users", label: "Kullanıcılar", icon: <Users size={16} /> },
        { id: "messages", label: "Mesajlar", icon: <MessageSquare size={16} /> },
    ];

    return (
        <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <Crown size={28} color="#f59e0b" /> Admin Paneli
            </h1>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }}>
                {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer",
                        background: tab === t.id ? "linear-gradient(135deg, #f59e0b, #d97706)" : "var(--bg-card)",
                        color: tab === t.id ? "#fff" : "var(--text-secondary)", fontWeight: 600, fontSize: 13,
                        display: "flex", alignItems: "center", gap: 6,
                    }}>{t.icon} {t.label}</button>
                ))}
            </div>

            {/* Stats Tab */}
            {tab === "stats" && stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                    {[
                        { label: "Toplam Kullanıcı", val: fmt(stats.total_users), color: "#6366f1", icon: <Users size={22} /> },
                        { label: "Aktif Kullanıcı", val: fmt(stats.active_users), color: "#22c55e", icon: <UserCheck size={22} /> },
                        { label: "Müşteriler", val: fmt(stats.customers), color: "#3b82f6", icon: <Users size={22} /> },
                        { label: "Çalışanlar", val: fmt(stats.employees), color: "#f59e0b", icon: <Shield size={22} /> },
                        { label: "Toplam Hesap", val: fmt(stats.total_accounts), color: "#8b5cf6", icon: <Activity size={22} /> },
                        { label: "Aktif Hesaplar", val: fmt(stats.active_accounts), color: "#10b981", icon: <UserCheck size={22} /> },
                        { label: "Dondurulmuş", val: fmt(stats.frozen_accounts), color: "#ef4444", icon: <UserX size={22} /> },
                        { label: "Toplam İşlem", val: fmt(stats.total_transactions), color: "#ec4899", icon: <Activity size={22} /> },
                        { label: "Toplam Mesaj", val: fmt(stats.total_messages), color: "#14b8a6", icon: <MessageSquare size={22} /> },
                        { label: "Bekleyen KYC", val: fmt(stats.pending_kyc), color: "#f97316", icon: <Shield size={22} /> },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: "var(--bg-card)", borderRadius: 16, padding: 20,
                            border: "1px solid var(--border-color)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Users Tab */}
            {tab === "users" && (
                <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {["", "customer", "employee", "admin", "ceo"].map((r) => (
                            <button key={r} onClick={() => { setSearchRole(r); setPage(1); }} style={{
                                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
                                background: searchRole === r ? "#6366f1" : "var(--bg-card)", color: searchRole === r ? "#fff" : "var(--text-secondary)",
                            }}>{r || "Tümü"}</button>
                        ))}
                    </div>
                    {loading ? <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                        {["E-posta", "Rol", "Durum", "Kayıt Tarihi", "İşlemler"].map((h) => (
                                            <th key={h} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textAlign: "left" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.user_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                            <td style={{ padding: "10px 12px", fontSize: 13 }}>{u.email}</td>
                                            <td style={{ padding: "10px 12px" }}>
                                                <select value={u.role} onChange={(e) => changeRole(u.user_id, e.target.value)}
                                                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 12 }}>
                                                    {["customer", "employee", "admin", "ceo"].map((r) => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: "10px 12px" }}>
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                    background: u.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                                    color: u.is_active ? "#22c55e" : "#ef4444",
                                                }}>{u.is_active ? "Aktif" : "Pasif"}</span>
                                            </td>
                                            <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-secondary)" }}>
                                                {new Date(u.created_at).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                                                <button onClick={() => toggleStatus(u.user_id, !u.is_active)} style={{
                                                    padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11,
                                                    background: u.is_active ? "#ef4444" : "#22c55e", color: "#fff",
                                                }}>{u.is_active ? "Devre Dışı" : "Aktifleştir"}</button>
                                                <button onClick={() => deleteUser(u.user_id)} style={{
                                                    padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                                                    background: "rgba(239,68,68,0.15)", color: "#ef4444",
                                                }}><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={pgBtn}>← Önceki</button>
                                <span style={{ padding: "8px 12px", fontSize: 13 }}>Sayfa {page} ({userTotal} toplam)</span>
                                <button onClick={() => setPage(page + 1)} style={pgBtn}>Sonraki →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Messages Tab */}
            {tab === "messages" && (
                <div style={{ display: "grid", gap: 10 }}>
                    {messages.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: 40 }}>Mesaj yok.</p> :
                        messages.map((m) => (
                            <div key={m.message_id} style={{
                                background: "var(--bg-card)", borderRadius: 14, padding: 16,
                                border: `1px solid ${m.status === "open" ? "#f59e0b" : "var(--border-color)"}`,
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{m.subject}</span>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                                        background: m.status === "open" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                                        color: m.status === "open" ? "#f59e0b" : "#22c55e",
                                    }}>{m.status === "open" ? "Açık" : "Yanıtlandı"}</span>
                                </div>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>{m.body}</p>
                                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                                    {m.sender_email} • {new Date(m.created_at).toLocaleDateString("tr-TR")}
                                </span>
                            </div>
                        ))
                    }
                </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const pgBtn = { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 };
