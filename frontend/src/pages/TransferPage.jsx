import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    ArrowDownLeft,
    ArrowUpRight,
    BadgeCheck,
    CheckCircle2,
    Copy,
    Landmark,
    ScanLine,
    Send,
    Sparkles,
    Wallet,
} from "lucide-react";
import { accountApi, transactionApi, cardsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    BankEmptyState,
    BankGlassCard,
    BankListRow,
    BankPageHeader,
    BankSectionCard,
    SegmentedTabs,
} from "../components/banking/BankUi";

const tabConfig = {
    transfer: {
        label: "Transfer",
        title: "Para Transferi",
        description: "IBAN, hesap numarası veya kolay adres ile anında gönderim.",
        button: "Gönder",
        tone: "primary",
    },
    deposit: {
        label: "Para Yatır",
        title: "Hesaba Para Yatır",
        description: "Seçili hesaba güvenli yatırım işlemi oluştur.",
        button: "Yatırımı Başlat",
        tone: "success",
    },
    withdraw: {
        label: "Para Çek",
        title: "Hesaptan Para Çek",
        description: "Operasyon kaydı oluşturarak çekim talebi gönder.",
        button: "Çekim Talebi Oluştur",
        tone: "warning",
    },
};

export default function TransferPage() {
    const { user } = useAuth();
    const rolePath = `/${user?.role || "customer"}`;
    const [activeTab, setActiveTab] = useState("transfer");
    const [accounts, setAccounts] = useState([]);
    const [easyAddresses, setEasyAddresses] = useState([]);
    const [balances, setBalances] = useState({});
    const [accountId, setAccountId] = useState("");
    const [target, setTarget] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [bootLoading, setBootLoading] = useState(true);
    const [receipt, setReceipt] = useState(null);
    const [commissionWarning, setCommissionWarning] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setBootLoading(true);
        try {
            const [accountsRes, aliasesRes, cardsRes] = await Promise.all([
                accountApi.listMine(),
                accountApi.listEasyAddresses(),
                cardsApi.getMyCards().catch(() => ({ data: [] })),
            ]);
            let nextAccounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
            const nextAliases = Array.isArray(aliasesRes.data) ? aliasesRes.data : [];
            const nextCards = Array.isArray(cardsRes.data) ? cardsRes.data : [];

            // Add Credit Cards to the accounts list for Transfer funding
            nextCards.forEach(card => {
                if (card.status === "active") {
                    nextAccounts.push({
                        id: card.id || card.card_id,
                        account_id: card.id || card.card_id,
                        account_name: card.card_name || "Kredi Kartı",
                        account_number: card.card_number,
                        balance: card.available_limit,
                        account_type: "credit",
                        currency: "TRY"
                    });
                }
            });

            setAccounts(nextAccounts);
            setEasyAddresses(nextAliases);

            const nextBalances = {};
            nextAccounts.forEach((account) => {
                const id = account.id || account.account_id;
                nextBalances[id] = Number(account.balance || 0) + Number(account.overdraft_limit || 0);
            });
            setBalances(nextBalances);
            if (!accountId && nextAccounts[0]) {
                setAccountId(nextAccounts[0].id || nextAccounts[0].account_id);
            }
        } catch {
            toast.error("Transfer verileri yüklenemedi.");
        } finally {
            setBootLoading(false);
        }
    };

    const selectedAccount = useMemo(
        () => accounts.find((account) => (account.id || account.account_id) === accountId),
        [accounts, accountId],
    );

    const activeConfig = tabConfig[activeTab];

    const setDemoTarget = (value) => {
        if (!value) return;
        setTarget(value);
    };

    // Calculate commission warnings whenever amount, target or account changes
    useEffect(() => {
        if (activeTab !== "transfer" || !selectedAccount || !amount || Number(amount) <= 0) {
            setCommissionWarning(null);
            return;
        }

        let fee = 0;
        let message = "";
        const parsedAmount = Number(amount);

        // 1. Credit Card Cash Advance Fee
        if (selectedAccount.account_type === "credit") {
            fee = (parsedAmount * 0.025) + 15.0;
            message = "Nakit Avans İşlem Ücreti";
        } 
        // 2. EFT Fee (External transfer)
        else if (target && !target.toUpperCase().startsWith("TRF") && target.toUpperCase().startsWith("TR")) {
            fee = 5.0;
            message = "Banka Dışı Transfer (EFT) Ücreti";
        }

        if (fee > 0) {
            setCommissionWarning({ fee, message, total: parsedAmount + fee });
        } else {
            setCommissionWarning(null);
        }
    }, [amount, target, selectedAccount, activeTab]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!amount || Number(amount) <= 0) {
            toast.error("Geçerli bir tutar gir.");
            return;
        }

        setLoading(true);
        try {
            if (activeTab === "transfer") {
                if (!target.trim()) {
                    toast.error("Alıcı bilgisi gerekli.");
                    setLoading(false);
                    return;
                }
                const payload = { from_account_id: accountId, amount: Number(amount), description };
                const normalizedTarget = target.trim();
                if (normalizedTarget.toUpperCase().startsWith("TR")) payload.target_iban = normalizedTarget;
                else if (/^[a-f\d]{24}$/i.test(normalizedTarget)) payload.to_account_id = normalizedTarget;
                else payload.target_alias = normalizedTarget;

                await transactionApi.transfer(payload);
                setReceipt({
                    type: "Transfer",
                    amount: Number(amount),
                    date: new Date().toLocaleString("tr-TR"),
                    target: normalizedTarget,
                    description,
                    reference: `FIN-${Date.now().toString(36).toUpperCase()}`,
                });
            }

            if (activeTab === "deposit") {
                await transactionApi.deposit({ account_id: accountId, amount: Number(amount), description });
                setReceipt({
                    type: "Para Yatırma",
                    amount: Number(amount),
                    date: new Date().toLocaleString("tr-TR"),
                    target: selectedAccount?.account_name || "Seçili hesap",
                    description,
                    reference: `DEP-${Date.now().toString(36).toUpperCase()}`,
                });
            }

            if (activeTab === "withdraw") {
                await transactionApi.withdraw({ account_id: accountId, amount: Number(amount), description });
                setReceipt({
                    type: "Para Çekme",
                    amount: Number(amount),
                    date: new Date().toLocaleString("tr-TR"),
                    target: selectedAccount?.account_name || "Seçili hesap",
                    description,
                    reference: `WTH-${Date.now().toString(36).toUpperCase()}`,
                });
            }

            setTarget("");
            setAmount("");
            setDescription("");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "İşlem başarısız.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

    if (bootLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
            </div>
        );
    }

    if (receipt) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <BankPageHeader
                    eyebrow="İşlem Özeti"
                    title="Başarılı Banka İşlemi"
                    description="Referans kodunu saklayabilir veya yeni bir hareket başlatabilirsin."
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <button type="button" onClick={() => navigator.clipboard?.writeText(receipt.reference).then(() => toast.success("Referans kopyalandı."))} className="bank-secondary-btn">
                                <Copy size={16} />
                                Referansı Kopyala
                            </button>
                            <button type="button" onClick={() => setReceipt(null)} className="bank-primary-btn">
                                <Send size={16} />
                                Yeni İşlem
                            </button>
                        </div>
                    }
                />

                <BankGlassCard className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(8,15,32,0.94),rgba(18,29,58,0.86))] p-8 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/12 text-emerald-300">
                        <CheckCircle2 size={36} />
                    </div>
                    <p className="bank-section-label mb-2 text-[11px]">{receipt.type}</p>
                    <h2 className="font-display text-5xl font-black tracking-[-0.07em] text-white">{formatCurrency(receipt.amount)}</h2>
                    <p className="mt-3 text-sm text-slate-300">{receipt.date}</p>
                    <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                        <BankListRow title="Hedef" description={receipt.target || "-"} />
                        <BankListRow title="Referans" description={receipt.reference} />
                        <BankListRow title="Açıklama" description={receipt.description || "Ek not girilmedi"} className="sm:col-span-2" />
                    </div>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link to={`${rolePath}/dashboard`} className="bank-secondary-btn no-underline">Panele Dön</Link>
                        <Link to={`${rolePath}/history`} className="bank-primary-btn no-underline">Geçmişi Gör</Link>
                    </div>
                </BankGlassCard>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <BankPageHeader
                eyebrow="Transfer Workspace"
                title={activeConfig.title}
                description={activeConfig.description}
                actions={<SegmentedTabs tabs={Object.entries(tabConfig).map(([id, item]) => ({ id, label: item.label }))} active={activeTab} onChange={setActiveTab} />}
            />

            <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
                <BankSectionCard title="İşlem Formu" description="Gönderen hesap, hedef ve tutar alanlarını doldur.">
                    <form onSubmit={handleSubmit} className="grid gap-5">
                        <label>
                            <span className="form-label">Gönderen Hesap</span>
                            <select className="form-select" value={accountId} onChange={(event) => setAccountId(event.target.value)} required>
                                {accounts.map((account) => {
                                    const id = account.id || account.account_id;
                                    const isCredit = account.account_type === "credit";
                                    return (
                                        <option key={id} value={id}>
                                            {isCredit ? "💳 " : "🏦 "}{account.account_name || account.account_number || "Hesap"} - {formatCurrency(balances[id])}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>

                        {activeTab === "transfer" ? (
                            <label>
                                <span className="form-label">Alıcı Bilgisi</span>
                                <div className="relative">
                                    <input
                                        className="form-input"
                                        style={{ paddingRight: "3rem" }}
                                        placeholder="IBAN, hesap ID veya kolay adres"
                                        value={target}
                                        onChange={(event) => setTarget(event.target.value)}
                                        required
                                    />
                                    <ScanLine size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                </div>
                            </label>
                        ) : null}

                        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                            <label>
                                <span className="form-label">Tutar</span>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">₺</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        className="form-input text-3xl font-black tracking-[-0.05em]"
                                        style={{ paddingLeft: "3rem" }}
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(event) => setAmount(event.target.value)}
                                        required
                                    />
                                </div>
                            </label>

                            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 md:min-w-[16rem]">
                                <p className="bank-section-label mb-2 text-[11px]">Kullanılabilir</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(balances[accountId] || 0)}</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedAccount?.account_name || "Seçili hesap"}</p>
                            </div>
                        </div>

                        <label>
                            <span className="form-label">Açıklama</span>
                            <input
                                className="form-input"
                                placeholder="Örn. kira, ödeme, avans"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </label>

                        {commissionWarning && activeTab === "transfer" && (
                            <div className="rounded-[1.2rem] border border-amber-500/20 bg-amber-500/10 p-4">
                                <div className="flex items-start gap-3">
                                    <ArrowUpRight size={18} className="mt-0.5 text-amber-500" />
                                    <div>
                                        <h4 className="font-semibold text-amber-500">{commissionWarning.message}</h4>
                                        <p className="mt-1 text-sm text-amber-500/80">Bu işlem için bakiyenizden ekstra <strong>{formatCurrency(commissionWarning.fee)}</strong> komisyon tahsil edilecektir.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="bank-primary-btn w-full justify-center !min-h-[3.7rem]">
                            {loading ? "İşleniyor..." : activeConfig.button}
                        </button>
                    </form>
                </BankSectionCard>

                <div className="space-y-6">
                    <BankGlassCard className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(8,15,32,0.94),rgba(18,29,58,0.86))]">
                        <p className="bank-section-label mb-3 text-[11px]">Transfer Özeti</p>
                        <h3 className="font-display text-4xl font-black tracking-[-0.06em] text-white">{formatCurrency(balances[accountId] || 0)}</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-300">Seçili hesap bakiyesi üzerinden işlemini doğrula ve işlem tipine göre uygun akışı başlat.</p>
                        <div className="mt-6 grid gap-3">
                            <BankListRow
                                leading={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/14 text-primary"><Wallet size={18} /></span>}
                                title={selectedAccount?.account_name || "Seçili hesap yok"}
                                description={selectedAccount?.iban || selectedAccount?.account_number || "Aktif kaynak hesap"}
                            />
                            <BankListRow
                                leading={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/14 text-emerald-400"><BadgeCheck size={18} /></span>}
                                title="Güvenli Bankacılık"
                                description="Her işlem çok katmanlı doğrulama ve log kayıtları ile korunur."
                            />
                        </div>
                    </BankGlassCard>

                    {activeTab === "transfer" ? (
                        <BankSectionCard title="Hızlı Kişiler" description="Sık kullanılan adreslerden birini seçip formu otomatik doldur.">
                            <div className="space-y-3">
                                {easyAddresses.length === 0 ? (
                                    <BankEmptyState icon={Landmark} title="Kayıtlı kolay adres yok" description="Kolay adres eklediğinde burada hızlı gönderim kartları görünür." className="py-8" />
                                ) : easyAddresses.map((address, index) => (
                                    <BankListRow
                                        key={address.id || index}
                                        leading={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/14 text-violet-400"><Send size={18} /></span>}
                                        title={address.label || address.alias_type || "Kolay adres"}
                                        description={address.alias_value}
                                        trailing={<button type="button" onClick={() => setDemoTarget(address.alias_value)} className="text-sm font-bold text-primary">Seç</button>}
                                    />
                                ))}
                            </div>
                        </BankSectionCard>
                    ) : (
                        <BankSectionCard title="İşlem Notları" description="Yatırım ve çekim talepleri audit log akışına dahil edilir.">
                            <div className="space-y-3">
                                <BankListRow leading={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/14 text-emerald-400"><ArrowDownLeft size={18} /></span>} title="Para Yatırma" description="Şube veya operasyon ekibi tarafından doğrulanır." />
                                <BankListRow leading={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/14 text-amber-300"><ArrowUpRight size={18} /></span>} title="Para Çekme" description="İşlem sonrası müşteri hareketlerinde otomatik görünür." />
                                <BankListRow leading={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/14 text-primary"><Sparkles size={18} /></span>} title="FinBank Akıllı Akış" description="İşlem referansı ve detayları otomatik oluşturulur." />
                            </div>
                        </BankSectionCard>
                    )}
                </div>
            </div>
        </div>
    );
}
