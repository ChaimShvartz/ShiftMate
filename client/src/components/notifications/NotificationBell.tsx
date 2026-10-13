import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { timeAgo } from "../../utils/datetime";

const ICONS: Record<string, string> = {
    info: "🔔",
    success: "✅",
    warning: "⚠️",
    error: "⛔",
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const role = useAuthStore((s) => s.user?.role);
    const { items, unread, connected, markAllRead, clearAll } =
        useNotificationStore();

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const btnRef = useRef<HTMLButtonElement>(null);
    const prevUnread = useRef(unread);
    useEffect(() => {
        if (unread > prevUnread.current && btnRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            gsap.fromTo(btnRef.current, { rotate: -18 }, { rotate: 0, duration: 1, ease: "elastic.out(1, 0.35)", clearProps: "transform" });
        }
        prevUnread.current = unread;
    }, [unread]);

    const toggle = () => {
        setOpen((o) => !o);
        if (!open && unread > 0) void markAllRead();
    };

    const go = (type: string) => {
        setOpen(false);
        if (role === "manager") {
            navigate(type.startsWith("import") || type.startsWith("shift") ? "/schedule" : "/dashboard");
        } else if (role === "employee") {
            navigate(type === "shift_awarded" || type === "shift_removed" || type.startsWith("shift") || type === "import_completed" ? "/my-shifts" : "/swaps");
        }
    };

    return (
        <div className="bell" ref={ref}>
            <button
                ref={btnRef}
                type="button"
                className="icon-btn"
                aria-label={`התראות${unread ? ` (${unread} חדשות)` : ""}`}
                aria-expanded={open}
                onClick={toggle}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 && (
                    <span className="bell__badge">{unread > 9 ? "9+" : unread}</span>
                )}
                <span className={`bell__dot ${connected ? "is-live" : ""}`} title={connected ? "מחובר בזמן אמת" : "מתחבר מחדש…"} />
            </button>

            {open && (
                <div className="bell__panel" role="dialog" aria-label="התראות">
                    <header className="bell__head">
                        <strong>התראות</strong>
                        <span className={`live-pill ${connected ? "is-live" : ""}`}>
                            {connected ? "● בזמן אמת" : "○ לא מחובר"}
                        </span>
                        {items.length > 0 && (
                            <button type="button" className="link-btn" onClick={() => void clearAll()}>
                                נקה הכל
                            </button>
                        )}
                    </header>
                    <ul className="bell__list">
                        {items.length === 0 && (
                            <li className="bell__empty">אין התראות חדשות 🎉</li>
                        )}
                        {items.map((n) => (
                            <li key={n.id}>
                                <button
                                    type="button"
                                    className={`bell__item bell__item--${n.level} ${n.read ? "" : "is-unread"}`}
                                    onClick={() => go(n.type)}
                                >
                                    <span className="bell__icon">{ICONS[n.level]}</span>
                                    <span className="bell__text">
                                        <strong>{n.title}</strong>
                                        <span>{n.message}</span>
                                        <time>{timeAgo(n.createdAt)}</time>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
