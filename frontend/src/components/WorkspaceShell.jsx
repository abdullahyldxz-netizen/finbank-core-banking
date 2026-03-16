import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "../context/AuthContext";
import { cn } from "./banking/BankUi";

export default function WorkspaceShell({ roleLabel, accent = "primary", icon: BrandIcon, links, subLabel }) {
    const { user, logout } = useAuth();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const displayName = useMemo(() => {
        if (user?.full_name) return user.full_name;
        if (user?.email) return user.email.split("@")[0];
        return "FinBank";
    }, [user]);

    const initials = useMemo(() => {
        const parts = displayName.split(" ").filter(Boolean);
        return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "FB";
    }, [displayName]);

    const accentMap = {
        primary: {
            top: "from-primary/18 via-primary/8 to-transparent",
            link: "border-primary/18 bg-primary/12 text-white",
            icon: "bg-primary/14 text-primary",
            badge: "bg-primary/14 text-primary",
        },
        success: {
            top: "from-emerald-500/18 via-emerald-500/8 to-transparent",
            link: "border-emerald-500/18 bg-emerald-500/12 text-white",
            icon: "bg-emerald-500/14 text-emerald-400",
            badge: "bg-emerald-500/14 text-emerald-400",
        },
        warning: {
            top: "from-amber-500/18 via-amber-500/8 to-transparent",
            link: "border-amber-500/18 bg-amber-500/12 text-white",
            icon: "bg-amber-500/14 text-amber-300",
            badge: "bg-amber-500/14 text-amber-300",
        },
        danger: {
            top: "from-rose-500/18 via-rose-500/8 to-transparent",
            link: "border-rose-500/18 bg-rose-500/12 text-white",
            icon: "bg-rose-500/14 text-rose-400",
            badge: "bg-rose-500/14 text-rose-400",
        },
        secondary: {
            top: "from-violet-500/18 via-violet-500/8 to-transparent",
            link: "border-violet-500/18 bg-violet-500/12 text-white",
            icon: "bg-violet-500/14 text-violet-400",
            badge: "bg-violet-500/14 text-violet-400",
        },
    };

    const palette = accentMap[accent] || accentMap.primary;

    return (
        <div className="layout-wrapper relative flex min-h-screen overflow-x-hidden">
            <div className={`sidebar-overlay ${sidebarOpen ? "mobile-open" : ""}`} onClick={() => setSidebarOpen(false)} />

            <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""} flex flex-col`} aria-label={`${roleLabel} menüsü`}>
                <div className="sidebar-brand relative overflow-hidden">
                    <div className={cn("absolute inset-x-0 top-0 h-16 bg-gradient-to-r opacity-90", palette.top)} />
                    <Link to={links[0]?.to || "/"} className="relative flex items-center gap-3 no-underline">
                        <span className="bank-logo">
                            {BrandIcon ? <BrandIcon size={18} /> : "FB"}
                        </span>
                        <div>
                            <div className="sidebar-brand-text">FinBank</div>
                            <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">{subLabel || roleLabel}</div>
                        </div>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 rounded-[1.1rem] border px-4 py-3 text-sm font-semibold transition",
                                    isActive
                                        ? palette.link
                                        : "border-white/5 bg-white/[0.02] text-[var(--text-secondary)] hover:border-white/10 hover:bg-white/[0.05] hover:text-[var(--text-primary)]",
                                )}
                            >
                                <span className={cn("flex h-10 w-10 items-center justify-center rounded-[1rem] border border-white/8", palette.icon)}>
                                    <Icon size={18} />
                                </span>
                                <span>{link.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user rounded-[1.2rem] border border-white/8 bg-white/[0.03]">
                        <div className="bank-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <strong className="text-sm text-[var(--text-primary)]">{displayName}</strong>
                            <span className={cn("sidebar-role-badge", palette.badge)}>{roleLabel}</span>
                            <span className="sidebar-email">{user?.email}</span>
                        </div>
                    </div>

                    <button type="button" onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))} className="bank-secondary-btn w-full justify-start !rounded-[1rem] !px-4">
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        {theme === "dark" ? "Açık tema" : "Koyu tema"}
                    </button>

                    <button type="button" onClick={logout} className="bank-secondary-btn w-full justify-start !rounded-[1rem] !px-4">
                        <LogOut size={16} />
                        Güvenli çıkış
                    </button>
                </div>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col">
                <header className="mobile-header bank-topbar items-center justify-between px-4 py-3 md:hidden">
                    <button type="button" onClick={() => setSidebarOpen(true)} className="bank-icon-button" aria-label="Menüyü aç">
                        <Menu size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="bank-logo !h-10 !w-10">
                            {BrandIcon ? <BrandIcon size={16} /> : "FB"}
                        </span>
                        <div className="text-left">
                            <div className="font-display text-base font-bold text-[var(--text-primary)]">FinBank</div>
                            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">{roleLabel}</div>
                        </div>
                    </div>
                    <button type="button" onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))} className="bank-icon-button" aria-label="Tema değiştir">
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </header>

                <main className="layout-main flex-1">
                    <div className="bank-page animate-[bankFadeUp_.45s_ease]">
                        <Outlet />
                    </div>
                </main>
            </div>

            <MobileBottomNav />
        </div>
    );
}
