import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
    ArrowLeftRight,
    BookOpen,
    CreditCard,
    FileCheck,
    HandCoins,
    Headphones,
    History,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquare,
    Moon,
    QrCode,
    Shield,
    Sun,
    UserRound,
    Wallet,
    X,
    TrendingUp
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import MobileBottomNav from "../components/MobileBottomNav";
import { useAuth } from "../context/AuthContext";

const primaryLinks = [
    { to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customer/transfer", label: "Transfer", icon: ArrowLeftRight },
    { to: "/customer/investments", label: "Investments", icon: TrendingUp },
    { to: "/customer/cards", label: "Cards", icon: CreditCard },
    { to: "/customer/history", label: "History", icon: History },
    { to: "/customer/profile", label: "Profile", icon: UserRound },
];

const drawerLinks = [
    { to: "/customer/accounts", label: "Accounts", icon: Wallet },
    { to: "/customer/easy-address", label: "Easy Address", icon: BookOpen },
    { to: "/customer/payment-requests", label: "Request Funds", icon: HandCoins },
    { to: "/customer/qr", label: "QR Transactions", icon: QrCode },
    { to: "/customer/messages", label: "Messages", icon: MessageSquare },
    { to: "/customer/security", label: "Security", icon: Shield },
    { to: "/customer/kyc", label: "KYC", icon: FileCheck },
    { to: "/customer/contact", label: "Support", icon: Headphones },
];

export default function CustomerLayout() {
    const { user, logout } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const displayName = useMemo(() => {
        if (user?.full_name) return user.full_name;
        if (user?.email) return user.email.split("@")[0];
        return "FinBank User";
    }, [user]);

    const initials = useMemo(() => {
        const parts = displayName.split(" ").filter(Boolean);
        return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "FB";
    }, [displayName]);

    const toggleTheme = () => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    };

    return (
        <div className="min-h-screen pb-24 md:pb-0">
            <header className="bank-topbar">
                <div className="bank-page flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
                    <div className="flex items-center gap-3 lg:gap-5">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="bank-icon-button lg:hidden"
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>

                        <Link to="/customer/dashboard" className="bank-brand">
                            <span className="bank-logo">
                                <Wallet size={18} />
                            </span>
                            <span className="bank-brand-text">FinBank</span>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-1">
                            {primaryLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) => `bank-nav-link ${isActive ? "active" : ""}`}
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="bank-secondary-btn hidden lg:inline-flex !min-h-[2.7rem] !px-4"
                        >
                            <Menu size={16} />
                            Services
                        </button>
                         <NotificationBell />
                        <button type="button" onClick={toggleTheme} className="bank-icon-button" aria-label="Change theme">
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <div className="bank-user-pill hidden sm:flex">
                            <div className="text-right">
                                <p className="text-xs font-bold text-[var(--text-primary)]">{displayName}</p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                                    Premium Member
                                </p>
                            </div>
                            <div className="bank-avatar">{initials}</div>
                        </div>
                        <button type="button" onClick={logout} className="bank-secondary-btn hidden xl:inline-flex !min-h-[2.7rem] !px-4">
                            <LogOut size={16} />
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            <div
                className={`fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm transition ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
                onClick={() => setDrawerOpen(false)}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-[70] w-[22rem] max-w-[calc(100vw-1.5rem)] border-r border-white/10 bg-[#060913]/95 px-5 py-5 shadow-2xl backdrop-blur-2xl transition duration-300 overflow-y-auto ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
                aria-label="Customer menu"
            >
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/customer/dashboard" className="bank-brand" onClick={() => setDrawerOpen(false)}>
                        <span className="bank-logo">
                            <Wallet size={18} />
                        </span>
                        <span className="bank-brand-text">FinBank</span>
                    </Link>
                    <button type="button" className="bank-icon-button" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                        <X size={18} />
                    </button>
                </div>

                <div className="mb-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="bank-avatar">{initials}</div>
                        <div>
                            <p className="font-display text-lg font-bold text-white">{displayName}</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)]">Customer Workspace</p>
                        </div>
                    </div>
                    <div className="bank-chip bg-primary/10 text-primary">Premium</div>
                </div>

                <div className="mb-3 px-1">
                    <p className="bank-section-label">Core</p>
                </div>
                <div className="grid gap-2">
                    {[...primaryLinks, ...drawerLinks].map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setDrawerOpen(false)}
                                className={({ isActive }) => `flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive ? "border-primary/30 bg-primary/12 text-white" : "border-white/5 bg-white/[0.03] text-[var(--text-secondary)] hover:border-white/10 hover:bg-white/[0.05] hover:text-white"}`}
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-primary">
                                    <Icon size={18} />
                                </span>
                                <span>{link.label}</span>
                            </NavLink>
                        );
                    })}
                </div>

                <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
                    <p className="bank-section-label">Session</p>
                    <button type="button" onClick={toggleTheme} className="bank-secondary-btn w-full justify-start !min-h-[3rem] !rounded-2xl !px-4">
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>
                    <button type="button" onClick={logout} className="bank-secondary-btn w-full justify-start !min-h-[3rem] !rounded-2xl !px-4">
                        <LogOut size={16} />
                        Secure Logout
                    </button>
                </div>
            </aside>

            <main className="bank-page px-4 py-6 lg:px-6 lg:py-8">
                <div className="animate-[bankFadeUp_.45s_ease]">
                    <Outlet />
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
}
