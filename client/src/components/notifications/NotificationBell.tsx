import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    CheckCircle2,
    AlertTriangle,
    AlertOctagon,
    Info,
    CheckCheck,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { timeAgo } from "../../utils/datetime";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertOctagon,
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

    const toggle = () => {
        setOpen((o) => !o);
        if (!open && unread > 0) void markAllRead();
    };

    const go = (type: string) => {
        setOpen(false);
        if (role === "manager") {
            navigate(type.startsWith("import") || type.startsWith("shift") ? "/schedule" : "/dashboard");
        } else if (role === "employee") {
            navigate(
                type === "shift_awarded" ||
                type === "shift_removed" ||
                type.startsWith("shift") ||
                type === "import_completed"
                    ? "/my-shifts"
                    : "/swaps",
            );
        }
    };

    return (
        <div className="bell" ref={ref}>
            <motion.button
                type="button"
                className="icon-btn"
                aria-label={`התראות${unread ? ` (${unread} חדשות)` : ""}`}
                aria-expanded={open}
                onClick={toggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Bell size={18} />
                {unread > 0 && (
                    <motion.span
                        className="bell__badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                        {unread > 9 ? "9+" : unread}
                    </motion.span>
                )}
                <span
                    className={`bell__dot ${connected ? "is-live" : ""}`}
                    title={connected ? "מחובר בזמן אמת" : "מתחבר מחדש…"}
                />
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="bell__panel"
                        role="dialog"
                        aria-label="התראות"
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    >
                        <header className="bell__head">
                            <strong>התראות מערכת</strong>
                            <span className={`live-pill ${connected ? "is-live" : ""}`}>
                                {connected ? "● מחובר" : "○ מתחבר..."}
                            </span>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    className="link-btn"
                                    onClick={() => void clearAll()}
                                >
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <CheckCheck size={13} />
                                        <span>נקה הכל</span>
                                    </span>
                                </button>
                            )}
                        </header>
                        <ul className="bell__list">
                            {items.length === 0 && (
                                <li className="bell__empty">
                                    אין התראות חדשות כרגע ✨
                                </li>
                            )}
                            {items.map((n) => {
                                const Icon = ICONS[n.level] || Info;
                                return (
                                    <li key={n.id}>
                                        <button
                                            type="button"
                                            className={`bell__item bell__item--${n.level} ${
                                                n.read ? "" : "is-unread"
                                            }`}
                                            onClick={() => go(n.type)}
                                        >
                                            <span className="bell__icon">
                                                <Icon size={16} />
                                            </span>
                                            <span className="bell__text">
                                                <strong>{n.title}</strong>
                                                <span>{n.message}</span>
                                                <time>{timeAgo(n.createdAt)}</time>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
