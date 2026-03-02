import { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { analyticsApi } from "../services/api";

const CATEGORY_LABELS = {
    WITHDRAWAL: "Para Çekme",
    TRANSFER_OUT: "Transfer (Giden)",
    DEPOSIT: "Para Yatırma",
    TRANSFER_IN: "Transfer (Gelen)",
};
const CATEGORY_COLORS = {
    WITHDRAWAL: "#ef4444",
    TRANSFER_OUT: "#f59e0b",
    DEPOSIT: "#22c55e",
    TRANSFER_IN: "#3b82f6",
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

    if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} /></div>;

    const totalSpent = data?.by_category?.reduce((s, c) => s + c.total, 0) || 0;

    return (
        <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <BarChart3 size={28} color="#8b5cf6" /> Harcama Analizi
            </h1>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
                <SummaryCard icon={<TrendingDown size={24} />} label="Toplam Harcama (30 gün)" value={fmt(totalSpent)} color="#ef4444" />
                <SummaryCard icon={<PieChart size={24} />} label="İşlem Sayısı" value={data?.by_category?.reduce((s, c) => s + c.count, 0) || 0} color="#6366f1" />
                <SummaryCard icon={<TrendingUp size={24} />} label="Kategori Sayısı" value={data?.by_category?.length || 0} color="#10b981" />
            </div>

            {/* Category Breakdown */}
            <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border-color)", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>📊 Kategorilere Göre Harcama</h2>
                {(!data?.by_category || data.by_category.length === 0) ? (
                    <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 30 }}>Henüz harcama verisi yok.</p>
                ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                        {data.by_category.map((c) => {
                            const pct = totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0;
                            const color = CATEGORY_COLORS[c.category] || "#6366f1";
                            return (
                                <div key={c.category}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <span style={{ fontSize: 14, fontWeight: 500 }}>{CATEGORY_LABELS[c.category] || c.category}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(c.total)} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 4, background: "var(--bg-secondary)", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%", borderRadius: 4, width: `${pct}%`,
                                            background: color, transition: "width 0.6s ease",
                                        }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{c.count} işlem</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Daily Trends */}
            <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border-color)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>📈 Günlük Hareketler</h2>
                {(!data?.daily || data.daily.length === 0) ? (
                    <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 30 }}>Günlük veri yok.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <th style={thStyle}>Tarih</th>
                                    <th style={thStyle}>Tür</th>
                                    <th style={{ ...thStyle, textAlign: "right" }}>Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.daily.map((d, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                        <td style={tdStyle}>{d.date}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                background: d.type === "CREDIT" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                                color: d.type === "CREDIT" ? "#22c55e" : "#ef4444",
                                            }}>
                                                {d.type === "CREDIT" ? "Gelen" : "Giden"}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: d.type === "CREDIT" ? "#22c55e" : "#ef4444" }}>
                                            {d.type === "CREDIT" ? "+" : "-"}{fmt(d.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function SummaryCard({ icon, label, value, color }) {
    return (
        <div style={{
            background: "var(--bg-card)", borderRadius: 16, padding: 20,
            border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 14,
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${color}20`, color,
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
            </div>
        </div>
    );
}

const thStyle = { padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textAlign: "left" };
const tdStyle = { padding: "10px 12px", fontSize: 13 };
