import { useState, useEffect } from "react";
import { CreditCard, Lock, Unlock, AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";
import { accountApi, cardApi } from "../services/api";
import toast from "react-hot-toast";

export default function CardControlsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null);
    const [showIban, setShowIban] = useState({});

    useEffect(() => { loadAccounts(); }, []);

    const loadAccounts = async () => {
        try {
            const res = await accountApi.listMine();
            setAccounts(Array.isArray(res.data) ? res.data : []);
        } catch { setAccounts([]); }
        finally { setLoading(false); }
    };

    const handleToggleFreeze = async (accountId) => {
        setToggling(accountId);
        try {
            const res = await cardApi.toggleFreeze(accountId);
            toast.success(res.data.message);
            loadAccounts();
        } catch (err) {
            toast.error(err.response?.data?.detail || "İşlem başarısız.");
        } finally { setToggling(null); }
    };

    const toggleIban = (id) => {
        setShowIban(prev => ({ ...prev, [id]: !prev[id] }));
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
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                    🔒 Kart & Hesap Kontrolleri
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                    Hesaplarınızı dondurabilir veya aktifleştirebilirsiniz.
                </p>
            </div>

            {/* Info Banner */}
            <div style={{
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 14, padding: "14px 18px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 12,
            }}>
                <AlertTriangle size={20} color="#f59e0b" />
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                    Hesabı dondurmak tüm işlemleri geçici olarak durdurur. İstediğiniz zaman tekrar aktifleştirebilirsiniz.
                </p>
            </div>

            {accounts.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: "center" }}>
                    <CreditCard size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
                    <p style={{ color: "var(--text-muted)" }}>Henüz hesabınız bulunmuyor.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 14 }}>
                    {accounts.map((acc) => {
                        const isFrozen = acc.status === "frozen";
                        return (
                            <div key={acc.id} className="card" style={{
                                padding: 0, overflow: "hidden",
                                border: isFrozen ? "2px solid rgba(239,68,68,0.3)" : "1px solid var(--border-color)",
                            }}>
                                {/* Card Header */}
                                <div style={{
                                    background: isFrozen
                                        ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
                                        : "linear-gradient(135deg, #1e3a5f, #2563eb)",
                                    padding: "20px 24px", color: "#fff",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                                                {acc.account_type === "checking" ? "Vadesiz Hesap" : "Tasarruf Hesabı"}
                                            </div>
                                            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
                                                •••• •••• •••• {acc.account_number?.slice(-4)}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: "4px 12px", borderRadius: 20,
                                            background: isFrozen ? "rgba(255,255,255,0.15)" : "rgba(16,185,129,0.3)",
                                            fontSize: 11, fontWeight: 600,
                                        }}>
                                            {isFrozen ? "❄️ Dondurulmuş" : "✅ Aktif"}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: "18px 24px" }}>
                                    <div style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        marginBottom: 14, flexWrap: "wrap", gap: 12,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>IBAN</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>
                                                {showIban[acc.id]
                                                    ? acc.iban
                                                    : "TR** **** **** **** **** **** **"}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleIban(acc.id)}
                                            style={{
                                                background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                                                borderRadius: 8, padding: "6px 12px", fontSize: 12,
                                                color: "var(--text-secondary)", cursor: "pointer",
                                                display: "flex", alignItems: "center", gap: 6,
                                            }}
                                        >
                                            {showIban[acc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            {showIban[acc.id] ? "Gizle" : "Göster"}
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        <button
                                            onClick={() => handleToggleFreeze(acc.id)}
                                            disabled={toggling === acc.id}
                                            style={{
                                                flex: 1, minWidth: 150, padding: "12px 18px", borderRadius: 12,
                                                border: "none", cursor: "pointer",
                                                fontWeight: 600, fontSize: 14,
                                                background: isFrozen
                                                    ? "linear-gradient(135deg, #10b981, #34d399)"
                                                    : "linear-gradient(135deg, #ef4444, #f87171)",
                                                color: "#fff",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                                transition: "all 0.2s",
                                                opacity: toggling === acc.id ? 0.6 : 1,
                                            }}
                                        >
                                            {toggling === acc.id ? (
                                                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                            ) : isFrozen ? (
                                                <><Unlock size={16} /> Hesabı Aktifleştir</>
                                            ) : (
                                                <><Lock size={16} /> Hesabı Dondur</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Security Info */}
            <div style={{
                marginTop: 24, padding: "16px 20px", borderRadius: 14,
                background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                display: "flex", alignItems: "center", gap: 12,
            }}>
                <Shield size={20} color="var(--accent)" />
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                    Tüm kart kontrol işlemleri 256-bit şifreleme ile korunmaktadır.
                    Şüpheli bir işlem fark ederseniz hemen hesabınızı dondurun.
                </p>
            </div>
        </div>
    );
}
