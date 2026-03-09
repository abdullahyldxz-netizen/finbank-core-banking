import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Loader2, ArrowLeft, Trash2, CheckCircle2, Info, AlertTriangle, ShieldCheck, CreditCard, Ticket } from "lucide-react";
import { notificationApi } from "../services/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationApi.list();
            setNotifs(Array.isArray(res.data) ? res.data : []);
        } catch {
            /* silently fail or handle gracefully */
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const markAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifs((n) => n.map((x) => ({ ...x, read: true })));
        } catch {
            /* silently fail */
        }
    };

    const markRead = async (id) => {
        try {
            await notificationApi.markRead(id);
            setNotifs((n) => n.map((x) => x.notification_id === id ? { ...x, read: true } : x));
        } catch {
            /* silently fail */
        }
    };

    const unreadCount = notifs.filter((n) => !n.read).length;

    const formatTime = (d) => {
        const date = new Date(d);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins || 1} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays === 1) return `Dün, ${date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;

        return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'transfer': return { icon: <CreditCard size={20} />, color: 'emerald', bg: 'bg-emerald-500/10' };
            case 'security': return { icon: <ShieldCheck size={20} />, color: 'rose', bg: 'bg-rose-500/10' };
            case 'kyc': return { icon: <CheckCircle2 size={20} />, color: 'blue', bg: 'bg-blue-500/10' };
            case 'bill': return { icon: <Ticket size={20} />, color: 'amber', bg: 'bg-amber-500/10' };
            case 'system': return { icon: <Info size={20} />, color: 'indigo', bg: 'bg-indigo-500/10' };
            case 'goal': return { icon: <CheckCheck size={20} />, color: 'teal', bg: 'bg-teal-500/10' };
            default: return { icon: <Bell size={20} />, color: 'indigo', bg: 'bg-indigo-500/10' };
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4 mb-2">
                        <div className="p-3 bg-indigo-500/20 rounded-xl relative">
                            <Bell size={28} className="text-indigo-400" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-[#0B1120]"></span>
                                </span>
                            )}
                        </div>
                        Bildirimler
                    </h1>
                    <p className="text-white/60 ml-16">
                        Hesabınızla ilgili tüm önemli güncellemeler ve uyarılar.
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="relative z-10 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-indigo-300 font-medium text-sm transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
                    >
                        <CheckCheck size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        Tümünü Okundu İşaretle
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-xs font-bold ml-1">
                            {unreadCount}
                        </span>
                    </button>
                )}
            </motion.div>

            {notifs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl text-center min-h-[40vh]"
                >
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
                        <Bell size={40} className="text-white/20" />
                        <div className="absolute inset-0 border-2 border-white/5 border-dashed rounded-full" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Bildirim Bulunmuyor</h3>
                    <p className="text-white/50 max-w-sm">
                        Şu anda hesabınızla ilgili herhangi bir bildirim bulunmuyor. Yeni bir gelişme olduğunda sizi bilgilendireceğiz.
                    </p>
                </motion.div>
            ) : (
                <div className="grid gap-3 relative">
                    {/* Timeline Line */}
                    <div className="hidden sm:block absolute left-[27px] top-6 bottom-6 w-[2px] bg-white/5 rounded-full" />

                    <AnimatePresence>
                        {notifs.map((n, index) => {
                            const config = getTypeConfig(n.type);

                            return (
                                <motion.div
                                    key={n.notification_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => !n.read && markRead(n.notification_id)}
                                    className={`relative z-10 group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl transition-all duration-300 ${n.read
                                            ? 'bg-white/5 border border-white/5 hover:bg-white/10'
                                            : 'bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.05)]'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border transition-colors ${n.read
                                                ? 'bg-deepblue-950/50 border-white/10 text-white/40'
                                                : `${config.bg} border-${config.color}-500/30 text-${config.color}-400 group-hover:scale-110 group-hover:rotate-3`
                                            }`}>
                                            {config.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                <h4 className={`font-semibold truncate pr-4 ${n.read ? 'text-white/80' : 'text-white'}`}>
                                                    {n.title || n.message.split('.')[0] || "Bildirim"} {/* Title yoksa mesajın ilk cümlesi */}
                                                </h4>
                                                <span className="text-xs font-medium text-white/40 whitespace-nowrap bg-white/5 px-2.5 py-1 rounded-md w-fit">
                                                    {formatTime(n.created_at)}
                                                </span>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${n.read ? 'text-white/50' : 'text-indigo-100/80 font-medium'}`}>
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Unread dot indicator (Mobile: top right, Desktop: center right) */}
                                    {!n.read && (
                                        <div className="absolute top-6 right-6 sm:static sm:self-center">
                                            <div className="w-3 h-3 bg-indigo-500 rounded-full ring-4 ring-indigo-500/20" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
