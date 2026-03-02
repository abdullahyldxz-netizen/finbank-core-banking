import { useState, useEffect } from "react";
import {
    DollarSign, Users, TrendingUp, Activity, Clock,
    ArrowUpRight, ArrowDownRight, Eye, AlertTriangle,
} from "lucide-react";
import { customerApi, accountApi, ledgerApi, auditApi } from "../../services/api";

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [customersRes, accountsRes, ledgerRes, auditRes] = await Promise.allSettled([
                customerApi.listAll(),
                accountApi.listAll(),
                ledgerApi.getEntries({ limit: 10 }),
                auditApi.getLogs({ limit: 5 }),
            ]);

            const customers = customersRes.status === "fulfilled" ? customersRes.value.data : [];
            const accounts = accountsRes.status === "fulfilled" ? accountsRes.value.data : [];
            const ledger = ledgerRes.status === "fulfilled" ? ledgerRes.value.data : [];
            const audit = auditRes.status === "fulfilled" ? auditRes.value.data : [];

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
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);

    const cardStyle = (gradient) => ({
        background: gradient,
        borderRadius: 16, padding: "24px 20px", color: "#fff",
        position: "relative", overflow: "hidden",
    });

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
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                    👑 CEO Kontrol Paneli
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                    Banka genelindeki finansal durumun canlı görünümü
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16, marginBottom: 28,
            }}>
                {/* Toplam Mevduat */}
                <div style={cardStyle("linear-gradient(135deg, #d4af37, #b8860b)")}>
                    <div style={{ opacity: 0.2, position: "absolute", right: -10, top: -10 }}>
                        <DollarSign size={80} />
                    </div>
                    <DollarSign size={22} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Toplam Mevduat</div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>{formatCurrency(stats.totalDeposit)}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        <ArrowUpRight size={14} /> Tüm hesaplar toplamı
                    </div>
                </div>

                {/* Aktif Müşteri */}
                <div style={cardStyle("linear-gradient(135deg, #7c3aed, #a855f7)")}>
                    <div style={{ opacity: 0.2, position: "absolute", right: -10, top: -10 }}>
                        <Users size={80} />
                    </div>
                    <Users size={22} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Aktif Müşteri</div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.activeCustomers}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        <TrendingUp size={14} /> Kayıtlı kullanıcılar
                    </div>
                </div>

                {/* İşlem Sayısı */}
                <div style={cardStyle("linear-gradient(135deg, #059669, #10b981)")}>
                    <div style={{ opacity: 0.2, position: "absolute", right: -10, top: -10 }}>
                        <Activity size={80} />
                    </div>
                    <Activity size={22} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Son İşlem Sayısı</div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.todayTransactions}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={14} /> Toplam kayıtlı işlem
                    </div>
                </div>

                {/* İşlem Hacmi */}
                <div style={cardStyle("linear-gradient(135deg, #dc2626, #ef4444)")}>
                    <div style={{ opacity: 0.2, position: "absolute", right: -10, top: -10 }}>
                        <TrendingUp size={80} />
                    </div>
                    <TrendingUp size={22} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>İşlem Hacmi</div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>{formatCurrency(stats.todayVolume)}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        <ArrowUpRight size={14} /> Toplam hareket tutarı
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 20,
            }}>
                {/* Son İşlemler */}
                <div className="card" style={{ gridColumn: window.innerWidth < 768 ? "1 / -1" : undefined }}>
                    <div className="card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
                        <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Eye size={18} /> Son İşlemler
                        </h2>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                        {recentTx.length === 0 ? (
                            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                                Henüz işlem kaydı bulunmuyor.
                            </div>
                        ) : (
                            recentTx.map((tx, i) => (
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
                                        {tx.direction === "DEBIT" ? (
                                            <><ArrowDownRight size={14} /> -{formatCurrency(Math.abs(tx.amount))}</>
                                        ) : (
                                            <><ArrowUpRight size={14} /> +{formatCurrency(Math.abs(tx.amount))}</>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Son Denetim Kayıtları */}
                <div className="card" style={{ gridColumn: window.innerWidth < 768 ? "1 / -1" : undefined }}>
                    <div className="card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
                        <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <AlertTriangle size={18} /> Son Denetim Kayıtları
                        </h2>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                        {recentAudit.length === 0 ? (
                            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                                Henüz denetim kaydı bulunmuyor.
                            </div>
                        ) : (
                            recentAudit.map((log, i) => (
                                <div key={i} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 16px", borderBottom: i < recentAudit.length - 1 ? "1px solid var(--border-color)" : "none",
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                                            {log.action}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                            {log.user_email || "Sistem"}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                        background: log.outcome === "SUCCESS" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                        color: log.outcome === "SUCCESS" ? "#10b981" : "#ef4444",
                                    }}>
                                        {log.outcome}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
