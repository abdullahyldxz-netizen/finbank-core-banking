import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard, CreditCard, ArrowLeftRight,
    BookOpen, Shield, LogOut, Wallet
} from "lucide-react";

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();

    const links = [
        { to: "/", label: "Panel", icon: LayoutDashboard },
        { to: "/accounts", label: "Hesaplar", icon: Wallet },
        { to: "/cards", label: "Kartlar", icon: CreditCard },
        { to: "/transfer", label: "Transfer", icon: ArrowLeftRight },
        { to: "/ledger", label: "Hesap Defteri", icon: BookOpen },
    ];

    if (isAdmin) {
        links.push({ to: "/audit", label: "Denetim", icon: Shield });
    }

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 inset-x-0 z-50 bg-deepblue-900/60 backdrop-blur-xl border-b border-white/10 shadow-lg" role="navigation" aria-label="Ana navigasyon">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 shrink-0 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-shadow">
                            FB
                        </div>
                        <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight hidden sm:block">
                            FinBank
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1 mx-4">
                        {links.map((link) => {
                            const active = isActive(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                                        ${active ? "bg-white/10 text-white shadow-inner border border-white/5" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    aria-current={active ? "page" : undefined}
                                >
                                    <link.icon size={18} className={active ? "text-blue-400" : ""} />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Area */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full mb-0.5
                                ${isAdmin ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"}`}>
                                {user?.role === "admin" ? "Yönetici" : user?.role}
                            </span>
                            <span className="text-xs font-medium text-white/70">
                                {user?.email}
                            </span>
                        </div>

                        <button
                            onClick={logout}
                            aria-label="Çıkış yap"
                            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors shadow-sm"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
