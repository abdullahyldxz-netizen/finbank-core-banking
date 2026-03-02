import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard, Users, CreditCard, ArrowLeftRight,
    BookOpen, Shield, LogOut, ShieldCheck, Moon, Sun, Crown, BarChart3, MessageSquare,
} from "lucide-react";

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const links = [
        { to: "/admin/dashboard", label: "Yönetici Paneli", icon: LayoutDashboard },
        { to: "/admin/panel", label: "Admin Panel", icon: Crown },
        { to: "/admin/customers", label: "Müşteri Yönetimi", icon: Users },
        { to: "/admin/accounts", label: "Hesap Yönetimi", icon: CreditCard },
        { to: "/admin/transfer", label: "Transfer İşlemi", icon: ArrowLeftRight },
        { to: "/admin/ledger", label: "Hesap Defteri", icon: BookOpen },
        { to: "/admin/spending", label: "Harcama Analizi", icon: BarChart3 },
        { to: "/admin/audit", label: "Denetim Kayıtları", icon: Shield },
        { to: "/admin/messages", label: "Mesajlar", icon: MessageSquare },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="layout-wrapper layout-admin">
            <aside className="sidebar sidebar-admin" role="navigation" aria-label="Admin menüsü">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon admin-icon">FB</div>
                    <span className="sidebar-brand-text">FinBank</span>
                    <span className="sidebar-brand-sub">Admin Panel</span>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`sidebar-link ${isActive(link.to) ? "active" : ""}`}
                            aria-current={isActive(link.to) ? "page" : undefined}
                        >
                            <link.icon size={18} />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <ShieldCheck size={16} />
                        <div className="sidebar-user-info">
                            <span className="sidebar-role-badge admin">Admin</span>
                            <span className="sidebar-email">{user?.email}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="btn-logout"
                        style={{ marginBottom: 8, background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
                        aria-label="Tema değiştir"
                    >
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        {theme === "dark" ? " Açık Mod" : " Koyu Mod"}
                    </button>
                    <button className="btn-logout" onClick={logout} aria-label="Çıkış yap">
                        <LogOut size={16} /> Çıkış
                    </button>
                </div>
            </aside>

            {/* ── Mobile Header ── */}
            <div className="mobile-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="sidebar-brand-icon admin-icon" style={{ width: 32, height: 32, fontSize: 12 }}>FB</div>
                    <span style={{ fontWeight: 700 }}>Admin</span>
                </div>
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}
                >
                    {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* ── Mobile Bottom Navigation ── */}
            <nav className="bottom-nav" role="navigation" aria-label="Mobil alt menü">
                {links.slice(0, 4).map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`bottom-nav-item ${isActive(link.to) ? 'active' : ''}`}
                        aria-current={isActive(link.to) ? 'page' : undefined}
                    >
                        <link.icon size={20} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>

            <main className="layout-main">
                <Outlet />
            </main>
        </div>
    );
}
