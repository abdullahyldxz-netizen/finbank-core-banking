import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    Briefcase,
    CheckCircle,
    Clock,
    Eye,
    Landmark,
    Loader2,
    MessageSquare,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    UserRound,
    XCircle,
    FileText,
} from "lucide-react";
import { employeeApi, messagesApi } from "../services/api";

const CUSTOMER_PAGE_SIZE = 12;

export default function EmployeePanelPage() {
    const [tab, setTab] = useState("overview");
    const [dashboard, setDashboard] = useState(null);
    const [pendingKyc, setPendingKyc] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerTotal, setCustomerTotal] = useState(0);
    const [messages, setMessages] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const [page, setPage] = useState(1);
    const [notes, setNotes] = useState({});
    const [replies, setReplies] = useState({});
    const [busyKey, setBusyKey] = useState("");

    useEffect(() => {
        if (tab === "overview") loadOverview();
        if (tab === "kyc") loadPendingKyc();
        if (tab === "customers") loadCustomers();
        if (tab === "messages") loadMessages();
    }, [tab, page]);

    const loadOverview = async () => {
        setLoading(true);
        try {
            const [dashboardRes, kycRes, customerRes, messageRes] = await Promise.all([
                employeeApi.dashboard(),
                employeeApi.pendingKYC(),
                employeeApi.searchCustomers({ page: 1, limit: 8 }),
                messagesApi.inbox(),
            ]);
            setDashboard(dashboardRes.data);
            setPendingKyc(kycRes.data || []);
            setCustomers(customerRes.data?.data || []);
            setCustomerTotal(customerRes.data?.total || 0);
            setMessages(messageRes.data || []);
        } catch {
            toast.error("Employee dashboard verileri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const loadPendingKyc = async () => {
        setLoading(true);
        try {
            const res = await employeeApi.pendingKYC();
            setPendingKyc(res.data || []);
        } catch {
            toast.error("KYC kuyruğu yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const res = await employeeApi.searchCustomers({ q: searchQ || undefined, page, limit: CUSTOMER_PAGE_SIZE });
            setCustomers(res.data?.data || []);
            setCustomerTotal(res.data?.total || 0);
        } catch {
            toast.error("Müşteri listesi yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        setLoading(true);
        try {
            const res = await messagesApi.inbox();
            setMessages(res.data || []);
        } catch {
            toast.error("Mesaj listesi yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const openCustomer = async (customerId) => {
        setDetailLoading(true);
        try {
            const res = await employeeApi.getCustomer(customerId);
            setSelectedCustomer(res.data);
        } catch {
            toast.error("Müşteri detayı yüklenemedi.");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleKycDecision = async (customerId, decision) => {
        setBusyKey(`kyc-${customerId}-${decision}`);
        try {
            await employeeApi.kycDecision(customerId, { decision, notes: notes[customerId] || undefined });
            toast.success(decision === "approved" ? "KYC onaylandı." : "KYC reddedildi.");
            loadPendingKyc();
            if (tab === "overview") loadOverview();
            if (selectedCustomer?.customer?.customer_id === customerId) openCustomer(customerId);
        } catch (error) {
            toast.error(error.response?.data?.detail || "KYC kararı gönderilemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const handleReply = async (messageId) => {
        const replyBody = replies[messageId];
        if (!replyBody?.trim()) {
            toast.error("Yanıtı boş gönderemezsiniz.");
            return;
        }
        setBusyKey(`reply-${messageId}`);
        try {
            await messagesApi.reply(messageId, { reply_body: replyBody.trim() });
            toast.success("Yanıt gönderildi.");
            setReplies((current) => ({ ...current, [messageId]: "" }));
            loadMessages();
        } catch {
            toast.error("Yanıt gönderilemedi.");
        } finally {
            setBusyKey("");
        }
    };

    const totalPages = Math.max(1, Math.ceil(Number(customerTotal || 0) / CUSTOMER_PAGE_SIZE));

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Briefcase size={24} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Çalışan Paneli</h1>
                    </div>
                    <p className="text-white/60">KYC kuyruğu, müşteri arama ve mesaj cevaplarını tek panelden yönetin.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => toast.success("Rapor dışarı aktarılıyor... (Mock)")} className="btn-secondary flex items-center gap-2">
                        <FileText size={16} /> Rapor Al
                    </button>
                    <button onClick={() => { if (tab === "overview") loadOverview(); if (tab === "kyc") loadPendingKyc(); if (tab === "customers") loadCustomers(); if (tab === "messages") loadMessages(); }} className="btn-secondary flex items-center gap-2">
                        <RefreshCw size={16} /> Yenile
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: "overview", label: "Genel Bakış" },
                    { id: "kyc", label: "KYC Onayları" },
                    { id: "customers", label: "Müşteriler" },
                    { id: "messages", label: "Mesajlar" },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all duration-300 border border-transparent ${tab === item.id ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-white/10" : "bg-deepblue-900/50 text-white/60 hover:text-white hover:bg-white/5 border border-white/5"}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {loading ? <LoadingState /> : null}

            {!loading && tab === "overview" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard icon={<Clock size={20} />} label="Bekleyen KYC" value={formatNumber(dashboard?.pending_kyc)} tone="amber" />
                        <MetricCard icon={<UserRound size={20} />} label="Toplam Müşteri" value={formatNumber(dashboard?.total_customers)} tone="blue" />
                        <MetricCard icon={<MessageSquare size={20} />} label="Açık Mesajlar" value={formatNumber(dashboard?.open_messages)} tone="red" />
                        <MetricCard icon={<Landmark size={20} />} label="Bugünkü İşlem" value={formatNumber(dashboard?.today_transactions)} tone="emerald" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Panel title="KYC Öncelik Kuyruğu" subtitle="Bekleyen dosyaları hızlı ele alın">
                            {pendingKyc.length === 0 ? <Empty message="Bekleyen KYC yok." /> : pendingKyc.slice(0, 5).map((customer) => (
                                <div key={customer.customer_id} className="group bg-black/20 rounded-xl p-4 flex justify-between items-center border border-white/5 hover:bg-white/5 transition-colors mb-3">
                                    <div>
                                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{customer.first_name} {customer.last_name}</div>
                                        <div className="text-xs text-white/50 mt-1">{customer.user?.email || customer.phone || "-"}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openCustomer(customer.customer_id)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors" title="Detay"><Eye size={16} /></button>
                                        <button onClick={() => handleKycDecision(customer.customer_id, "approved")} disabled={busyKey === `kyc-${customer.customer_id}-approved`} className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Onayla"><CheckCircle size={16} /></button>
                                        <button onClick={() => handleKycDecision(customer.customer_id, "rejected")} disabled={busyKey === `kyc-${customer.customer_id}-rejected`} className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors" title="Reddet"><XCircle size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </Panel>

                        <Panel title="Son Mesajlar" subtitle="Müşteri yanıtı bekleyen başlıklar">
                            {messages.length === 0 ? <Empty message="Mesaj yok." /> : messages.slice(0, 5).map((message) => (
                                <div key={message.message_id} className={`p-4 rounded-xl border mb-3 transition-colors ${message.status === "open" ? "bg-amber-500/5 border-amber-500/20" : "bg-black/20 border-white/5"}`}>
                                    <div className="font-bold text-white mb-1.5">{message.subject}</div>
                                    <div className="text-xs text-white/60 mb-2">{message.sender_email}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-white/40">{formatDateTime(message.created_at)}</div>
                                </div>
                            ))}
                        </Panel>
                    </div>
                </div>
            )}

            {!loading && tab === "kyc" && (
                <Panel title="KYC Kuyruğu" subtitle="Karar notu ile birlikte onay veya red verin">
                    {pendingKyc.length === 0 ? <Empty message="Bekleyen KYC kaydı yok." /> : pendingKyc.map((customer) => (
                        <div key={customer.customer_id} className="bg-black/20 rounded-2xl p-5 border border-white/5 mb-4">
                            <div className="flex flex-wrap justify-between gap-4 mb-4">
                                <div>
                                    <div className="text-lg font-bold text-white">{customer.first_name} {customer.last_name}</div>
                                    <div className="text-sm text-white/60 mt-1">TC: {customer.national_id} • Tel: {customer.phone}</div>
                                    <div className="text-sm text-white/60 mt-1">{customer.user?.email || "-"}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toast.success("Belgeler açılıyor... (Mock)")} className="btn-secondary flex items-center gap-2"><Eye size={16} /> Belgeler</button>
                                    <button onClick={() => openCustomer(customer.customer_id)} className="btn-secondary flex items-center gap-2"><UserRound size={16} /> Detay</button>
                                </div>
                            </div>
                            <textarea
                                value={notes[customer.customer_id] || ""}
                                onChange={(e) => setNotes((current) => ({ ...current, [customer.customer_id]: e.target.value }))}
                                placeholder="Karar notu (opsiyonel)"
                                className="w-full bg-deepblue-900/50 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-y min-h-[80px]"
                            />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => handleKycDecision(customer.customer_id, "approved")} disabled={busyKey === `kyc-${customer.customer_id}-approved`} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl font-bold flex items-center gap-2 transition-colors"><CheckCircle size={18} /> Onayla</button>
                                <button onClick={() => handleKycDecision(customer.customer_id, "rejected")} disabled={busyKey === `kyc-${customer.customer_id}-rejected`} className="px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-xl font-bold flex items-center gap-2 transition-colors"><XCircle size={18} /> Reddet</button>
                            </div>
                        </div>
                    ))}
                </Panel>
            )}

            {!loading && tab === "customers" && (
                <div className={`grid gap-6 ${selectedCustomer ? "lg:grid-cols-[1.2fr_1fr]" : "lg:grid-cols-1"}`}>
                    <Panel title="Müşteri Arama" subtitle="Hesap, profil ve hareket geçmişine hızlı erişin">
                        <div className="flex gap-2 mb-6">
                            <input
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                placeholder="İsim, soyisim veya TC ara"
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
                            />
                            <button onClick={() => { setPage(1); loadCustomers(); }} className="btn-primary flex items-center gap-2 px-6"><Search size={18} /> Ara</button>
                        </div>
                        <div className="space-y-3">
                            {(customers || []).length === 0 ? <Empty message="Sonuç bulunamadı." /> : customers.map((customer) => (
                                <div key={customer.customer_id} className="bg-black/20 rounded-xl p-4 flex justify-between items-center border border-white/5 hover:border-white/10 transition-colors">
                                    <div>
                                        <div className="font-bold text-white">{customer.full_name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "-"}</div>
                                        <div className="text-xs text-white/50 mt-1">{customer.national_id || "-"} • {customer.status || "-"}</div>
                                    </div>
                                    <button onClick={() => openCustomer(customer.customer_id)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors flex items-center gap-2"><Eye size={16} /> <span className="hidden sm:inline">Detay</span></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                            <span className="text-sm text-white/50 font-medium">{formatNumber(customerTotal)} kayıt • Sayfa {page}/{totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 disabled:opacity-50 transition-colors font-medium">Geri</button>
                                <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 disabled:opacity-50 transition-colors font-medium">İleri</button>
                            </div>
                        </div>
                    </Panel>
                    {selectedCustomer && <CustomerDetailCard data={selectedCustomer} loading={detailLoading} />}
                </div>
            )}

            {!loading && tab === "messages" && (
                <Panel title="Mesaj Merkezi" subtitle="Müşteri sorularına panelden cevap verin">
                    <div className="space-y-4">
                        {messages.length === 0 ? <Empty message="Mesaj yok." /> : messages.map((message) => (
                            <div key={message.message_id} className="bg-black/20 rounded-2xl p-5 border border-white/5">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <strong className="text-lg text-white">{message.subject}</strong>
                                    <Status active={message.status !== "open"}>{message.status}</Status>
                                </div>
                                <div className="text-sm text-white/80 mb-4">{message.body}</div>
                                <div className="text-xs text-white/40 mb-4">{message.sender_email} • {formatDateTime(message.created_at)}</div>
                                {message.reply && (
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-100 mb-4 text-sm relative">
                                        <div className="font-bold text-blue-400 mb-1 text-xs uppercase tracking-wider">Yanıtınız</div>
                                        {message.reply}
                                    </div>
                                )}
                                {message.status === "open" && (
                                    <div className="flex gap-3 mt-2">
                                        <input
                                            value={replies[message.message_id] || ""}
                                            onChange={(e) => setReplies((current) => ({ ...current, [message.message_id]: e.target.value }))}
                                            placeholder="Yanıtınızı buraya yazın..."
                                            className="flex-1 bg-deepblue-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
                                        />
                                        <button onClick={() => handleReply(message.message_id)} disabled={busyKey === `reply-${message.message_id}`} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-70"><Send size={18} /> Düzenle/Gönder</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Panel>
            )}
        </div>
    );
}

function CustomerDetailCard({ data, loading }) {
    return (
        <Panel title="Müşteri 360" subtitle="Profil, hesaplar ve hareketler">
            {loading ? <LoadingState compact /> : (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                        <div className="font-bold text-lg text-white mb-1">{data.customer?.full_name || `${data.customer?.first_name || ""} ${data.customer?.last_name || ""}`.trim() || "-"}</div>
                        <div className="text-sm text-white/60 mb-2">{data.user?.email || "-"}</div>
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-white/40 uppercase tracking-wider">Durum:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${data.customer?.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>{data.customer?.status || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-white/40 uppercase tracking-wider">TC:</span>
                            <span className="text-sm font-mono text-white/80">{data.customer?.national_id || "-"}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white mb-3 tracking-wide uppercase">Hesaplar</h4>
                        <div className="space-y-2">
                            {(data.accounts || []).length === 0 ? <Empty message="Hesap yok." /> : data.accounts.map((account) => (
                                <div key={account.account_id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="font-mono font-bold text-white/90 text-sm">{account.account_number}</div>
                                        <div className="text-xs text-white/50">{account.account_type === 'checking' ? 'Vadesiz' : 'Tasarruf'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-400">{account.currency}</div>
                                        <div className="text-[10px] uppercase text-white/40">{account.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white mb-3 tracking-wide uppercase">Son Hareketler</h4>
                        <div className="space-y-2">
                            {(data.recent_transactions || []).slice(0, 8).map((tx) => (
                                <div key={tx.entry_id || tx.id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white/90 text-sm">{tx.category || tx.type || "işlem"}</div>
                                        <div className="text-xs text-white/40">{formatDateTime(tx.created_at)}</div>
                                    </div>
                                    <div className={`font-bold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-white/80'}`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'}{formatMoney(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Panel>
    );
}

function Panel({ title, subtitle, children }) {
    return (
        <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
            <div className="mb-6">
                <div className="text-xl font-extrabold text-white tracking-tight">{title}</div>
                <div className="text-sm text-white/50 mt-1">{subtitle}</div>
            </div>
            {children}
        </div>
    );
}

function MetricCard({ icon, label, value, tone }) {
    const colors = {
        amber: "bg-amber-500/20 text-amber-400",
        blue: "bg-blue-500/20 text-blue-400",
        red: "bg-rose-500/20 text-rose-400",
        emerald: "bg-emerald-500/20 text-emerald-400"
    };

    return (
        <div className="bg-deepblue-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-white/60 text-sm font-medium">{label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[tone]}`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight relative z-10">{value}</div>
        </div>
    );
}

function Status({ active, children }) {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
            ${active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/20 text-rose-400 border border-rose-500/20"}`}>
            {children}
        </span>
    );
}

function Empty({ message }) {
    return (
        <div className="p-8 rounded-2xl bg-black/10 border border-white/5 border-dashed text-white/40 text-center font-medium">
            {message}
        </div>
    );
}

function LoadingState({ compact = false }) {
    return (
        <div className={`flex items-center justify-center w-full ${compact ? 'min-h-[120px]' : 'min-h-[260px]'}`}>
            <Loader2 className="animate-spin text-blue-500" size={compact ? 24 : 40} />
        </div>
    );
}

function formatNumber(value) { return new Intl.NumberFormat("tr-TR").format(Number(value || 0)); }
function formatMoney(value) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value || 0)); }
function formatDateTime(value) { return value ? new Date(value).toLocaleDateString("tr-TR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "-"; }
