import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { notificationApi } from "../services/api";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);

    const fetchUnread = useCallback(async () => {
        try {
            const response = await notificationApi.unreadCount();
            setUnread(Number(response.data?.count || 0));
        } catch {
            // ignore
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await notificationApi.list();
            setNotifications(Array.isArray(response.data) ? response.data : []);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        fetchUnread();
        const timer = setInterval(fetchUnread, 30000);
        return () => clearInterval(timer);
    }, [fetchUnread]);

    const togglePanel = () => {
        const next = !open;
        setOpen(next);
        if (next) fetchNotifications();
    };

    const markAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setUnread(0);
            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
        } catch {
            // ignore
        }
    };

    const markRead = async (id) => {
        try {
            await notificationApi.markRead(id);
            setUnread((current) => Math.max(0, current - 1));
            setNotifications((current) => current.map((item) => (
                item.notification_id === id ? { ...item, read: true } : item
            )));
        } catch {
            // ignore
        }
    };

    const unreadLabel = useMemo(() => {
        if (unread <= 0) return null;
        return unread > 9 ? "9+" : String(unread);
    }, [unread]);

    const formatRelative = (value) => {
        const diffSeconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
        if (diffSeconds < 60) return "Az once";
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} dk`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} sa`;
        return `${Math.floor(diffSeconds / 86400)} gun`;
    };

    return (
        <div className="relative">
            <button type="button" onClick={togglePanel} className="bank-icon-button relative" aria-label="Bildirimler">
                <Bell size={18} />
                {unreadLabel ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-[#060913] bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unreadLabel}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 top-14 z-[80] w-[22rem] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0a1020]/95 shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                        <div>
                            <p className="font-display text-lg font-bold text-white">Bildirimler</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Realtime inbox</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unread > 0 ? (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary"
                                >
                                    <CheckCheck size={12} />
                                    Tumunu oku
                                </button>
                            ) : null}
                            <button type="button" onClick={() => setOpen(false)} className="bank-icon-button !h-9 !w-9 !rounded-full">
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[24rem] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
                                Bildirim yok. Yeni hareketler burada gorunecek.
                            </div>
                        ) : notifications.map((item) => (
                            <button
                                key={item.notification_id}
                                type="button"
                                onClick={() => {
                                    if (!item.read) markRead(item.notification_id);
                                }}
                                className={`flex w-full items-start gap-3 border-b border-white/5 px-4 py-4 text-left transition ${item.read ? "bg-transparent" : "bg-primary/5 hover:bg-primary/10"}`}
                            >
                                <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.read ? "bg-white/5 text-slate-400" : "bg-primary/15 text-primary"}`}>
                                    <Bell size={16} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className={`block text-sm leading-6 ${item.read ? "font-medium text-[var(--text-secondary)]" : "font-semibold text-white"}`}>
                                        {item.message}
                                    </span>
                                    <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                        {formatRelative(item.created_at)}
                                    </span>
                                </span>
                                {!item.read ? <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.7)]" /> : null}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
