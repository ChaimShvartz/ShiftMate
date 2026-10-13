import { useSwapStore } from "../../store/useSwapStore";

const icons: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
};

export default function ToastContainer() {
    const { toasts, removeToast } = useSwapStore();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" role="region" aria-label="התראות">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    <span className="toast__icon">{icons[t.type]}</span>
                    <span className="toast__message">{t.message}</span>
                    <button
                        className="toast__close"
                        onClick={() => removeToast(t.id)}
                        aria-label="סגור"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
