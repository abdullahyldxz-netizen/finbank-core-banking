import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    ArrowLeftRight,
    BookOpen,
    Briefcase,
    CreditCard,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Menu,
    Moon,
    Sun,
    UserCog,
    Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MobileBottomNav from "../components/MobileBottomNav";

export default function EmployeeLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const links = [
        { to: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/employee/portal", label: "Müşteri Ops", icon: Briefcase },
        { to: "/employee/customers", label: "Müşteriler", icon: Users },
        { to: "/employee/accounts", label: "Hesaplar", icon: CreditCard },
        { to: "/employee/transfer", label: "Transfer", icon: ArrowLeftRight },
        { to: "/employee/cards", label: "Kartlar", icon: CreditCard },
        { to: "/employee/payment-requests", label: "Para İste", icon: ArrowLeftRight },
        { to: "/employee/ledger", label: "Defter", icon: BookOpen },
        { to: "/employee/messages", label: "Mesajlar", icon: MessageSquare },
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
                aria-label="Employee menu"
            >
                <div className="p-6 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-emerald-500/30">FB</div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-white tracking-tight">FinBank</span>
                        <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">Employee workspace</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto flex flex-col gap-2 p-4 custom-scrollbar">
                    {links.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive(link.to)
                                    ? "bg-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-emerald-500/30"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                            aria-current={isActive(link.to) ? "page" : undefined}
                        >
                            <link.icon size={18} className={isActive(link.to) ? "text-emerald-400" : "text-white/50"} />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/10 flex flex-col gap-4 bg-black/20">
                    <button
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all w-full"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{theme === 'dark' ? ' Light' : ' Dark'}</span>
                    </button>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <UserCog size={16} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Employee</span>
                            <span className="text-xs text-white/70 truncate">{user?.email}</span>
                        </div>
                    </div>

                    <button
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-400/10 border border-transparent hover:border-emerald-400/20 transition-all w-full"
                        onClick={logout}
                    >
                        <LogOut size={16} /> Logout
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
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-xs text-emerald-400 border border-emerald-500/30">FB</div>
                        <span className="font-bold text-white">Employee</span>
                    </div>
                    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

