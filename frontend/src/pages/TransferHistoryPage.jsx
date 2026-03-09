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
    RefreshCw,
    Receipt,
    CreditCard,
    Target
} from "lucide-react";
import { transactionApi, paymentRequestsApi } from "../services/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_OPTIONS = [
    { value: "", label: "Tüm Kategoriler" },
    { value: "DEPOSIT", label: "Para Yatırma" },
    { value: "WITHDRAWAL", label: "Para Çekme" },
    { value: "TRANSFER_IN", label: "Gelen Transfer" },
    { value: "TRANSFER_OUT", label: "Giden Transfer" },
    { value: "BILL_PAYMENT", label: "Fatura Ödeme" },
    { value: "CARD_PAYMENT", label: "Kart Ödeme" },
    { value: "GOAL_CONTRIBUTION", label: "Hedef Birikim" },
];

const TYPE_OPTIONS = [
    { value: "", label: "Tüm Yönler" },
    { value: "CREDIT", label: "Gelen" },
    { value: "DEBIT", label: "Giden" },
];

const CATEGORY_LABELS = {
    DEPOSIT: "Para Yatırma",
    WITHDRAWAL: "Para Çekme",
    TRANSFER_IN: "Gelen Transfer",
    TRANSFER_OUT: "Giden Transfer",
    BILL_PAYMENT: "Fatura Ödeme",
    CARD_PAYMENT: "Kart Ödemesi",
    GOAL_CONTRIBUTION: "Hedefe Aktarım",
};

const CATEGORY_ICONS = {
    DEPOSIT: <ArrowDownLeft size={20} className="text-emerald-400" />,
    WITHDRAWAL: <ArrowUpRight size={20} className="text-rose-400" />,
    TRANSFER_IN: <ArrowDownLeft size={20} className="text-emerald-400" />,
    TRANSFER_OUT: <ArrowUpRight size={20} className="text-rose-400" />,
    BILL_PAYMENT: <Receipt size={20} className="text-blue-400" />,
    CARD_PAYMENT: <CreditCard size={20} className="text-purple-400" />,
    GOAL_CONTRIBUTION: <Target size={20} className="text-teal-400" />,
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
        const header = "Tarih,Tip,Kategori,Aciklama,Tutar\n";
        const rows = entries.map((entry) => {
            const date = new Date(entry.created_at).toLocaleString("tr-TR");
            const type = entry.type === "CREDIT" ? "Gelen" : "Giden";
            const category = CATEGORY_LABELS[entry.category] || entry.category || "İşlem";
            const description = (entry.description || "").replaceAll(",", " ");
            return `${date},${type},${category},${description},${entry.amount}`;
        });
        const blob = new Blob([header + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `transfer-gecmisi-${new Date().toISOString().slice(0, 10)}.csv`;
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
            description: `Ortak ödeme: ${entry.description || CATEGORY_LABELS[entry.category] || "İşlem"}`
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
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3 justify-center md:justify-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <History size={24} className="text-blue-400" />
                        </div>
                        Transfer Geçmişi
                    </h1>
                    <p className="text-white/60 text-sm md:text-base">
                        Para hareketlerinizi, transferlerinizi ve ödemelerinizi tek ekranda izleyin.
                    </p>
                </div>
                <button
                    onClick={exportCsv}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all border border-white/10"
                >
                    <Download size={18} /> CSV İndir
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <SummaryCard label="Toplam Gelen" value={`+${formatMoney(totalIn)}`} accent="emerald" />
                <SummaryCard label="Toplam Giden" value={`-${formatMoney(totalOut)}`} accent="rose" />
                <SummaryCard label="Net Hareket" value={formatMoney(totalIn - totalOut)} accent="blue" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        value={filter.search}
                        onChange={(event) => {
                            setPage(1);
                            setFilter((prev) => ({ ...prev, search: event.target.value }));
                        }}
                        placeholder="Açıklama veya kategori ara"
                        className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors font-medium backdrop-blur-md"
                    />
                </div>

                <div className="relative">
                    <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <select
                        value={filter.type}
                        onChange={(event) => {
                            setPage(1);
                            setFilter((prev) => ({ ...prev, type: event.target.value }));
                        }}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors font-medium backdrop-blur-md"
                    >
                        {TYPE_OPTIONS.map((option) => (
                            <option key={option.value || "all"} value={option.value} className="bg-slate-800">{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <select
                        value={filter.category}
                        onChange={(event) => {
                            setPage(1);
                            setFilter((prev) => ({ ...prev, category: event.target.value }));
                        }}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors font-medium backdrop-blur-md"
                    >
                        {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value || "all"} value={option.value} className="bg-slate-800">{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader2 size={32} className="text-white/40 animate-spin" />
                </div>
            ) : entries.length === 0 ? (
                <div className="bg-black/20 border border-white/5 rounded-3xl p-16 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History size={32} className="text-white/20" />
                    </div>
                    <div className="text-white/60 font-medium">Bu filtrelere uygun işlem bulunamadı.</div>
                </div>
            ) : (
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-xs font-black text-white/50 uppercase tracking-widest">
                        <div className="col-span-6 lg:col-span-5">İşlem Detayı</div>
                        <div className="col-span-3 lg:col-span-3">Tarih</div>
                        <div className="col-span-3 lg:col-span-4 text-right">Tutar & İşlem</div>
                    </div>

                    <div className="divide-y divide-white/5">
                        {entries.map((entry, index) => {
                            const isCredit = entry.type === "CREDIT";
                            return (
                                <motion.div
                                    key={entry.id || entry.entry_id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="p-4 md:px-6 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-center hover:bg-white/[0.03] transition-colors relative group overflow-hidden"
                                >
                                    {/* Abstract Highlight on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                    <div className="col-span-12 md:col-span-6 lg:col-span-5 flex items-center gap-4 w-full">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-lg
                                            ${isCredit ? "bg-emerald-500/10 shadow-emerald-500/10" : "bg-rose-500/10 shadow-rose-500/10"}
                                        `}>
                                            {CATEGORY_ICONS[entry.category] || (isCredit ? <ArrowDownLeft size={20} className="text-emerald-400" /> : <ArrowUpRight size={20} className="text-rose-400" />)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-bold text-white truncate">
                                                {entry.description || CATEGORY_LABELS[entry.category] || "Finansal İşlem"}
                                            </div>
                                            <div className="text-xs font-semibold text-white/50 mt-1 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-md border ${isCredit ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-rose-500/10 border-rose-500/20 text-rose-300"}`}>
                                                    {CATEGORY_LABELS[entry.category] || entry.category || "Diğer"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-12 md:col-span-3 lg:col-span-3 w-full text-left md:text-left text-xs font-semibold text-white/60">
                                        {new Date(entry.created_at).toLocaleString("tr-TR", {
                                            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </div>

                                    <div className="col-span-12 md:col-span-3 lg:col-span-4 w-full flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3">
                                        <div className={`text-lg font-black whitespace-nowrap drop-shadow-md ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                                            {isCredit ? "+" : "-"}{formatMoney(entry.amount)}
                                        </div>
                                        {!isCredit && (
                                            <button
                                                onClick={() => openSplitModal(entry)}
                                                className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                                            >
                                                <SplitSquareHorizontal size={14} /> Bölüş
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-center items-center gap-4 mt-8">
                <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 px-6 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Önceki
                </button>
                <div className="text-sm font-bold text-white/50 bg-black/30 border border-white/10 px-5 py-2.5 rounded-full backdrop-blur-md">
                    Sayfa {page}
                </div>
                <button
                    disabled={!hasNextPage}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 px-6 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Sonraki
                </button>
            </div>

            {/* Split Modal */}
            <AnimatePresence>
                {splitModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSplitModal({ show: false, entry: null })}
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-deepblue-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <SplitSquareHorizontal size={20} className="text-orange-400" />
                                    </div>
                                    Harcamayı Bölüş
                                </h2>
                                <button
                                    onClick={() => setSplitModal({ show: false, entry: null })}
                                    className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <p className="text-white/60 text-sm mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                                Bu işlem için başka birinden ödeme isteyebilirsiniz. Tutar otomatik olarak ikiye bölünmüştür, isterseniz değiştirebilirsiniz.
                            </p>

                            <form onSubmit={handleSplitSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Kimden İsteniyor?</label>
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 font-semibold transition-colors"
                                        value={splitForm.target_alias}
                                        onChange={e => setSplitForm(prev => ({ ...prev, target_alias: e.target.value }))}
                                        placeholder="Telefon, E-Posta veya TCKN"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Tutar (Karşıdan İstenecek)</label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 font-mono transition-colors"
                                            type="number"
                                            step="0.01" min="0.01"
                                            value={splitForm.amount}
                                            onChange={e => setSplitForm(prev => ({ ...prev, amount: e.target.value }))}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">₺</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Açıklama</label>
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 font-semibold transition-colors"
                                        value={splitForm.description}
                                        onChange={e => setSplitForm(prev => ({ ...prev, description: e.target.value }))}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={splitLoading}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 mt-4"
                                >
                                    {splitLoading ? <RefreshCw size={20} className="animate-spin" /> : "İsteği Gönder"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SummaryCard({ label, value, accent }) {
    const accents = {
        emerald: "from-emerald-600/20 to-emerald-900/40 border-emerald-500/30 text-emerald-400",
        rose: "from-rose-600/20 to-rose-900/40 border-rose-500/30 text-rose-400",
        blue: "from-blue-600/20 to-blue-900/40 border-blue-500/30 text-blue-400"
    };

    return (
        <div className={`bg-gradient-to-br ${accents[accent]} backdrop-blur-md rounded-3xl p-6 border`}>
            <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">{label}</div>
            <div className={`text-2xl lg:text-3xl font-black drop-shadow-md`}>{value}</div>
        </div>
    );
}
