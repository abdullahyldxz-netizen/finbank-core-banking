import { useState, useEffect } from "react";
import { ArrowLeftRight, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { exchangeApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

const FLAGS = { TRY: "🇹🇷", USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", CHF: "🇨🇭", XAU: "🥇" };
const NAMES = { TRY: "Türk Lirası", USD: "ABD Doları", EUR: "Euro", GBP: "İngiliz Sterlini", CHF: "İsviçre Frangı", XAU: "Altın (Ons)" };

export default function ExchangeRatesPage() {
    const [rates, setRates] = useState({});
    const [fromCurrency, setFromCurrency] = useState("USD");
    const [toCurrency, setToCurrency] = useState("TRY");
    const [amount, setAmount] = useState("100");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRates = async () => {
        setRefreshing(true);
        try {
            const res = await exchangeApi.getRates();
            setRates(res.data.rates);
        } catch {
            setRates({ USD: 32.50, EUR: 35.20, GBP: 41.10, TRY: 1.0 });
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const convert = () => {
        if (!amount || !rates[fromCurrency] || !rates[toCurrency]) return "0.00";
        const inTRY = parseFloat(amount) * (rates[fromCurrency] || 1);
        const result = inTRY / (rates[toCurrency] || 1);
        return result.toFixed(2);
    };

    const swap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const fmt = (n) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Döviz Kurları</h1>
                            <p className="text-white/60 text-sm md:text-base">Güncel piyasa verilerini ve dönüşümleri takip edin.</p>
                        </div>
                    </div>

                    <button
                        onClick={fetchRates}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm w-full md:w-auto disabled:opacity-50 group"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                        {refreshing ? "Güncelleniyor..." : "Yenile"}
                    </button>
                </div>
            </motion.div>

            {/* Rate Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(rates).filter(([k]) => k !== "TRY").map(([currency, rate], i) => (
                    <motion.div
                        key={currency}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-emerald-500/30 rounded-3xl p-5 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

                        <div className="text-4xl mb-3">{FLAGS[currency]}</div>
                        <div className="font-bold text-white mb-1 flex justify-center items-center gap-1.5">
                            {currency} <span className="text-white/30 text-sm font-normal">/</span> TRY
                        </div>
                        <div className="text-xl md:text-2xl font-black text-emerald-400 mb-2">₺{fmt(rate)}</div>
                        <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{NAMES[currency]}</div>
                    </motion.div>
                ))}
            </div>

            {/* Converter */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden"
            >
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <ArrowLeftRight size={16} />
                    </span>
                    Hızlı Döviz Çevirici
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
                    {/* From */}
                    <div className="flex-1 w-full bg-deepblue-950/40 border border-white/5 rounded-2xl p-4 md:p-6 hover:border-white/10 transition-colors">
                        <label className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2 block">Dönüştürülecek Tutar</label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">{FLAGS[fromCurrency]}</span>
                                <select
                                    value={fromCurrency}
                                    onChange={(e) => setFromCurrency(e.target.value)}
                                    className="absolute left-0 top-0 bottom-0 w-24 opacity-0 cursor-pointer"
                                >
                                    {Object.keys(rates).map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="absolute left-12 top-1/2 -translate-y-1/2 font-bold text-white cursor-pointer flex items-center gap-1">
                                    {fromCurrency} <span className="text-white/30 text-xs">▼</span>
                                </div>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-b-2 border-white/10 hover:border-white/30 focus:border-indigo-500 rounded-none pl-28 pr-4 py-3 text-2xl md:text-3xl font-bold text-white outline-none transition-colors [&::-webkit-inner-spin-button]:appearance-none text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <button
                        onClick={swap}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 transition-transform hover:scale-110 md:-mx-4 z-20"
                    >
                        <ArrowLeftRight size={20} />
                    </button>

                    {/* To */}
                    <div className="flex-1 w-full bg-deepblue-950/40 border border-white/5 rounded-2xl p-4 md:p-6 hover:border-white/10 transition-colors">
                        <label className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2 block">Alınacak Tutar (Tahmini)</label>
                        <div className="flex items-center gap-3 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">{FLAGS[toCurrency]}</span>
                            <select
                                value={toCurrency}
                                onChange={(e) => setToCurrency(e.target.value)}
                                className="absolute left-0 top-0 bottom-0 w-24 opacity-0 cursor-pointer z-10"
                            >
                                {Object.keys(rates).map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="absolute left-12 top-1/2 -translate-y-1/2 font-bold text-white cursor-pointer flex items-center gap-1">
                                {toCurrency} <span className="text-white/30 text-xs">▼</span>
                            </div>

                            <div className="w-full bg-transparent border-b-2 border-transparent pl-28 pr-4 py-3 text-2xl md:text-3xl font-black text-emerald-400 text-right overflow-hidden text-ellipsis">
                                {convert()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm font-medium text-white/40 bg-white/5 py-3 rounded-xl border border-white/5">
                    💡 Hesaplanan tutarlar gösterge niteliğindedir. İşlem anındaki kurlar farklılık gösterebilir.
                </div>
            </motion.div>
        </div>
    );
}
