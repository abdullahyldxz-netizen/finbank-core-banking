import { useState, useEffect } from "react";
import { accountApi } from "../services/api";
import toast from "react-hot-toast";
import { Plus, CreditCard } from "lucide-react";

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAccount, setNewAccount] = useState({
        account_type: "checking",
        currency: "TRY",
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const res = await accountApi.listMine();
            setAccounts(res.data);
            const bMap = {};
            for (const acc of res.data) {
                try {
                    const b = await accountApi.getBalance(acc.id);
                    bMap[acc.id] = b.data.balance;
                } catch { bMap[acc.id] = 0; }
            }
            setBalances(bMap);
        } catch (err) {
            toast.error("Hesaplar yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await accountApi.create(newAccount);
            toast.success("Hesap başarıyla açıldı!");
            setShowModal(false);
            loadAccounts();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Hesap açılamadı");
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner" /></div>;
    }

    return (
        <div style={{ paddingBottom: 80 }}>
            <div className="page-header" style={{ textAlign: "center", marginBottom: 32 }}>
                <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>Kartlarım 💳</h1>
                <p>Hesaplarını ve kartlarını yönet</p>
                <div style={{ marginTop: 24 }}>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ borderRadius: "var(--radius-full)", padding: "16px 32px", fontSize: 18, fontWeight: 800 }}>
                        <Plus size={24} style={{ marginRight: 8 }} /> Yeni Kart Ekle
                    </button>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="empty-state">
                    <CreditCard size={48} style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: 12 }}>Henüz hesabınız yok. Yeni hesap açmak için yukarıdaki butona tıklayın.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                    {accounts.map((acc, index) => {
                        // Alternate gradients for each card to make it playful
                        const gradients = [
                            "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)", // Pinkish
                            "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", // Purple/Pink
                            "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", // Green/Blue
                            "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)", // Purple/Blue
                        ];
                        const bgGradient = gradients[index % gradients.length];

                        return (
                            <div key={acc.id} style={{
                                background: bgGradient,
                                borderRadius: 32, padding: 32, color: "#1a1a2e",
                                position: "relative", overflow: "hidden",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                                border: "1px solid rgba(255,255,255,0.3)"
                            }}>
                                <div style={{ position: "absolute", right: -40, top: -40, width: 150, height: 150, background: "rgba(255,255,255,0.2)", borderRadius: "50%" }}></div>
                                <div style={{ position: "absolute", left: -20, bottom: -20, width: 100, height: 100, background: "rgba(255,255,255,0.2)", borderRadius: "50%" }}></div>

                                <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                                    <span style={{
                                        background: "rgba(255,255,255,0.4)", padding: "8px 16px",
                                        borderRadius: 20, fontWeight: 800, fontSize: 13, backdropFilter: "blur(4px)"
                                    }}>
                                        {acc.account_type === "checking" ? "💵 VADESİZ" : "🐖 TASARRUF"}
                                    </span>
                                    <span style={{ fontWeight: 900, fontSize: 18 }}>FinBank</span>
                                </div>
                                <div style={{ position: "relative", zIndex: 1, marginTop: 40, marginBottom: 20 }}>
                                    <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>
                                        {(balances[acc.id] || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} <span style={{ fontSize: 24 }}>{acc.currency}</span>
                                    </div>
                                </div>
                                <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                    <div>
                                        <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 600, letterSpacing: 1 }}>HESAP NO</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2 }}>{acc.account_number}</div>
                                    </div>
                                    <div style={{ fontSize: 40 }}>🏦</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── New Account Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Yeni Hesap Aç</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Hesap Türü</label>
                                <select
                                    className="form-select"
                                    value={newAccount.account_type}
                                    onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                                >
                                    <option value="checking">Vadesiz Hesap</option>
                                    <option value="savings">Tasarruf Hesabı</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Para Birimi</label>
                                <select
                                    className="form-select"
                                    value={newAccount.currency}
                                    onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                                >
                                    <option value="TRY">TRY - Türk Lirası</option>
                                    <option value="USD">USD - Amerikan Doları</option>
                                    <option value="EUR">EUR - Euro</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Hesap Aç
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
