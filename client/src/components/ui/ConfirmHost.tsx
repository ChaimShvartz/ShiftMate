import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { useUiStore } from "../../store/uiStore";

export default function ConfirmHost() {
    const req = useUiStore((s) => s.confirmRequest);
    const resolve = useUiStore((s) => s.resolveConfirm);

    useEffect(() => {
        if (!req) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && resolve(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [req, resolve]);

    return (
        <AnimatePresence>
            {req && (
                <motion.div
                    className="modal-backdrop"
                    dir="rtl"
                    onClick={() => resolve(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <motion.div
                        className="modal-content modal-content--sm"
                        role="alertdialog"
                        aria-modal
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    >
                        <header className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {req.danger ? (
                                    <span style={{ color: "var(--danger)" }}>
                                        <AlertTriangle size={22} />
                                    </span>
                                ) : (
                                    <span style={{ color: "var(--brand)" }}>
                                        <HelpCircle size={22} />
                                    </span>
                                )}
                                <h3>{req.title}</h3>
                            </div>
                        </header>
                        <p className="confirm-text">{req.message}</p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => resolve(false)}
                            >
                                ביטול
                            </button>
                            <button
                                type="button"
                                autoFocus
                                className={req.danger ? "btn-danger" : "btn-submit"}
                                onClick={() => resolve(true)}
                            >
                                {req.confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
