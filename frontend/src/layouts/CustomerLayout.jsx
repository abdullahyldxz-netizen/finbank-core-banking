import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import MobileBottomNav from "../components/MobileBottomNav";
import {
    LayoutDashboard, CreditCard, ArrowLeftRight,
    LogOut, User, Settings, Moon, Sun, MessageSquare, Menu,
    Receipt, Lock, Target, TrendingUp, BarChart3, Shield,
    FileCheck, History, Headphones, HandCoins, QrCode
} from "lucide-react";


export default function CustomerLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Theme state
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const links = [
        { to: "/customer/dashboard", label: "Panel", icon: LayoutDashboard },
        { to: "/customer/accounts", label: "Hesaplar", icon: CreditCard },
        { to: "/customer/transfer", label: "Transfer", icon: ArrowLeftRight },
        { to: "/customer/easy-address", label: "Kolay Adres", icon: BookOpen },
        { to: "/customer/payment-requests", label: "Ödeme İste", icon: HandCoins },
        { to: "/customer/qr", label: "QR İşlemleri", icon: QrCode },
        { to: "/customer/history", label: "Geçmiş", icon: History },
        { to: "/customer/bills", label: "Fatura", icon: Receipt },
        { to: "/customer/cards", label: "Kredi Kartı", icon: CreditCard },
        { to: "/customer/ledger", label: "Hareketler", icon: BookOpen },
        { to: "/customer/goals", label: "Tasarruf", icon: Target },
        { to: "/customer/exchange", label: "Döviz", icon: TrendingUp },
        { to: "/customer/spending", label: "Analiz", icon: BarChart3 },
        { to: "/customer/messages", label: "Mesajlar", icon: MessageSquare },
        { to: "/customer/security", label: "Güvenlik", icon: Shield },
        { to: "/customer/kyc", label: "Kimlik (KYC)", icon: FileCheck },
        { to: "/customer/profile", label: "Profil", icon: User },
        { to: "/customer/contact", label: "İletişim", icon: Headphones },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-[#020617]">
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] transition-opacity duration-300 md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            />

            <aside
                className={`fixed md:sticky top-0 left-0 h-screen w-[280px] flex flex-col z-[1000] md:z-40 transition-transform duration-300
                           bg-deepblue-950/60 backdrop-blur-2xl border-r border-white/10 shadow-2xl
                           ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                role="navigation"
                aria-label="Müşteri menüsü"
            >
                <div className="p-6 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30">FB</div>
                    <span className="text-xl font-bold text-white tracking-tight">FinBank</span>
                </div>

                <nav className="flex-1 overflow-y-auto flex flex-col gap-2 p-4 custom-scrollbar">
                    {links.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive(link.to)
                                    ? "bg-blue-500/20 text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-blue-500/30"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                            aria-current={isActive(link.to) ? "page" : undefined}
                        >
                            <link.icon size={18} className={isActive(link.to) ? "text-blue-400" : "text-white/50"} />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/10 flex flex-col gap-4 bg-black/20">
                    <button
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all w-full"
                        onClick={toggleTheme}
                        aria-label="Tema Değiştir"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
                    </button>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <User size={16} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Müşteri</span>
                            <span className="text-xs text-white/70 truncate">{user?.email}</span>
                        </div>
                    </div>

                    <button
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all w-full"
                        onClick={logout}
                    >
                        <LogOut size={16} /> Çıkış Yap
                    </button>
                </div>
            </aside>

            <MobileBottomNav />

            <main className="flex-1 w-full md:max-w-[calc(100vw-280px)] min-h-screen flex flex-col bg-transparent pb-24 md:pb-0">
                {/* Mobile Header */}
                <div className="md:hidden flex justify-between items-center p-4 bg-deepblue-950/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button onClick={toggleTheme} className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
