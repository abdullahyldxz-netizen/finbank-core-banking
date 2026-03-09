import React from "react";
import { Link } from "react-router-dom";
import {
    Send, Receipt, Target,
    TrendingUp, BarChart3, Shield, MessageSquare, Bell, CreditCard,
} from "lucide-react";

export default function QuickActionsWidget({ role = "customer" }) {
    const actions = role === "customer" ? [
        { to: `/${role}/transfer`, label: "Para Transferi", icon: <Send size={20} />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", hover: "hover:border-blue-500/50 hover:bg-blue-500/20" },
        { to: `/${role}/cards`, label: "Kredi Kartlarım", icon: <CreditCard size={20} />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", hover: "hover:border-purple-500/50 hover:bg-purple-500/20" },
        { to: `/${role}/bills`, label: "Fatura Öde", icon: <Receipt size={20} />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", hover: "hover:border-amber-500/50 hover:bg-amber-500/20" },
        { to: `/${role}/goals`, label: "Tasarruf", icon: <Target size={20} />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hover: "hover:border-emerald-500/50 hover:bg-emerald-500/20" },
        { to: `/${role}/exchange`, label: "Döviz", icon: <TrendingUp size={20} />, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", hover: "hover:border-sky-500/50 hover:bg-sky-500/20" },
        { to: `/${role}/spending`, label: "Analiz", icon: <BarChart3 size={20} />, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", hover: "hover:border-indigo-500/50 hover:bg-indigo-500/20" },
        { to: `/${role}/security`, label: "Güvenlik", icon: <Shield size={20} />, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", hover: "hover:border-rose-500/50 hover:bg-rose-500/20" },
        { to: `/${role}/messages`, label: "Mesajlar", icon: <MessageSquare size={20} />, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", hover: "hover:border-teal-500/50 hover:bg-teal-500/20" },
        { to: `/${role}/notifications`, label: "Bildirimler", icon: <Bell size={20} />, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", hover: "hover:border-pink-500/50 hover:bg-pink-500/20" },
    ] : [];

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 lg:p-8 border border-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-yellow-400">⚡</span> Diğer İşlemler
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4">
                {actions.map((a) => (
                    <Link
                        key={a.to}
                        to={a.to}
                        className={`group flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/20 border border-white/5 transition-all duration-300 ${a.hover} hover:-translate-y-1`}
                    >
                        <div className={`w-12 h-12 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center ${a.color} transition-transform group-hover:scale-110 shadow-inner`}>
                            {a.icon}
                        </div>
                        <span className="text-[11px] font-bold text-white/70 group-hover:text-white text-center leading-tight">
                            {a.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
