import { useState, useEffect, useCallback } from "react";
import { Briefcase, UserCheck, UserX, Search, Clock, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { employeeApi, messagesApi } from "../services/api";
import toast from "react-hot-toast";

export default function EmployeePanelPage() {
    const [tab, setTab] = useState("dashboard");
    const [dashData, setDashData] = useState(null);
    const [pendingKYC, setPendingKYC] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [replyText, setReplyText] = useState("");

    const fetchDash = useCallback(async () => {
        try { const res = await employeeApi.dashboard(); setDashData(res.data); } catch { /* */ }
        setLoading(false);
    }, []);

    const fetchKYC = useCallback(async () => {
        setLoading(true);
        try { const res = await employeeApi.pendingKYC(); setPendingKYC(res.data); } catch { /* */ }
        setLoading(false);
    }, []);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try { const res = await employeeApi.searchCustomers({ q: searchQ }); setCustomers(res.data.data); } catch { /* */ }
        setLoading(false);
    }, [searchQ]);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try { const res = await messagesApi.inbox(); setMessages(res.data); } catch { /* */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (tab === "dashboard") fetchDash();
        else if (tab === "kyc") fetchKYC();
        else if (tab === "customers") fetchCustomers();
        else if (tab === "messages") fetchMessages();
    }, [tab, fetchDash, fetchKYC, fetchCustomers, fetchMessages]);

    const handleKYCDecision = async (customerId, decision) => {
        try {
            await employeeApi.kycDecision(customerId, { decision });
            toast.success(decision === "approved" ? "KYC onaylandı ✅" : "KYC reddedildi ❌");
            fetchKYC();
        } catch (err) { toast.error(err.response?.data?.detail || "Hata."); }
    };

    const handleReply = async (messageId) => {
        if (!replyText.trim()) return;
        try {
            await messagesApi.reply(messageId, { reply_body: replyText });
            toast.success("Yanıt gönderildi ✅");
            setReplyText("");
            fetchMessages();
        } catch { toast.error("Hata."); }
    };

    const viewCustomer = async (customerId) => {
        try {
            const res = await employeeApi.getCustomer(customerId);
            setSelectedCustomer(res.data);
        } catch { toast.error("Detay yüklenemedi."); }
    };

    const fmt = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0);

    const tabs = [
        { id: "dashboard", label: "Panel", icon: <Briefcase size={16} /> },
        { id: "kyc", label: "KYC Onay", icon: <UserCheck size={16} /> },
        { id: "customers", label: "Müşteriler", icon: <Search size={16} /> },
        { id: "messages", label: "Mesajlar", icon: <Clock size={16} /> },
    ];

    return (
        <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <Briefcase size={28} color="#3b82f6" /> Çalışan Paneli
            </h1>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }}>
                {tabs.map((t) => (
                    <button key={t.id} onClick={() => { setTab(t.id); setSelectedCustomer(null); }} style={{
                        padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer",
                        background: tab === t.id ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "var(--bg-card)",
                        color: tab === t.id ? "#fff" : "var(--text-secondary)", fontWeight: 600, fontSize: 13,
                        display: "flex", alignItems: "center", gap: 6,
                    }}>{t.icon} {t.label}</button>
                ))}
            </div>

            {/* Dashboard Tab */}
            {tab === "dashboard" && dashData && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                        { label: "Bekleyen KYC", val: dashData.pending_kyc, color: "#f59e0b", icon: <Clock size={24} /> },
                        { label: "Toplam Müşteri", val: dashData.total_customers, color: "#6366f1", icon: <UserCheck size={24} /> },
                        { label: "Açık Mesajlar", val: dashData.open_messages, color: "#ef4444", icon: <Clock size={24} /> },
                        { label: "Bugünkü İşlemler", val: dashData.today_transactions, color: "#22c55e", icon: <Briefcase size={24} /> },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: "var(--bg-card)", borderRadius: 16, padding: 24,
                            border: "1px solid var(--border-color)",
                        }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, marginBottom: 12 }}>
                                {s.icon}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</div>
                            <div style={{ fontSize: 28, fontWeight: 800 }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* KYC Tab */}
            {tab === "kyc" && (
                <div style={{ display: "grid", gap: 12 }}>
                    {loading ? <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> :
                        pendingKYC.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: 40 }}>Bekleyen KYC başvurusu yok ✅</p> :
                            pendingKYC.map((c) => (
                                <div key={c.customer_id} style={{
                                    background: "var(--bg-card)", borderRadius: 16, padding: 20,
                                    border: "1px solid var(--border-color)",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 12 }}>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{c.first_name} {c.last_name}</h3>
                                            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>TC: {c.national_id} • Tel: {c.phone}</p>
                                            {c.user && <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>E-posta: {c.user.email}</p>}
                                            <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>Kayıt: {new Date(c.created_at).toLocaleDateString("tr-TR")}</p>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => handleKYCDecision(c.customer_id, "approved")} style={{
                                                padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                                                background: "#22c55e", color: "#fff", fontWeight: 600, fontSize: 13,
                                                display: "flex", alignItems: "center", gap: 4,
                                            }}><CheckCircle size={16} /> Onayla</button>
                                            <button onClick={() => handleKYCDecision(c.customer_id, "rejected")} style={{
                                                padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                                                background: "#ef4444", color: "#fff", fontWeight: 600, fontSize: 13,
                                                display: "flex", alignItems: "center", gap: 4,
                                            }}><XCircle size={16} /> Reddet</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    }
                </div>
            )}

            {/* Customers Tab */}
            {tab === "customers" && (
                <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="İsim veya TC ile ara..." style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={fetchCustomers} style={{ ...primaryBtn }}>
                            <Search size={16} /> Ara
                        </button>
                    </div>

                    {selectedCustomer ? (
                        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border-color)" }}>
                            <button onClick={() => setSelectedCustomer(null)} style={{ marginBottom: 12, background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13 }}>← Listeye Dön</button>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                                {selectedCustomer.customer?.first_name} {selectedCustomer.customer?.last_name}
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                                <div style={infoCard}><strong>TC:</strong> {selectedCustomer.customer?.national_id}</div>
                                <div style={infoCard}><strong>E-posta:</strong> {selectedCustomer.user?.email}</div>
                                <div style={infoCard}><strong>Durum:</strong> {selectedCustomer.customer?.status}</div>
                            </div>
                            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Hesaplar ({selectedCustomer.accounts?.length || 0})</h4>
                            {selectedCustomer.accounts?.map((a) => (
                                <div key={a.account_id} style={{ ...infoCard, marginBottom: 6 }}>
                                    {a.account_number} — {a.account_type} ({a.currency}) — {a.status}
                                </div>
                            ))}
                            <h4 style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Son İşlemler ({selectedCustomer.recent_transactions?.length || 0})</h4>
                            {selectedCustomer.recent_transactions?.slice(0, 10).map((t) => (
                                <div key={t.entry_id} style={{ ...infoCard, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                                    <span>{t.category} — {t.description}</span>
                                    <span style={{ fontWeight: 700, color: t.type === "CREDIT" ? "#22c55e" : "#ef4444" }}>
                                        {t.type === "CREDIT" ? "+" : "-"}{fmt(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {customers.map((c) => (
                                <div key={c.customer_id} style={{
                                    background: "var(--bg-card)", borderRadius: 14, padding: 16,
                                    border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.first_name} {c.last_name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>TC: {c.national_id} • Durum: {c.status}</div>
                                    </div>
                                    <button onClick={() => viewCustomer(c.customer_id)} style={{ ...primaryBtn, padding: "6px 14px" }}>
                                        <Eye size={14} /> Detay
                                    </button>
                                </div>
                            ))}
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
                                background: "var(--bg-card)", borderRadius: 14, padding: 18,
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
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{m.body}</p>
                                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{m.sender_email} • {new Date(m.created_at).toLocaleDateString("tr-TR")}</span>

                                {m.reply && (
                                    <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "var(--bg-secondary)", borderLeft: "3px solid #22c55e" }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>Yanıt ({m.reply_by})</p>
                                        <p style={{ fontSize: 13 }}>{m.reply}</p>
                                    </div>
                                )}

                                {m.status === "open" && (
                                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                        <input value={m.message_id === replyText.split("::")[0] ? replyText.split("::")[1] || "" : ""}
                                            onChange={(e) => setReplyText(`${m.message_id}::${e.target.value}`)}
                                            placeholder="Yanıt yazın..." style={{ ...inputStyle, flex: 1 }} />
                                        <button onClick={() => {
                                            const parts = replyText.split("::");
                                            if (parts[0] === m.message_id) handleReply(m.message_id);
                                        }} style={{ ...primaryBtn, padding: "8px 14px" }}>Gönder</button>
                                    </div>
                                )}
                            </div>
                        ))
                    }
                </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const inputStyle = { padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none" };
const primaryBtn = { padding: "10px 18px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 };
const infoCard = { background: "var(--bg-secondary)", borderRadius: 10, padding: "8px 14px", fontSize: 13 };
