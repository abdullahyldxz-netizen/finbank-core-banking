import {
    BarChart3,
    Crown,
    LayoutDashboard,
    MessageSquare,
    Shield,
} from "lucide-react";
import WorkspaceShell from "../components/WorkspaceShell";

const links = [
    { to: "/executive/cockpit", label: "Executive Cockpit", icon: LayoutDashboard },
    { to: "/executive/reports", label: "Raporlar", icon: BarChart3 },
    { to: "/executive/audit", label: "Denetim", icon: Shield },
    { to: "/executive/messages", label: "Mesajlar", icon: MessageSquare },
];

export default function ExecutiveLayout() {
    return (
        <WorkspaceShell
            roleLabel="CEO"
            subLabel="Board Room"
            accent="gold"
            icon={Crown}
            links={links}
        />
    );
}
