import {
    ArrowLeftRight,
    BookOpen,
    Briefcase,
    CreditCard,
    Landmark,
    LayoutDashboard,
    MessageSquare,
    Users,
} from "lucide-react";
import WorkspaceShell from "../components/WorkspaceShell";

const links = [
    { to: "/employee/dashboard", label: "Operasyon Özeti", icon: LayoutDashboard },
    { to: "/employee/portal", label: "Müşteri Operasyon", icon: Briefcase },
    { to: "/employee/customers", label: "Müşteriler", icon: Users },
    { to: "/employee/accounts", label: "Hesaplar", icon: CreditCard },
    { to: "/employee/transfer", label: "Transfer", icon: ArrowLeftRight },
    { to: "/employee/cards", label: "Kartlar", icon: Landmark },
    { to: "/employee/ledger", label: "Defter", icon: BookOpen },
    { to: "/employee/messages", label: "Mesajlar", icon: MessageSquare },
];

export default function EmployeeLayout() {
    return (
        <WorkspaceShell
            roleLabel="Employee"
            subLabel="Service Desk"
            accent="success"
            icon={Briefcase}
            links={links}
        />
    );
}
