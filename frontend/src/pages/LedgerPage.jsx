import { useState, useEffect } from "react";
import { ledgerApi } from "../services/api";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export default function LedgerPage() {
    const [entries, setEntries] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [skip, setSkip] = useState(0);
    const limit = 20;

    useEffect(() => {
        loadEntries();
    }, [skip]);

    const loadEntries = async () => {
        setLoading(true);
        try {
            const res = await ledgerApi.getEntries({ skip, limit });
            setEntries(res.data.entries);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const categoryLabel = {
        DEPOSIT: "Para Yatırma",
        WITHDRAWAL: "Para Çekme",
        TRANSFER_IN: "Gelen Transfer",
        TRANSFER_OUT: "Giden Transfer",
    };

    const categoryEmojis = {
        DEPOSIT: "💰",
        WITHDRAWAL: "💸",
        TRANSFER_IN: "📥",
        TRANSFER_OUT: "📤",
    };

    if (loading && entries.length === 0) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}><div className="spinner" /></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>📒 Hesap Defteri (Ledger)</h1>
                <p>Tüm finansal hareketlerin değiştirilemez kaydı — Toplam {total} kayıt</p>
            </div>

            {entries.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: 12 }}>Henüz hesap defteri kaydı yok.</p>
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {entries.map((e) => {
                            const isPositive = e.amount >= 0;
                            return (
                                <div key={e.id} style={{
                                    background: "var(--bg-card)",
                                    borderRadius: 24, padding: "20px",
                                    display: "flex", alignItems: "center", gap: 16,
                                    border: "1px solid var(--border-color)",
                                    boxShadow: "var(--shadow)"
                                }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: 20,
                                        background: isPositive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 32
                                    }}>
                                        {categoryEmojis[e.category] || "🧾"}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                                            {categoryLabel[e.category] || e.category}
                                        </div>
                                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                                            {new Date(e.created_at).toLocaleString("tr-TR", {
                                                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </div>
                                        {e.description && (
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
                                                "{e.description}"
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: 22, fontWeight: 900,
                                        color: isPositive ? "var(--success)" : "var(--text-primary)"
                                    }}>
                                        {isPositive ? "+" : ""}{e.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {/* Pagination */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 60px 0" }}>
                        <button
                            className="btn btn-outline"
                            style={{ borderRadius: "var(--radius-full)", padding: "12px 24px", fontWeight: 700 }}
                            onClick={() => setSkip(Math.max(0, skip - limit))}
                            disabled={skip === 0}
                        >
                            <ChevronLeft size={20} /> Önceki
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)", background: "var(--bg-card)", padding: "8px 16px", borderRadius: 20 }}>
                            {skip + 1} - {Math.min(skip + limit, total)} / {total}
                        </span>
                        <button
                            className="btn btn-outline"
                            style={{ borderRadius: "var(--radius-full)", padding: "12px 24px", fontWeight: 700 }}
                            onClick={() => setSkip(skip + limit)}
                            disabled={skip + limit >= total}
                        >
                            Sonraki <ChevronRight size={20} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
