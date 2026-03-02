import { useState, useEffect } from "react";
import {
    Users, FileCheck, Activity, Search,
    CheckCircle, XCircle, Clock, Eye,
    ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { customerApi, accountApi, ledgerApi } from "../../services/api";
import toast from "react-hot-toast";

export default function EmployeePortalPage() {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [recentTx, setRecentTx] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, todayTx: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

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
            const [cusRes, ledRes] = await Promise.allSettled([
                customerApi.listAll(),
                ledgerApi.getEntries({ limit: 10 }),
            ]);

            const cusList = cusRes.status === "fulfilled" ? (Array.isArray(cusRes.value.data) ? cusRes.value.data : []) : [];
            const txList = ledRes.status === "fulfilled" ? (Array.isArray(ledRes.value.data) ? ledRes.value.data : []) : [];

            setCustomers(cusList);
            setFilteredCustomers(cusList);
            setRecentTx(txList.slice(0, 8));

            setStats({
                total: cusList.length,
                pending: cusList.filter(c => c.kyc_status === "PENDING").length,
                verified: cusList.filter(c => c.kyc_status === "VERIFIED").length,
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
                kyc_status: action === "approve" ? "VERIFIED" : "REJECTED",
            });
            toast.success(action === "approve" ? "KYC onaylandı! ✅" : "KYC reddedildi.");
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "İşlem başarısız.");
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val || 0);

    const tabs = [
        { id: "overview", label: "📊 Genel Bakış", icon: Activity },
        { id: "customers", label: "👥 Müşteriler", icon: Users },
        { id: "kyc", label: "📋 KYC Onay", icon: FileCheck },
    ];

    if (loading) {
        return (
            <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: 1200 }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                    👔 Çalışan İşlem Paneli
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                    Müşteri yönetimi, KYC onay ve işlem takibi
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: "flex", gap: 8, marginBottom: 24,
                overflowX: "auto", paddingBottom: 4,
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "10px 20px", borderRadius: 12, border: "none",
                            fontWeight: 600, fontSize: 14, cursor: "pointer",
                            whiteSpace: "nowrap",
                            background: activeTab === tab.id
                                ? "linear-gradient(135deg, #3b82f6, #60a5fa)"
                                : "var(--bg-secondary)",
                            color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                            transition: "all 0.2s",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <>
                    {/* Stats */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 14, marginBottom: 24,
                    }}>
                        <StatCard icon={<Users size={20} />} label="Toplam Müşteri" value={stats.total}
                            gradient="linear-gradient(135deg, #3b82f6, #60a5fa)" />
                        <StatCard icon={<Clock size={20} />} label="Bekleyen KYC" value={stats.pending}
                            gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" />
                        <StatCard icon={<CheckCircle size={20} />} label="Onaylı Müşteri" value={stats.verified}
                            gradient="linear-gradient(135deg, #10b981, #34d399)" />
                        <StatCard icon={<Activity size={20} />} label="Son İşlemler" value={stats.todayTx}
                            gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" />
                    </div>

                    {/* Recent Transactions */}
                    <div className="card">
                        <div className="card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
                            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Eye size={18} /> Son İşlemler
                            </h2>
                        </div>
                        <div>
                            {recentTx.length === 0 ? (
                                <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                                    Henüz işlem kaydı yok.
                                </div>
                            ) : recentTx.map((tx, i) => (
                                <div key={i} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 16px", borderBottom: i < recentTx.length - 1 ? "1px solid var(--border-color)" : "none",
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                                            {tx.type === "DEPOSIT" ? "💰 Yatırma" :
                                                tx.type === "WITHDRAW" ? "💸 Çekme" :
                                                    tx.type === "TRANSFER" ? "🔄 Transfer" : tx.type}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                            {tx.account_id?.slice(0, 8)}...
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 700, fontSize: 14,
                                        color: tx.direction === "DEBIT" ? "var(--danger)" : "var(--success)",
                                    }}>
                                        {tx.direction === "DEBIT" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                        {formatCurrency(Math.abs(tx.amount))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Customers Tab */}
            {activeTab === "customers" && (
                <div className="card">
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                        <div style={{ position: "relative" }}>
                            <Search size={16} style={{
                                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                                color: "var(--text-muted)",
                            }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Müşteri ara... (isim veya e-posta)"
                                style={{ paddingLeft: 38 }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {filteredCustomers.length === 0 ? (
                        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                            {searchTerm ? "Sonuç bulunamadı." : "Kayıtlı müşteri yok."}
                        </div>
                    ) : filteredCustomers.map((c, i) => (
                        <div key={c._id || i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "14px 20px",
                            borderBottom: i < filteredCustomers.length - 1 ? "1px solid var(--border-color)" : "none",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontWeight: 700, fontSize: 14,
                                }}>
                                    {(c.full_name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.full_name || "—"}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.email || "—"}</div>
                                </div>
                            </div>
                            <span style={{
                                padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                                background: c.kyc_status === "VERIFIED" ? "rgba(16,185,129,0.15)" :
                                    c.kyc_status === "REJECTED" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                                color: c.kyc_status === "VERIFIED" ? "#10b981" :
                                    c.kyc_status === "REJECTED" ? "#ef4444" : "#f59e0b",
                            }}>
                                {c.kyc_status || "PENDING"}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* KYC Tab */}
            {activeTab === "kyc" && (
                <div className="card">
                    <div className="card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
                        <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FileCheck size={18} /> Bekleyen KYC Onayları
                        </h2>
                    </div>
                    {customers.filter(c => c.kyc_status === "PENDING").length === 0 ? (
                        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                            ✅ Bekleyen KYC onayı yok!
                        </div>
                    ) : customers.filter(c => c.kyc_status === "PENDING").map((c, i) => (
                        <div key={c._id || i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "14px 20px", flexWrap: "wrap", gap: 12,
                            borderBottom: "1px solid var(--border-color)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontWeight: 700, fontSize: 16,
                                }}>
                                    {(c.full_name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.full_name || "—"}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.email || "—"}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Tel: {c.phone || "—"}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => handleKycAction(c._id, "approve")}
                                    style={{
                                        padding: "8px 16px", borderRadius: 10, border: "none",
                                        background: "linear-gradient(135deg, #10b981, #34d399)",
                                        color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}
                                >
                                    <CheckCircle size={14} /> Onayla
                                </button>
                                <button
                                    onClick={() => handleKycAction(c._id, "reject")}
                                    style={{
                                        padding: "8px 16px", borderRadius: 10, border: "none",
                                        background: "linear-gradient(135deg, #ef4444, #f87171)",
                                        color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}
                                >
                                    <XCircle size={14} /> Reddet
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, gradient }) {
    return (
        <div style={{
            background: gradient, borderRadius: 14,
            padding: "18px 16px", color: "#fff",
        }}>
            <div style={{ marginBottom: 8, opacity: 0.9 }}>{icon}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
        </div>
    );
}
