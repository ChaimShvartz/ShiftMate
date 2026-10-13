import { useEffect } from "react";
import { useUiStore } from "../../store/uiStore";

// Themed replacement for window.confirm.
export default function ConfirmHost() {
    const req = useUiStore((s) => s.confirmRequest);
    const resolve = useUiStore((s) => s.resolveConfirm);

    useEffect(() => {
        if (!req) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && resolve(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [req, resolve]);

    if (!req) return null;
    return (
        <div className="modal-backdrop" dir="rtl" onClick={() => resolve(false)}>
            <div className="modal-content modal-content--sm" role="alertdialog" aria-modal onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <h3>{req.title}</h3>
                </header>
                <p className="confirm-text">{req.message}</p>
                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => resolve(false)}>
                        ביטול
                    </button>
                    <button type="button" autoFocus className={req.danger ? "btn-danger" : "btn-submit"} onClick={() => resolve(true)}>
                        {req.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
