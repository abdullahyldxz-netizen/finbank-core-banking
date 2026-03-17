import { useCallback, useEffect, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Download,
    Filter,
    History,
    Loader2,
    Search,
    SplitSquareHorizontal,
    XCircle,
    RefreshCw
} from "lucide-react";
import { transactionApi, paymentRequestsApi } from "../services/api";
import { toast } from "react-hot-toast";

const CATEGORY_OPTIONS = [
    { value: "", label: "Tüm kategoriler" },
    { value: "DEPOSIT", label: "Para Yatırma" },
    { value: "WITHDRAWAL", label: "Para Çekme" },
    { value: "TRANSFER_IN", label: "Gelen Transfer" },
    { value: "TRANSFER_OUT", label: "Giden Transfer" },
    { value: "BILL_PAYMENT", label: "Fatura Ödemesi" },
    { value: "CARD_PAYMENT", label: "Kart Ödemesi" },
    { value: "GOAL_CONTRIBUTION", label: "Birikim Hedefi" },
];

const TYPE_OPTIONS = [
    { value: "", label: "Tüm yönler" },
    { value: "CREDIT", label: "Girişler" },
    { value: "DEBIT", label: "Çıkışlar" },
];

const CATEGORY_LABELS = {
    DEPOSIT: "Para Yatırma",
    WITHDRAWAL: "Para Çekme",
    TRANSFER_IN: "Gelen Transfer",
    TRANSFER_OUT: "Giden Transfer",
    BILL_PAYMENT: "Fatura Ödemesi",
    CARD_PAYMENT: "Kart Ödemesi",
    GOAL_CONTRIBUTION: "Birikim Hedefi",
};

export default function TransferHistoryPage() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ type: "", category: "", search: "" });
    const limit = 20;

    // Split Bill modal
    const [splitModal, setSplitModal] = useState({ show: false, entry: null });
    const [splitForm, setSplitForm] = useState({ target_alias: "", amount: "", description: "" });
    const [splitLoading, setSplitLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (filter.type) params.type = filter.type;
            if (filter.category) params.category = filter.category;
            if (filter.search.trim()) params.search = filter.search.trim();

            const res = await transactionApi.history(params);
            setEntries(Array.isArray(res.data?.data) ? res.data.data : []);
            setTotal(Number(res.data?.total || 0));
        } catch (error) {
            setEntries([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [filter.category, filter.search, filter.type, page]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const formatMoney = (value) => new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value || 0);

    const exportCsv = () => {
        if (!entries.length) return;
        const header = "Tarih,Tip,Kategori,Açıklama,Tutar\n";
        const rows = entries.map((entry) => {
            const date = new Date(entry.created_at).toLocaleString("tr-TR");
            const type = entry.type === "CREDIT" ? "Giriş" : "Çıkış";
            const category = CATEGORY_LABELS[entry.category] || entry.category || "İşlem";
            const description = (entry.description || "").replaceAll(",", " ");
            return `${date},${type},${category},${description},${entry.amount}`;
        });
        const blob = new Blob([header + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `islem-gecmisi-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const totalIn = entries
        .filter((entry) => entry.type === "CREDIT")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const totalOut = entries
        .filter((entry) => entry.type === "DEBIT")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const hasNextPage = page * limit < total;

    const openSplitModal = (entry) => {
        setSplitForm({
            target_alias: "",
            amount: (Number(entry.amount) / 2).toFixed(2),
            description: `Ödeme paylaşımı: ${entry.description || CATEGORY_LABELS[entry.category] || "İşlem"}`
        });
        setSplitModal({ show: true, entry });
    };

    const handleSplitSubmit = async (e) => {
        e.preventDefault();
        setSplitLoading(true);
        try {
            await paymentRequestsApi.create({
                target_alias: splitForm.target_alias,
                amount: Number(splitForm.amount),
                description: splitForm.description
            });
            toast.success("Ödeme isteği gönderildi.");
            setSplitModal({ show: false, entry: null });
        } catch (error) {
            toast.error(error.response?.data?.detail || "İstek gönderilemedi.");
        } finally {
            setSplitLoading(false);
        }
    };

    return (
        <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                        <History size={28} color="#2563eb" /> İşlem Geçmişi
                    </h1>
                    <p style={{ color: "var(--text-secondary)", margin: "8px 0 0" }}>
                        Para hareketlerinizi, transferlerinizi ve ödemelerinizi tek ekrandan takip edin.
                    </p>
                </div>
                <button onClick={exportCsv} style={secondaryButtonStyle}>
                    <Download size={16} /> CSV İndir
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                <SummaryCard label="Toplam Giriş" value={`+${formatMoney(totalIn)}`} accent="#10b981" />
                <SummaryCard label="Toplam Çıkış" value={`-${formatMoney(totalOut)}`} accent="#ef4444" />
                <SummaryCard label="Net Hareket" value={formatMoney(totalIn - totalOut)} accent="#2563eb" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-secondary)" }} />
                    <input
                        value={filter.search}
                        onChange={(event) => {
                            setPage(1);
                            setFilter((prev) => ({ ...prev, search: event.target.value }));
                        }}
                        placeholder="Açıklama veya kategori ara"
                        style={{ ...inputStyle, paddingLeft: 38 }}
                    />
                </div>

                <select
                    value={filter.type}
                    onChange={(event) => {
                        setPage(1);
                        setFilter((prev) => ({ ...prev, type: event.target.value }));
                    }}
                    style={inputStyle}
                >
                    {TYPE_OPTIONS.map((option) => (
                        <option key={option.value || "all"} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <div style={{ position: "relative" }}>
                    <Filter size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-secondary)" }} />
                    <select
                        value={filter.category}
                        onChange={(event) => {
                            setPage(1);
                            setFilter((prev) => ({ ...prev, category: event.target.value }));
                        }}
                        style={{ ...inputStyle, paddingLeft: 38 }}
                    >
                        {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value || "all"} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 56 }}>
                    <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
                </div>
            ) : entries.length === 0 ? (
                <div style={emptyStateStyle}>
                    Bu filtrelere uygun işlem bulunamadı.
                </div>
            ) : (
                <div style={listStyle}>
                    {entries.map((entry, index) => {
                        const isCredit = entry.type === "CREDIT";
                        return (
                            <div key={entry.id || entry.entry_id || index} style={{ ...rowStyle, borderBottom: index < entries.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 14,
                                        background: isCredit ? "rgba(16,185,129,0.14)" : "rgba(239,68,68,0.14)",
                                        color: isCredit ? "#10b981" : "#ef4444",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                                            {entry.description || CATEGORY_LABELS[entry.category] || "Finansal İşlem"}
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            <span>{CATEGORY_LABELS[entry.category] || entry.category || "Diğer"}</span>
                                            <span>•</span>
                                            <span>{new Date(entry.created_at).toLocaleString("tr-TR")}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: isCredit ? "#10b981" : "#ef4444" }}>
                                        {isCredit ? "+" : "-"}{formatMoney(Math.abs(entry.amount))}
                                    </div>
                                    {!isCredit ? (
                                        <button
                                            onClick={() => openSplitModal(entry)}
                                            style={{
                                                background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                                                borderRadius: 8, padding: "4px 8px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "var(--text-primary)"
                                            }}
                                        >
                                            <SplitSquareHorizontal size={14} /> Paylaş
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 18 }}>
                <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} style={paginationButtonStyle}>
                    Geri
                </button>
                <span style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Sayfa {page}
                </span>
                <button disabled={!hasNextPage} onClick={() => setPage((prev) => prev + 1)} style={paginationButtonStyle}>
                    İleri
                </button>
            </div>

            {/* Split Modal */}
            {splitModal.show && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Harcama Paylaş</h2>
                            <button onClick={() => setSplitModal({ show: false, entry: null })} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                            Bu işlem için başkasından ödeme isteyebilirsiniz. Tutar otomatik olarak ikiye bölünür, isterseniz değiştirebilirsiniz.
                        </p>
                        <form onSubmit={handleSplitSubmit} style={{ display: "grid", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>İstenen Kişi (Telefon, E-posta veya TCKN)</label>
                                <input
                                    className="form-input"
                                    value={splitForm.target_alias}
                                    onChange={e => setSplitForm(prev => ({ ...prev, target_alias: e.target.value }))}
                                    placeholder="Örn: 5XX1234567"
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Tutar (İstenecek miktar)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    step="0.01" min="0.01"
                                    value={splitForm.amount}
                                    onChange={e => setSplitForm(prev => ({ ...prev, amount: e.target.value }))}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Açıklama</label>
                                <input
                                    className="form-input"
                                    value={splitForm.description}
                                    onChange={e => setSplitForm(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <button type="submit" disabled={splitLoading} style={primaryButtonStyle}>
                                {splitLoading ? <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Paylaşım İsteği Gönder"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
        </div>
    );
}

function SummaryCard({ label, value, accent }) {
    return (
        <div style={{ background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)", borderRadius: 20, padding: "18px 20px", border: "1px solid var(--glass-border)", borderLeft: `6px solid ${accent}`, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)", transition: "all 0.3s ease" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{value}</div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid var(--glass-border)",
    background: "rgba(0,0,0,0.2)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    backdropFilter: "blur(10px)"
};

const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: 8,
};

const modalOverlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 999
};

const modalContentStyle = {
    background: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    border: "1px solid var(--glass-border)",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 24px 64px rgba(0,0,0,0.4)"
};

const primaryButtonStyle = {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity 0.2s",
    marginTop: 8
};

const secondaryButtonStyle = {
    padding: "12px 20px",
    borderRadius: 14,
    border: "1px solid var(--glass-border)",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "var(--glass-blur)",
    color: "var(--text-primary)",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s ease"
};

const emptyStateStyle = {
    background: "rgba(255, 255, 255, 0.02)",
    backdropFilter: "var(--glass-blur)",
    borderRadius: 24,
    border: "1px solid var(--glass-border)",
    color: "var(--text-secondary)",
    textAlign: "center",
    padding: 64,
    fontSize: 15
};

const listStyle = {
    background: "rgba(255, 255, 255, 0.02)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    borderRadius: 24,
    border: "1px solid var(--glass-border)",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
};

const rowStyle = {
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    transition: "background 0.2s ease"
};

const paginationButtonStyle = {
    padding: "12px 20px",
    borderRadius: 14,
    border: "1px solid var(--glass-border)",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "var(--glass-blur)",
    color: "var(--text-primary)",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease"
};
