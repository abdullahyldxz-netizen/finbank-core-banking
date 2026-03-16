import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Eye,
    EyeOff,
    HandCoins,
    Landmark,
    Plus,
    QrCode,
    ReceiptText,
    Send,
    ShieldCheck,
    Sparkles,
    Wallet,
} from "lucide-react";
import { accountApi, customerApi, ledgerApi } from "../services/api";
import {
    BankActionTile,
    BankEmptyState,
    BankGlassCard,
    BankListRow,
    BankMetricCard,
    BankPageHeader,
    BankSectionCard,
} from "../components/banking/BankUi";
import TransactionReceipt from "../components/TransactionReceipt";

const onboardingFields = [
    { key: "full_name", label: "Full Name", type: "text", placeholder: "Example: John Doe" },
    { key: "national_id", label: "National ID", type: "text", placeholder: "11-digit ID number" },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+90 5xx xxx xx xx" },
    { key: "date_of_birth", label: "Date of Birth", type: "date" },
    { key: "address", label: "Address", type: "text", placeholder: "District, city, country" },
];

export default function DashboardPage() {
    const [accounts, setAccounts] = useState([]);
    const [balances, setBalances] = useState({});
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [recentTx, setRecentTx] = useState([]);
    const [selectedTx, setSelectedTx] = useState(null);
    const [customerForm, setCustomerForm] = useState({
        full_name: "",
        national_id: "",
        phone: "",
        date_of_birth: "",
        address: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const accountsRes = await accountApi.listMine();
            const nextAccounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
            setAccounts(nextAccounts);

            const balanceEntries = await Promise.all(
                nextAccounts.map(async (account) => {
                    const accountId = account.id || account.account_id;
                    try {
                        const balanceRes = await accountApi.getBalance(accountId);
                        return [accountId, Number(balanceRes.data?.balance || 0)];
                    } catch {
                        return [accountId, Number(account.balance || 0)];
                    }
                }),
            );
            setBalances(Object.fromEntries(balanceEntries));

            try {
                const customerRes = await customerApi.getMe();
                setCustomer(customerRes.data);
            } catch {
                setCustomer(null);
            }

            try {
                const txRes = await ledgerApi.getEntries({ skip: 0, limit: 6 });
                setRecentTx(Array.isArray(txRes.data?.entries) ? txRes.data.entries : Array.isArray(txRes.data) ? txRes.data : []);
            } catch {
                setRecentTx([]);
            }
        } catch (error) {
            toast.error("Unable to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    const createCustomer = async (event) => {
        event.preventDefault();
        try {
            const res = await customerApi.create(customerForm);
            setCustomer(res.data);
            toast.success("Your customer profile has been created.");
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Profile creation failed.");
        }
    };

    const totalBalance = useMemo(
        () => Object.values(balances).reduce((sum, value) => sum + Number(value || 0), 0),
        [balances],
    );

    const spendingBars = [42, 68, 54, 82, 63, 74, 88];

    const formatCurrency = (value, currency = "TRY") => new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

    const maskedBalance = showBalance ? formatCurrency(totalBalance) : "••••••••";

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <BankPageHeader
                eyebrow="Premium Dashboard"
                title={`Welcome${customer?.full_name ? `, ${customer.full_name.split(" ")[0]}` : ""}`}
                description="Manage your current balance, transaction flow, and quick banking actions at a glance.">
            </BankPageHeader>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
                <BankGlassCard className="relative overflow-hidden rounded-[2rem] border-white/10 bg-[linear-gradient(135deg,rgba(8,15,32,0.94),rgba(18,29,58,0.86))] shadow-[0_30px_70px_rgba(2,6,23,0.38)]">
                    <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-primary/16 blur-3xl" />
                    <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-violet-500/12 blur-3xl" />
                    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                                <Sparkles size={12} />
                                Premium banking view
                            </div>
                            <p className="bank-section-label mb-3 text-[11px]">Total Available Balance</p>
                            <div className="flex items-center gap-3">
                                <h2 className="font-display text-5xl font-black tracking-[-0.07em] text-white sm:text-6xl">{maskedBalance}</h2>
                                <button type="button" onClick={() => setShowBalance((current) => !current)} className="bank-icon-button shrink-0">
                                    {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                                Smart summary panel; aggregates current, foreign currency, and linked card balances in one premium surface.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:w-[18rem]">
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                                <p className="bank-section-label mb-2 text-[11px]">Active Accounts</p>
                                <p className="text-lg font-bold text-white">{accounts.length}</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">Individual portfolio</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                                <p className="bank-section-label mb-2 text-[11px]">Last 7 Days</p>
                                <p className="text-lg font-bold text-emerald-300">+2.4%</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">Net growth</p>
                            </div>
                        </div>
                    </div>
                </BankGlassCard>

                <BankSectionCard
                    title="Quick Actions"
                    description="Launch daily banking workflows with a single click."
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <BankActionTile icon={Send} title="Send Money" description="Instant transfer via IBAN, account, or easy address." to="/customer/transfer" tone="primary" />
                        <BankActionTile icon={HandCoins} title="Request Money" description="Create and track payment requests from your contacts." to="/customer/payment-requests" tone="success" />
                        <BankActionTile icon={QrCode} title="QR Actions" description="Scan via mobile, make quick collections or payments." to="/customer/qr" tone="secondary" />
                        <BankActionTile icon={ReceiptText} title="Pay Bills" description="Manage your regular payments securely." to="/customer/bills" tone="warning" />
                    </div>
                </BankSectionCard>
            </div>

            {!customer ? (
                <BankSectionCard
                    title="Complete your profile"
                    description="Your identity profile must be completed for account opening and secure banking features."
                >
                    <form onSubmit={createCustomer} className="grid gap-4 lg:grid-cols-2">
                        {onboardingFields.map((field) => (
                            <label key={field.key} className={field.key === "address" ? "lg:col-span-2" : ""}>
                                <span className="form-label">{field.label}</span>
                                <input
                                    type={field.type}
                                    className="form-input"
                                    placeholder={field.placeholder}
                                    value={customerForm[field.key]}
                                    onChange={(event) => setCustomerForm((current) => ({ ...current, [field.key]: event.target.value }))}
                                    required={field.key !== "address"}
                                    maxLength={field.key === "national_id" ? 11 : undefined}
                                />
                            </label>
                        ))}
                        <div className="lg:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                            <button type="submit" className="bank-primary-btn">
                                <Plus size={18} />
                                Create Profile
                            </button>
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                                <AlertCircle size={14} />
                                Information is verified for banking processes.
                            </div>
                        </div>
                    </form>
                </BankSectionCard>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <BankMetricCard icon={Wallet} label="Total Balance" value={formatCurrency(totalBalance)} delta="Customer asset total" tone="primary" />
                        <BankMetricCard icon={Landmark} label="Main Account" value={accounts[0]?.account_type === "savings" ? "Savings" : "Current"} delta={accounts[0]?.iban ? `${accounts[0].iban.slice(0, 8)}…` : "No accounts yet"} tone="secondary" />
                        <BankMetricCard icon={ShieldCheck} label="Security" value={customer?.status === "active" ? "Active" : "Under Review"} delta="Banking protection enabled" tone="success" />
                    </div>

                    <BankSectionCard title="My Accounts" description="View balance and card mapping of each account in a single panel.">
                        <div className="grid gap-4 md:grid-cols-2">
                            {accounts.length === 0 ? (
                                <BankEmptyState icon={Wallet} title="No accounts yet" description="Your first account will appear here once created." />
                            ) : accounts.map((account, index) => {
                                const accountId = account.id || account.account_id;
                                const currency = account.currency || "TRY";
                                const balance = balances[accountId] || 0;
                                return (
                                    <BankGlassCard key={accountId} className="relative overflow-hidden rounded-[1.7rem] border-white/8 bg-white/[0.03]">
                                        <div className={`absolute inset-x-0 top-0 h-1 ${index % 2 === 0 ? "bg-primary" : "bg-violet-400"}`} />
                                        <p className="bank-section-label mb-3 text-[11px]">{account.account_name || (account.account_type === "savings" ? "Savings Account" : "TRY Current")}</p>
                                        <h3 className="font-display text-3xl font-black tracking-[-0.06em] text-[var(--text-primary)]">{formatCurrency(balance, currency)}</h3>
                                        <div className="mt-5 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                                            <span>{account.iban ? `${account.iban.slice(0, 8)} •••• ${account.iban.slice(-4)}` : (account.account_number || "")}</span>
                                            <Link to="/customer/accounts" className="text-primary no-underline">Detail</Link>
                                        </div>
                                    </BankGlassCard>
                                );
                            })}
                        </div>
                    </BankSectionCard>
                </div>

                <div className="space-y-6">
                    <BankSectionCard title="Spending Rhythm" description="See your account tempo with the last 7-day trend.">
                        <div className="flex items-end gap-3">
                            {spendingBars.map((value, index) => (
                                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                    <div className="relative h-44 w-full overflow-hidden rounded-t-[1.2rem] bg-white/[0.04]">
                                        <div
                                            className="absolute inset-x-0 bottom-0 rounded-t-[1.2rem] bg-gradient-to-t from-primary via-cyan-400 to-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.24)]"
                                            style={{ height: `${value}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </BankSectionCard>

                    <BankSectionCard title="Recent Transactions" description="Track your new activities in real-time." action={<Link to="/customer/ledger" className="text-sm font-bold text-primary no-underline">See All</Link>}>
                        <div className="space-y-3">
                            {recentTx.length === 0 ? (
                                <BankEmptyState icon={ReceiptText} title="No activities yet" description="Transaction flow will appear here after your first transfer or payment." className="py-8" />
                            ) : recentTx.map((tx, index) => {
                                const isCredit = tx.direction === "CREDIT" || tx.type === "CREDIT";
                                return (
                                    <div key={tx.id || tx.entry_id || index} className="flex grid-cols-[1fr_auto] items-center gap-4 py-1">
                                        <BankListRow
                                            leading={
                                                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isCredit ? "bg-emerald-500/14 text-emerald-400" : "bg-rose-500/14 text-rose-400"}`}>
                                                    {isCredit ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                                </span>
                                            }
                                            title={tx.description || (isCredit ? "Incoming transfer" : "Outgoing transaction")}
                                            description={new Date(tx.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                                            trailing={<span className={isCredit ? "amount-credit" : "amount-debit"}>{`${isCredit ? "+" : "-"}${formatCurrency(Math.abs(tx.amount || 0), tx.currency || "TRY")}`}</span>}
                                            className="flex-1 border-none bg-transparent"
                                        />
                                        <button 
                                            title="View Receipt"
                                            onClick={() => setSelectedTx(tx)}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <ReceiptText size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </BankSectionCard>
                </div>
            </div>

            {/* Receipt Modal */}
            <TransactionReceipt 
                transaction={selectedTx} 
                onPreviewClose={() => setSelectedTx(null)} 
            />
        </div>
    );
}
