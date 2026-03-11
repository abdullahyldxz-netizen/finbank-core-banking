import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Home,
    Wallet,
    CreditCard,
    User,
    Users,
    Briefcase,
    TrendingUp,
    Shield
} from "lucide-react";

export default function MobileBottomNav() {
    const { user } = useAuth();
    if (!user) return null;

    let links = [];

    switch (user.role) {
        case "customer":
            links = [
                { path: "/customer/dashboard", label: "Ana Sayfa", icon: "home" },
                { path: "/customer/transfer", label: "İşlem", icon: "swap_horiz" },
                { path: "/customer/cards", label: "Kartlar", icon: "credit_card" },
                { path: "/customer/profile", label: "Profil", icon: "person" },
            ];
            break;
        case "employee":
            links = [
                { path: "/employee/dashboard", label: "Panel", icon: "dashboard" },
                { path: "/employee/customers", label: "Müşteriler", icon: "group" },
                { path: "/employee/transfer", label: "İşlem", icon: "swap_horiz" },
                { path: "/employee/messages", label: "Mesaj", icon: "mail" },
            ];
            break;
        case "ceo":
            links = [
                { path: "/executive/cockpit", label: "Kokpit", icon: "query_stats" },
                { path: "/executive/reports", label: "Raporlar", icon: "bar_chart" },
                { path: "/executive/audit", label: "Denetim", icon: "verified_user" },
                { path: "/executive/messages", label: "Mesajlar", icon: "mail" },
            ];
            break;
        case "admin":
            links = [
                { path: "/admin/dashboard", label: "Admin", icon: "admin_panel_settings" },
                { path: "/admin/customers", label: "Üyeler", icon: "group" },
                { path: "/admin/transfer", label: "Transfer", icon: "swap_horiz" },
                { path: "/admin/audit", label: "Loglar", icon: "subject" },
            ];
            break;
        default:
            return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 bg-gradient-to-t from-[#0a0a16] via-[#0a0a16]/90 to-transparent md:hidden">
            <nav className="glass-panel rounded-[2rem] border border-white/10 shadow-premium px-6 py-4">
                <ul className="flex justify-between items-center">
                    {links.map((link) => {
                        return (
                            <li key={link.path}>
                                <NavLink
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center gap-1.5 transition-all duration-300 relative ${isActive ? "text-primary scale-110" : "text-[#a0a0a0] hover:text-white"
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={`material-symbols-outlined text-2xl transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(19,236,91,0.5)]' : ''}`}>
                                                {link.icon}
                                            </span>
                                            {isActive && (
                                                <span className="absolute -bottom-3 size-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,91,0.8)]"></span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
