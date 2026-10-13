import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { timeAgo } from "../../utils/datetime";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const role = useAuthStore((s) => s.user?.role);
    const { items, unread, connected, markAllRead, clearAll } = useNotificationStore();

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const toggle = () => {
        setOpen((o) => !o);
        if (!open && unread > 0) void markAllRead();
    };

    const go = (type: string) => {
        setOpen(false);
        const shiftType = type.startsWith("import") || type.startsWith("shift");
        if (role === "manager") navigate(shiftType ? "/schedule" : "/dashboard");
        else if (role === "employee") navigate(shiftType ? "/my-shifts" : "/swaps");
    };

    return (
        <div className="bell" ref={ref}>
            <button type="button" className="icon-btn" aria-label={`התראות${unread ? ` (${unread} חדשות)` : ""}`} aria-expanded={open} onClick={toggle}>
                <Bell size={19} strokeWidth={1.75} />
                {unread > 0 && <span className="bell__badge">{unread > 9 ? "9+" : unread}</span>}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="bell__panel"
                        role="dialog"
                        aria-label="התראות"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    >
                        <header className="bell__head">
                            <strong>התראות</strong>
                            <span className={`live ${connected ? "is-on" : ""}`}>
                                <i />
                                {connected ? "בזמן אמת" : "לא מחובר"}
                            </span>
                            {items.length > 0 && (
                                <button type="button" className="link-btn" onClick={() => void clearAll()}>
                                    נקה הכל
                                </button>
                            )}
                        </header>
                        <ul className="bell__list">
                            {items.length === 0 && <li className="bell__empty">אין התראות. כשיקרה משהו בבקשות ההחלפה, תראה אותו כאן.</li>}
                            {items.map((n) => (
                                <li key={n.id}>
                                    <button type="button" className={`bell__item bell__item--${n.level} ${n.read ? "" : "is-unread"}`} onClick={() => go(n.type)}>
                                        <span className="bell__tone" />
                                        <span className="bell__text">
                                            <strong>{n.title}</strong>
                                            <span>{n.message}</span>
                                            <time>{timeAgo(n.createdAt)}</time>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
