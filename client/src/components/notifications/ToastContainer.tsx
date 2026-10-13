import { useUiStore } from "../../store/uiStore";

const icons = { info: "ℹ️", success: "✅", warning: "⚠️", error: "⛔" };

export default function ToastContainer() {
    const toasts = useUiStore((s) => s.toasts);
    const removeToast = useUiStore((s) => s.removeToast);

    return (
        <div className="toast-container" role="region" aria-label="הודעות" aria-live="polite">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    <span className="toast__icon">{icons[t.type]}</span>
                    <span className="toast__message">{t.message}</span>
                    <button className="toast__close" onClick={() => removeToast(t.id)} aria-label="סגור">
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
