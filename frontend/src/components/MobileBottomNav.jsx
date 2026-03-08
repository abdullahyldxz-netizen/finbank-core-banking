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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 px-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                                ? "text-red-600 dark:text-red-500"
                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            }`
                        }
                    >
                        <Icon size={20} className="mb-0.5" />
                        <span className="text-[10px] font-medium tracking-wide">{link.label}</span>
                    </NavLink>
                );
            })}
        </div>
    );
}
