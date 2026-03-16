import {
    ArrowLeftRight,
    BarChart3,
    BookOpen,
    CreditCard,
    LayoutDashboard,
    MessageSquare,
    Shield,
    ShieldCheck,
    Users,
} from "lucide-react";
import WorkspaceShell from "../components/WorkspaceShell";

const links = [
    { to: "/admin/dashboard", label: "Kontrol Merkezi", icon: LayoutDashboard },
    { to: "/admin/customers", label: "Kullanıcılar", icon: Users },
    { to: "/admin/accounts", label: "Hesaplar", icon: CreditCard },
    { to: "/admin/transfer", label: "Transfer", icon: ArrowLeftRight },
    { to: "/admin/ledger", label: "Defter", icon: BookOpen },
    { to: "/admin/spending", label: "Analiz", icon: BarChart3 },
    { to: "/admin/audit", label: "Denetim", icon: Shield },
    { to: "/admin/messages", label: "Mesajlar", icon: MessageSquare },
];

export default function AdminLayout() {
    return (
        <WorkspaceShell
            roleLabel="Admin"
            subLabel="Control Tower"
            accent="warning"
            icon={ShieldCheck}
            links={links}
        />
    );
}
