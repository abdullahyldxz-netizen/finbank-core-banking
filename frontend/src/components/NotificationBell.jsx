import { useState, useEffect, useCallback } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { notificationApi } from "../services/api";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [unread, setUnread] = useState(0);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await notificationApi.unreadCount();
            setUnread(res.data.count);
        } catch { /* */ }
    }, []);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await notificationApi.list();
            setNotifs(res.data);
        } catch { /* */ }
    }, []);

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [fetchUnread]);

    const handleOpen = () => {
        setOpen(!open);
        if (!open) fetchNotifs();
    };

    const markAllRead = async () => {
        try { await notificationApi.markAllRead(); setUnread(0); setNotifs((n) => n.map((x) => ({ ...x, read: true }))); }
        catch { /* */ }
    };

    const markRead = async (id) => {
        try {
            await notificationApi.markRead(id);
            setUnread((u) => Math.max(0, u - 1));
            setNotifs((n) => n.map((x) => x.notification_id === id ? { ...x, read: true } : x));
        } catch { /* */ }
    };

    const formatTime = (d) => {
        const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
        if (diff < 60) return "Az önce";
        if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
        return `${Math.floor(diff / 86400)} gün`;
    };

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={handleOpen}
                style={{
                    position: "relative", background: "var(--bg-card)", border: "1px solid var(--border-color)",
                    borderRadius: 12, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--text-primary)", transition: "all 0.2s",
                }}
                aria-label={`Bildirimler (${unread} okunmamış)`}
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span style={{
                        position: "absolute", top: -4, right: -4,
                        background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
                        width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid var(--bg-primary)",
                    }}>{unread > 9 ? "9+" : unread}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: 50, right: 0, width: 340, maxHeight: 420,
                    background: "var(--bg-card)", border: "1px solid var(--border-color)",
                    borderRadius: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.3)", zIndex: 9998,
                    overflow: "hidden", display: "flex", flexDirection: "column",
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                        borderBottom: "1px solid var(--border-color)",
                    }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>🔔 Bildirimler</span>
                        <div style={{ display: "flex", gap: 6 }}>
                            {unread > 0 && (
                                <button onClick={markAllRead} style={{
                                    background: "rgba(99,102,241,0.1)", border: "none", cursor: "pointer",
                                    color: "#6366f1", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600,
                                    display: "flex", alignItems: "center", gap: 4,
                                }}>
                                    <CheckCheck size={14} /> Tümünü Oku
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} style={{
                                background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)",
                            }}><X size={16} /></button>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {notifs.length === 0 ? (
                            <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: 40, fontSize: 13 }}>
                                Bildirim yok 🎉
                            </p>
                        ) : notifs.map((n) => (
                            <div
                                key={n.notification_id}
                                onClick={() => !n.read && markRead(n.notification_id)}
                                style={{
                                    padding: "12px 16px", borderBottom: "1px solid var(--border-color)",
                                    background: n.read ? "transparent" : "rgba(99,102,241,0.05)",
                                    cursor: n.read ? "default" : "pointer", transition: "background 0.2s",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, lineHeight: 1.5 }}>{n.message}</p>
                                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{formatTime(n.created_at)}</span>
                                    </div>
                                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 6 }} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
