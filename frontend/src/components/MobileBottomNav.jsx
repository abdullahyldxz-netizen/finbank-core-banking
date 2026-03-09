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
                { path: "/customer/dashboard", label: "Ana Sayfa", icon: Home },
                { path: "/customer/transfer", label: "Transfer", icon: TrendingUp },
                { path: "/customer/cards", label: "Kartlar", icon: CreditCard },
                { path: "/customer/profile", label: "Profil", icon: User },
            ];
            break;
        case "employee":
            links = [
                { path: "/employee/dashboard", label: "Panel", icon: Home },
                { path: "/employee/customers", label: "Müşteriler", icon: Users },
                { path: "/employee/transfer", label: "İşlem", icon: TrendingUp },
                { path: "/employee/messages", label: "Mesaj", icon: Briefcase },
            ];
            break;
        case "ceo":
            links = [
                { path: "/executive/cockpit", label: "Kokpit", icon: Shield },
                { path: "/executive/reports", label: "Raporlar", icon: Briefcase },
                { path: "/executive/audit", label: "Denetim", icon: Users },
                { path: "/executive/messages", label: "Mesajlar", icon: User },
            ];
            break;
        case "admin":
            links = [
                { path: "/admin/dashboard", label: "Admin", icon: Shield },
                { path: "/admin/customers", label: "Üyeler", icon: Users },
                { path: "/admin/transfer", label: "Transfer", icon: TrendingUp },
                { path: "/admin/audit", label: "Loglar", icon: Briefcase },
            ];
            break;
        default:
            return null;
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-deepblue-950/80 backdrop-blur-xl border-t border-white/10 pb-safe">
            <div className="flex items-center justify-around px-2 py-3">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-300 relative
                                ${isActive ? "text-white" : "text-white/50 hover:text-white/80"}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/10 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] -z-10" />
                                    )}
                                    <Icon size={20} className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                    <span className="text-[10px] font-medium tracking-wide">{link.label}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}
