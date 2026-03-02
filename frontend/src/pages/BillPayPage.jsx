import { useState, useEffect } from "react";
import {
    Zap, Droplets, Flame, Wifi, Phone, FileText,
    CreditCard, Clock, CheckCircle, Send,
} from "lucide-react";
import { billsApi, accountApi } from "../services/api";
import toast from "react-hot-toast";

const BILL_TYPES = [
    { id: "electric", label: "Elektrik", icon: Zap, color: "#f59e0b" },
    { id: "water", label: "Su", icon: Droplets, color: "#3b82f6" },
    { id: "gas", label: "Doğalgaz", icon: Flame, color: "#ef4444" },
    { id: "internet", label: "İnternet", icon: Wifi, color: "#8b5cf6" },
    { id: "phone", label: "Telefon", icon: Phone, color: "#10b981" },
    { id: "other", label: "Diğer", icon: FileText, color: "#6b7280" },
];

export default function BillPayPage() {
    const [accounts, setAccounts] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [activeTab, setActiveTab] = useState("pay");
    const [selectedType, setSelectedType] = useState(null);
    const [form, setForm] = useState({
        account_id: "",
        provider: "",
        subscriber_no: "",
        amount: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [accRes, histRes] = await Promise.allSettled([
                accountApi.listMine(),
                billsApi.history(),
            ]);
            setAccounts(accRes.status === "fulfilled" ? (Array.isArray(accRes.value.data) ? accRes.value.data : []) : []);
            setHistory(histRes.status === "fulfilled" ? (Array.isArray(histRes.value.data) ? histRes.value.data : []) : []);
        } catch { }
        finally { setLoading(false); }
    };

    const handlePay = async (e) => {
        e.preventDefault();
        if (!selectedType || !form.account_id || !form.provider || !form.subscriber_no || !form.amount) {
            toast.error("Lütfen tüm alanları doldurun.");
            return;
        }
        setPaying(true);
        try {
            await billsApi.pay({
                account_id: form.account_id,
                bill_type: selectedType,
                provider: form.provider,
                subscriber_no: form.subscriber_no,
                amount: parseFloat(form.amount),
            });
            toast.success("Fatura başarıyla ödendi! ✅");
            setForm({ account_id: "", provider: "", subscriber_no: "", amount: "" });
            setSelectedType(null);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Ödeme başarısız.");
        } finally { setPaying(false); }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val || 0);

    const formatDate = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString("tr-TR", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: 900 }}>
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>💡 Fatura Ödeme</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                    Elektrik, su, doğalgaz ve daha fazla faturanızı kolayca ödeyin.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <TabBtn active={activeTab === "pay"} onClick={() => setActiveTab("pay")}>
                    💳 Fatura Öde
                </TabBtn>
                <TabBtn active={activeTab === "history"} onClick={() => setActiveTab("history")}>
                    📜 Ödeme Geçmişi ({history.length})
                </TabBtn>
            </div>

            {/* Pay Tab */}
            {activeTab === "pay" && (
                <div className="card" style={{ padding: 24 }}>
                    {/* Bill Type Selection */}
                    <div style={{ marginBottom: 20 }}>
                        <label className="form-label">Fatura Türü</label>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                            gap: 10,
                        }}>
                            {BILL_TYPES.map((bt) => {
                                const Icon = bt.icon;
                                return (
                                    <button
                                        key={bt.id}
                                        onClick={() => setSelectedType(bt.id)}
                                        style={{
                                            padding: "14px 10px", borderRadius: 14, border: "none",
                                            cursor: "pointer", textAlign: "center",
                                            background: selectedType === bt.id
                                                ? `linear-gradient(135deg, ${bt.color}, ${bt.color}88)`
                                                : "var(--bg-secondary)",
                                            color: selectedType === bt.id ? "#fff" : "var(--text-secondary)",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <Icon size={22} style={{ marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
                                        <div style={{ fontSize: 12, fontWeight: 600 }}>{bt.label}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedType && (
                        <form onSubmit={handlePay}>
                            <div className="form-group">
                                <label className="form-label">Hesap Seçin</label>
                                <select
                                    className="form-input"
                                    value={form.account_id}
                                    onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                                    required
                                >
                                    <option value="">Hesap seçin...</option>
                                    {accounts.filter(a => a.status === "active").map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.account_number} ({a.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Kurum / Sağlayıcı</label>
                                    <input
                                        className="form-input"
                                        placeholder="Örn: TEDAŞ, İGDAŞ..."
                                        value={form.provider}
                                        onChange={(e) => setForm({ ...form, provider: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Abone No</label>
                                    <input
                                        className="form-input"
                                        placeholder="Abone numaranız"
                                        value={form.subscriber_no}
                                        onChange={(e) => setForm({ ...form, subscriber_no: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tutar (₺)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={paying}
                                style={{ width: "100%", height: 48, fontSize: 16, fontWeight: 600, marginTop: 8 }}
                            >
                                {paying ? (
                                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                ) : (
                                    <><Send size={18} /> Fatura Öde</>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
                <div>
                    {history.length === 0 ? (
                        <div className="card" style={{ padding: 40, textAlign: "center" }}>
                            <Clock size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
                            <p style={{ color: "var(--text-muted)" }}>Henüz fatura ödemesi bulunmuyor.</p>
                        </div>
                    ) : history.map((bill, i) => {
                        const bt = BILL_TYPES.find(b => b.id === bill.bill_type) || BILL_TYPES[5];
                        const Icon = bt.icon;
                        return (
                            <div key={bill.bill_id || i} className="card" style={{
                                padding: 16, marginBottom: 10,
                                display: "flex", alignItems: "center", gap: 14,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: `${bt.color}20`, color: bt.color,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <Icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                                        {bill.provider} — {bt.label}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                        Abone: {bill.subscriber_no} · {formatDate(bill.paid_at)}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                                        {formatCurrency(bill.amount)}
                                    </div>
                                    <span style={{
                                        fontSize: 11, padding: "2px 8px", borderRadius: 6,
                                        background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 600,
                                    }}>
                                        <CheckCircle size={10} /> Ödendi
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function TabBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick} style={{
            padding: "10px 18px", borderRadius: 12, border: "none",
            fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
            background: active ? "linear-gradient(135deg, #6366f1, #818cf8)" : "var(--bg-secondary)",
            color: active ? "#fff" : "var(--text-secondary)",
            transition: "all 0.2s",
        }}>
            {children}
        </button>
    );
}
