import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    AlertTriangle,
    AlertOctagon,
    Info,
    X,
} from "lucide-react";
import { useUiStore } from "../../store/uiStore";

const ICONS = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertOctagon,
};

export default function ToastContainer() {
    const toasts = useUiStore((s) => s.toasts);
    const removeToast = useUiStore((s) => s.removeToast);

    return (
        <div
            className="toast-container"
            role="region"
            aria-label="הודעות"
            aria-live="polite"
        >
            <AnimatePresence>
                {toasts.map((t) => {
                    const Icon = ICONS[t.type] || Info;
                    return (
                        <motion.div
                            key={t.id}
                            className={`toast toast--${t.type}`}
                            initial={{ opacity: 0, y: 16, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                            layout
                        >
                            <span className="toast__icon">
                                <Icon size={18} />
                            </span>
                            <span className="toast__message">{t.message}</span>
                            <button
                                className="toast__close"
                                onClick={() => removeToast(t.id)}
                                aria-label="סגור"
                            >
                                <X size={15} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
