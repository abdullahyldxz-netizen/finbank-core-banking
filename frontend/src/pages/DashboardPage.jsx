import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { accountApi, customerApi, ledgerApi } from "../services/api";
import { Link } from "react-router-dom";
import {
    Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight,
    ArrowLeftRight, CreditCard, Plus, AlertCircle,
    Shield, Eye, EyeOff, Copy, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import QuickActionsWidget from "../components/QuickActionsWidget";
import SkeletonLoader from "../components/SkeletonLoader";

export default function DashboardPage() {
    const { user, isAdmin } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [copiedIban, setCopiedIban] = useState(null);
    const [recentTx, setRecentTx] = useState([]);
    const [customerForm, setCustomerForm] = useState({
        full_name: "",
        national_id: "",
        phone: "",
        date_of_birth: "",
        address: "",
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const accRes = await accountApi.listMine();
            setAccounts(accRes.data);
            const balanceMap = {};
            for (const acc of accRes.data) {
                try {
                    const balRes = await accountApi.getBalance(acc.id);
                    balanceMap[acc.id] = balRes.data.balance;
                } catch {
                    balanceMap[acc.id] = 0;
                }
            }
            setBalances(balanceMap);
            try {
                const custRes = await customerApi.getMe();
                setCustomer(custRes.data);
            } catch {
                setShowCustomerForm(true);
            }
            // Load recent transactions
            try {
                const txRes = await ledgerApi.getEntries({ skip: 0, limit: 5 });
                setRecentTx(txRes.data.entries || []);
            } catch {
                // ignore
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await customerApi.create(customerForm);
            setCustomer(res.data);
            setShowCustomerForm(false);
            toast.success("Müşteri profili oluşturuldu!");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Profil oluşturulamadı");
        }
    };

    const copyIban = (iban) => {
        navigator.clipboard.writeText(iban);
        setCopiedIban(iban);
        toast.success("IBAN kopyalandı!");
        setTimeout(() => setCopiedIban(null), 2000);
    };

    const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Günaydın";
        if (hour < 18) return "İyi günler";
        return "İyi akşamlar";
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p style={{ marginTop: 12, color: "var(--text-muted)" }}>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div>
            {/* ── Welcome Header ── */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                marginBottom: 28, flexWrap: "wrap", gap: 12,
            }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4, letterSpacing: -1 }}>
                        Merhaba! 👋
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 500 }}>
                        {customer?.full_name?.split(" ")[0] || user?.email?.split("@")[0]}, hoş geldin!
                    </p>
                </div>
                {customer && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: customer?.status === "active" ? "var(--success-bg)" : "var(--warning-bg)",
                        padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                        color: customer?.status === "active" ? "var(--success)" : "var(--warning)",
                    }}>
                        <Shield size={14} />
                        KYC: {customer?.status === "active" ? "Onaylandı" : "Beklemede"}
                    </div>
                )}
            </div>

            {/* ── Customer Registration Form (only if no profile) ── */}
            {showCustomerForm && !customer && (
                <div className="card" style={{ marginBottom: 24, borderLeft: "3px solid var(--warning)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <AlertCircle size={20} style={{ color: "var(--warning)" }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Müşteri Profili Oluşturun</h3>
                    </div>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: 14 }}>
                        Hesap açabilmek için önce müşteri profilinizi oluşturmanız gerekiyor.
                    </p>
                    <form onSubmit={createCustomer}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Ad Soyad</label>
                                <input
                                    className="form-input" placeholder="Ahmet Yılmaz"
                                    value={customerForm.full_name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                                    required minLength={2}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">TC Kimlik No</label>
                                <input
                                    className="form-input" placeholder="12345678901"
                                    value={customerForm.national_id}
                                    onChange={(e) => setCustomerForm({ ...customerForm, national_id: e.target.value })}
                                    required pattern="\d{11}" maxLength={11}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Telefon</label>
                                <input
                                    className="form-input" placeholder="+905551234567"
                                    value={customerForm.phone}
                                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Doğum Tarihi</label>
                                <input
                                    className="form-input" type="date"
                                    value={customerForm.date_of_birth}
                                    onChange={(e) => setCustomerForm({ ...customerForm, date_of_birth: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Adres (Opsiyonel)</label>
                            <input
                                className="form-input" placeholder="Ankara, Türkiye"
                                value={customerForm.address}
                                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">
                            Profili Oluştur
                        </button>
                    </form>
                </div>
            )}

            {/* ── Total Balance Card ── */}
            <div className="card" style={{
                marginBottom: 32, padding: "32px 24px",
                background: "linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)",
                border: "none",
                borderRadius: "32px",
                boxShadow: "0 16px 40px rgba(99, 102, 241, 0.4)",
                color: "white",
                textAlign: "center"
            }}>
                <div style={{ marginBottom: 12, opacity: 0.9, fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                    Toplam Bakiyen
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                    {showBalance
                        ? `₺${totalBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                        : "••••••••"
                    }
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16, marginBottom: 32,
            }}>
                {[
                    { to: "/customer/transfer", icon: "💸", label: "Para Gönder", bg: "linear-gradient(135deg, #10b981, #059669)" },
                    { to: "/customer/transfer", icon: "🤲", label: "İste", bg: "linear-gradient(135deg, #3b82f6, #2563eb)" },
                    { to: "/customer/transfer", icon: "📱", label: "Barkodla Öde", bg: "linear-gradient(135deg, #f59e0b, #d97706)" },
                    { to: "/customer/accounts", icon: "🏦", label: "Yeni Hesap", bg: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
                ].map((action) => (
                    <Link
                        key={action.label}
                        to={action.to}
                        className="quick-action-card"
                        style={{ background: action.bg }}
                        aria-label={action.label}
                    >
                        <div className="huge-emoji">
                            {action.icon}
                        </div>
                        {action.label}
                    </Link>
                ))}
            </div>

            {/* ── Account Cards ── */}
            {accounts.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Hesaplarım</h2>
                    <div className="card-grid">
                        {accounts.map((acc) => (
                            <div key={acc.id} className="account-card">
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: acc.account_type === "checking" ? "var(--accent)15" : "var(--success)15",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: acc.account_type === "checking" ? "var(--accent)" : "var(--success)",
                                        }}>
                                            <CreditCard size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                {acc.account_type === "checking" ? "Vadesiz Hesap" : "Tasarruf Hesabı"}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{acc.currency}</div>
                                        </div>
                                    </div>
                                    <span className={`badge ${acc.status === "active" ? "badge-success" : "badge-danger"}`}>
                                        {acc.status === "active" ? "Aktif" : "Pasif"}
                                    </span>
                                </div>

                                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                                    {showBalance
                                        ? `${(balances[acc.id] || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
                                        : "••••••"
                                    }
                                </div>

                                <div style={{
                                    background: "var(--bg-input)", borderRadius: 8, padding: "10px 12px",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                            IBAN
                                        </div>
                                        <div style={{ fontSize: 12, fontFamily: "monospace", letterSpacing: 0.5 }}>
                                            {acc.iban}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyIban(acc.iban)}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            color: copiedIban === acc.iban ? "var(--success)" : "var(--text-muted)",
                                            padding: 4,
                                        }}
                                        aria-label="IBAN kopyala"
                                    >
                                        {copiedIban === acc.iban ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Empty State ── */}
            {accounts.length === 0 && customer && (
                <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
                    <Wallet size={48} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, marginBottom: 8 }}>Henüz Hesabınız Yok</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
                        Hemen ilk banka hesabınızı açarak para transferi yapmaya başlayın.
                    </p>
                    <Link to="/customer/accounts" className="btn btn-primary" style={{ display: "inline-flex" }}>
                        <Plus size={16} /> İlk Hesabımı Aç
                    </Link>
                </div>
            )}

            {/* ── Recent Transactions ── */}
            {recentTx.length > 0 && (
                <div style={{ paddingBottom: 60 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ fontSize: 22, fontWeight: 800 }}>Son İşlemler</h3>
                        <Link to="/customer/ledger" style={{ fontSize: 15, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                            Tümünü Gör
                        </Link>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {recentTx.map((tx, i) => {
                            // Determine emoji based on transaction basic logic
                            const emoji = tx.category === "DEPOSIT" ? "💰" :
                                tx.category === "WITHDRAWAL" ? "🏧" :
                                    tx.category === "TRANSFER_IN" ? "📥" :
                                        tx.category === "TRANSFER_OUT" ? "📤" : "🛒";

                            return (
                                <div key={tx.id || i} className="card" style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "20px", borderRadius: "24px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{
                                            width: 56, height: 56, borderRadius: 18, display: "flex",
                                            alignItems: "center", justifyContent: "center", flexShrink: 0,
                                            background: "var(--bg-input)",
                                            fontSize: 28
                                        }}>
                                            {emoji}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                                                {tx.description || (tx.category === "DEPOSIT" ? "Para Yatırma"
                                                    : tx.category === "WITHDRAWAL" ? "Nakit Çekim"
                                                        : tx.category === "TRANSFER_IN" ? "Gelen Para"
                                                            : tx.category === "TRANSFER_OUT" ? "Giden Para"
                                                                : "Harcama")}
                                            </div>
                                            <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>
                                                {new Date(tx.created_at).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 800, fontSize: 20, letterSpacing: -0.5,
                                        color: tx.type === "CREDIT" ? "var(--success)" : "var(--text-primary)",
                                    }}>
                                        {tx.type === "CREDIT" ? "+" : "-"}
                                        ₺{Math.abs(tx.amount).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quick Actions Widget */}
            {user?.role === "customer" && (
                <div style={{ marginTop: 20 }}>
                    <QuickActionsWidget role="customer" />
                </div>
            )}
        </div>
    );
}
