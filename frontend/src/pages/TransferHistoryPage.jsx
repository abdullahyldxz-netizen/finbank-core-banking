import { useState, useEffect, useCallback } from "react";
import { History, ArrowUpRight, ArrowDownLeft, Search, Filter, Calendar, Loader2, Download } from "lucide-react";
import { ledgerApi } from "../services/api";

export default function TransferHistoryPage() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: "", category: "", search: "" });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (filter.type) params.type = filter.type;
            if (filter.category) params.category = filter.category;
            const res = await ledgerApi.list(params);
            setEntries(res.data.data || res.data);
            setTotal(res.data.total || res.data.length);
        } catch { /* */ }
        setLoading(false);
    }, [page, filter.type, filter.category]);

    useEffect(() => { fetch(); }, [fetch]);

    const fmt = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0);

    const filtered = entries.filter((e) =>
        !filter.search || (e.description || "").toLowerCase().includes(filter.search.toLowerCase()) ||
        (e.category || "").toLowerCase().includes(filter.search.toLowerCase())
    );

    const exportCSV = () => {
        const header = "Tarih,Tür,Kategori,Açıklama,Tutar\n";
        const rows = filtered.map((e) =>
            `${new Date(e.created_at).toLocaleDateString("tr-TR")},${e.type},${e.category},${e.description},${e.amount}`
        ).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transfer_gecmisi_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Summary
    const totalIn = filtered.filter((e) => e.type === "CREDIT").reduce((s, e) => s + (e.amount || 0), 0);
    const totalOut = filtered.filter((e) => e.type === "DEBIT").reduce((s, e) => s + (e.amount || 0), 0);

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                    <History size={28} color="#6366f1" /> Transfer Geçmişi
                </h1>
                <button onClick={exportCSV} style={{
                    padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color)",
                    background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
                }}><Download size={16} /> CSV İndir</button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                <div style={{ ...cardStyle, borderLeft: "4px solid #22c55e" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Toplam Gelen</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>+{fmt(totalIn)}</div>
                </div>
                <div style={{ ...cardStyle, borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Toplam Giden</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>-{fmt(totalOut)}</div>
                </div>
                <div style={{ ...cardStyle, borderLeft: "4px solid #6366f1" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Net</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: totalIn - totalOut >= 0 ? "#22c55e" : "#ef4444" }}>
                        {fmt(totalIn - totalOut)}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-secondary)" }} />
                    <input value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        placeholder="Açıklama veya kategori ara..." style={{ ...inputStyle, paddingLeft: 36 }} />
                </div>
                <select value={filter.type} onChange={(e) => { setFilter({ ...filter, type: e.target.value }); setPage(1); }} style={selectStyle}>
                    <option value="">Tüm Türler</option>
                    <option value="CREDIT">Gelen</option>
                    <option value="DEBIT">Giden</option>
                </select>
                <select value={filter.category} onChange={(e) => { setFilter({ ...filter, category: e.target.value }); setPage(1); }} style={selectStyle}>
                    <option value="">Tüm Kategoriler</option>
                    {["transfer", "deposit", "withdrawal", "bill_payment", "fee", "interest", "goal_contribution"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: 16 }}>
                    İşlem bulunamadı.
                </div>
            ) : (
                <div style={{ background: "var(--bg-card)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    {filtered.map((e, i) => (
                        <div key={e.entry_id || i} style={{
                            padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                            borderBottom: i < filtered.length - 1 ? "1px solid var(--border-color)" : "none",
                            transition: "background 0.15s",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: e.type === "CREDIT" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: e.type === "CREDIT" ? "#22c55e" : "#ef4444",
                                }}>
                                    {e.type === "CREDIT" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{e.description || "İşlem"}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", gap: 8, marginTop: 2 }}>
                                        <span>{e.category}</span>
                                        <span>•</span>
                                        <span>{new Date(e.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                fontSize: 15, fontWeight: 700,
                                color: e.type === "CREDIT" ? "#22c55e" : "#ef4444",
                            }}>
                                {e.type === "CREDIT" ? "+" : "-"}{fmt(e.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={pgBtn}>← Önceki</button>
                <span style={{ padding: "8px 12px", fontSize: 13 }}>Sayfa {page}</span>
                <button disabled={filtered.length < limit} onClick={() => setPage(page + 1)} style={pgBtn}>Sonraki →</button>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const cardStyle = { background: "var(--bg-card)", borderRadius: 14, padding: "14px 18px", border: "1px solid var(--border-color)" };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" };
const selectStyle = { padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer" };
const pgBtn = { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 };
