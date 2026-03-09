import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { accountApi, transactionApi } from "../../services/api";
import { QrCode, Scan, ArrowRight, RefreshCw, XCircle, Wallet, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QRPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("receive"); // "receive" | "scan"

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    const [qrValue, setQrValue] = useState("");

    // Scanner state
    const [scanResult, setScanResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const res = await accountApi.listMine();
            const activeAccounts = Array.isArray(res.data)
                ? res.data.filter(a => a.status === "active")
                : res.data?.data?.filter(a => a.status === "active") || [];

            setAccounts(activeAccounts);
            if (activeAccounts.length > 0) {
                setSelectedAccount(activeAccounts[0].id || activeAccounts[0].account_id);
            }
        } catch (error) {
            toast.error("Hesaplar yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Generate QR string
    useEffect(() => {
        if (!selectedAccount) return;
        const targetAcc = accounts.find(a => (a.id || a.account_id) === selectedAccount);
        if (!targetAcc) return;

        const data = {
            type: "FINBANK_QR",
            alias: targetAcc.iban || targetAcc.account_number,
            name: user?.name || "Kullanıcı",
            amount: amount ? Number(amount) : null,
            desc: description
        };
        setQrValue(JSON.stringify(data));
    }, [selectedAccount, amount, description, accounts, user]);

    // Handle scanner initialization
    useEffect(() => {
        if (activeTab === "scan") {
            const scanner = new Html5QrcodeScanner("reader", {
                qrbox: { width: 250, height: 250 },
                fps: 5,
            });

            scanner.render(
                (decodedText) => {
                    try {
                        const parsed = JSON.parse(decodedText);
                        if (parsed.type === "FINBANK_QR" && parsed.alias) {
                            scanner.clear();
                            setScanResult(parsed);
                        } else {
                            toast.error("Geçersiz veya desteklenmeyen QR kod.");
                        }
                    } catch (e) {
                        toast.error("QR kod okunamadı.");
                    }
                },
                (error) => {
                    // console.warn(error);
                }
            );

            return () => {
                scanner.clear().catch(e => console.error("Scanner cleanup failed", e));
            };
        }
    }, [activeTab]);

    const handlePay = async (e) => {
        e.preventDefault();
        if (!scanResult || !selectedAccount) return;

        setProcessing(true);
        try {
            const target = scanResult.alias.trim();
            const payload = {
                from_account_id: selectedAccount,
                amount: Number(scanResult.amount),
                description: scanResult.desc ? `QR: ${scanResult.desc}` : "QR ile Ödeme"
            };

            if (target.toUpperCase().startsWith("TR")) {
                payload.target_iban = target;
            } else if (/^[a-f\d]{24}$/i.test(target)) {
                payload.to_account_id = target;
            } else {
                payload.target_alias = target;
            }

            await transactionApi.transfer(payload);
            toast.success("Ödeme başarıyla gerçekleşti!");
            setScanResult(null);
            setActiveTab("receive");
            await loadAccounts(); // refresh balance
        } catch (error) {
            toast.error(error.response?.data?.detail || "Ödeme yapılamadı.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">QR İşlemleri</h1>
                <p className="text-white/60 text-sm">QR kod ile hızlıca ödeme alın veya ödeme yapın.</p>
            </div>

            <div className="flex p-1.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 mb-8 overflow-hidden max-w-sm mx-auto shadow-inner">
                <button
                    onClick={() => { setActiveTab("receive"); setScanResult(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300
                        ${activeTab === "receive" ? 'bg-amber-500 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                    <QrCode size={18} /> Ödeme Al
                </button>
                <button
                    onClick={() => setActiveTab("scan")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300
                        ${activeTab === "scan" ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                    <Scan size={18} /> Ödeme Yap
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "receive" && (
                    <motion.div
                        key="receive"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-deepblue-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(245,158,11,0.1)] relative overflow-hidden"
                    >
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>

                        <div className="bg-white p-6 rounded-3xl shadow-2xl mx-auto w-fit mb-8 relative z-10">
                            <QRCode value={qrValue || "empty"} size={220} level="H" />
                            <div className="absolute inset-0 border-4 border-amber-500/0 rounded-3xl pointer-events-none group-hover:border-amber-500/20 transition-colors"></div>
                        </div>

                        <div className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-xs font-semibold text-amber-200/50 uppercase tracking-widest mb-2">Ödemenin Yansıyacağı Hesap</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-500/50 appearance-none pl-12"
                                        value={selectedAccount}
                                        onChange={e => setSelectedAccount(e.target.value)}
                                    >
                                        {accounts.map(a => (
                                            <option key={a.id || a.account_id} value={a.id || a.account_id} className="bg-slate-800 text-white">
                                                {a.account_number} - {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(a.balance || 0))}
                                            </option>
                                        ))}
                                    </select>
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Belirli Tutar (Opsiyonel)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-amber-400 font-bold">₺</span>
                                        </div>
                                        <input
                                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white font-mono text-lg focus:outline-none focus:border-amber-500/50"
                                            type="number" min="0.01" step="0.01"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Açıklama (Opsiyonel)</label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 px-4 py-4 text-white focus:outline-none focus:border-amber-500/50"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Örn: Akşam yemeği"
                                        />
                                        <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-white/40 bg-black/20 p-3 rounded-lg border border-white/5">
                                    QR kodunuz anlık olarak güncellenmektedir. Sadece gösterin ve ödeme alın.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "scan" && (
                    <motion.div
                        key="scan"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        {!scanResult ? (
                            <div className="bg-deepblue-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-[0_0_40px_rgba(16,185,129,0.1)] overflow-hidden relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-10 animate-[scan-line_2s_ease-in-out_infinite]"></div>
                                {/* html5-qrcode renderer container */}
                                <div id="reader" className="w-full border-none rounded-2xl overflow-hidden [&_video]:rounded-2xl bg-black"></div>
                            </div>
                        ) : (
                            <div className="bg-deepblue-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden">
                                <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>

                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                                            <Scan size={20} />
                                        </div>
                                        <h3 className="text-xl font-black text-white">Ödeme Bilgileri</h3>
                                    </div>
                                    <button onClick={() => setScanResult(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="bg-black/30 p-5 rounded-2xl border border-white/5 mb-8 relative z-10">
                                    <div className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-1">Alıcı</div>
                                    <div className="text-lg font-bold text-white mb-4">{scanResult.name}</div>
                                    <div className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-1">Hesap / IBAN</div>
                                    <div className="font-mono text-emerald-200/80 mb-4">{scanResult.alias}</div>
                                    {scanResult.desc && (
                                        <>
                                            <div className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-1">Açıklama</div>
                                            <div className="text-sm font-medium text-white/80">{scanResult.desc}</div>
                                        </>
                                    )}
                                </div>

                                <form onSubmit={handlePay} className="space-y-6 relative z-10">
                                    <div>
                                        <label className="block text-xs font-semibold text-emerald-200/50 uppercase tracking-widest mb-2">Ödenecek Tutar</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <span className="text-emerald-400 font-bold text-2xl">₺</span>
                                            </div>
                                            <input
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 py-5 text-white text-3xl font-black tracking-tighter focus:outline-none focus:border-emerald-500/50 disabled:opacity-70 disabled:bg-black/60"
                                                type="number" min="0.01" step="0.01" required
                                                value={scanResult.amount || ""}
                                                onChange={e => setScanResult({ ...scanResult, amount: e.target.value })}
                                                disabled={scanResult.amount !== null && scanResult.amount !== undefined && scanResult.amount > 0} // disabled if QR had fixed amount
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Gönderilecek Hesap</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                                                value={selectedAccount}
                                                onChange={e => setSelectedAccount(e.target.value)}
                                                required
                                            >
                                                <option value="" disabled className="bg-slate-800">Hesap Seçin</option>
                                                {accounts.map(a => (
                                                    <option key={a.id || a.account_id} value={a.id || a.account_id} className="bg-slate-800 text-white">
                                                        {a.account_number} - {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(a.balance || 0))}
                                                    </option>
                                                ))}
                                            </select>
                                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <><RefreshCw size={20} className="animate-spin" /> İşleniyor...</>
                                        ) : (
                                            <><ArrowRight size={20} /> Ödemeyi Tamamla</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                /* Target HTML5 QRCode styles to make them fit glassmorphism */
                #reader { border: none !important; }
                #reader button {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 8px 16px;
                    font-weight: 600;
                    margin: 10px 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                #reader button:hover { background: rgba(255,255,255,0.2); }
                #reader select {
                    background: rgba(0,0,0,0.3);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 8px;
                    margin-bottom: 10px;
                    width: 100%;
                }
                #reader a { display: none !important; }
                #qr-shaded-region { border-width: 40px !important; border-color: rgba(0,0,0,0.7) !important; }

                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    40% { top: 100%; opacity: 0; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
