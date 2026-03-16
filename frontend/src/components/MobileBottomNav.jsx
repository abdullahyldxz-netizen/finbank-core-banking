import { NavLink } from "react-router-dom";
import {
    BarChart3,
    CreditCard,
    Home,
    Mail,
    Shield,
    ShieldCheck,
    SquareKanban,
    ArrowLeftRight,
    UserRound,
    Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleLinks = {
    customer: [
        { path: "/customer/dashboard", label: "Ana Sayfa", icon: Home },
        { path: "/customer/transfer", label: "Transfer", icon: ArrowLeftRight },
        { path: "/customer/cards", label: "Kartlar", icon: CreditCard },
        { path: "/customer/spending", label: "Analiz", icon: BarChart3 },
        { path: "/customer/profile", label: "Profil", icon: UserRound },
    ],
    employee: [
        { path: "/employee/dashboard", label: "Panel", icon: SquareKanban },
        { path: "/employee/customers", label: "Musteriler", icon: Users },
        { path: "/employee/transfer", label: "Transfer", icon: ArrowLeftRight },
        { path: "/employee/messages", label: "Mesajlar", icon: Mail },
    ],
    admin: [
        { path: "/admin/dashboard", label: "Admin", icon: ShieldCheck },
        { path: "/admin/customers", label: "Uyeler", icon: Users },
        { path: "/admin/messages", label: "Mesajlar", icon: Mail },
        { path: "/admin/audit", label: "Audit", icon: Shield },
    ],
    ceo: [
        { path: "/executive/cockpit", label: "Kokpit", icon: SquareKanban },
        { path: "/executive/reports", label: "Raporlar", icon: BarChart3 },
        { path: "/executive/messages", label: "Mesajlar", icon: Mail },
        { path: "/executive/audit", label: "Denetim", icon: Shield },
    ],
};

export default function MobileBottomNav() {
    const { user } = useAuth();
    const links = roleLinks[user?.role];

    if (!links?.length) return null;

    return (
        <div className="bottom-nav fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pt-2 md:hidden">
            <nav className="mx-auto flex w-full max-w-md items-center justify-between rounded-[1.8rem] border border-white/10 bg-[#09101d]/90 px-3 py-3 shadow-2xl backdrop-blur-2xl">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `group relative flex min-w-[56px] flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${isActive ? "text-primary" : "text-[var(--text-secondary)]"}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${isActive ? "bg-primary/12 shadow-[0_0_22px_rgba(59,130,246,0.18)]" : "bg-transparent group-hover:bg-white/5"}`}>
                                        <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                                    </span>
                                    <span>{link.label}</span>
                                    {isActive ? <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.9)]" /> : null}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}

