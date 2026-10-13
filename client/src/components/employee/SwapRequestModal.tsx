import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeftRight } from "lucide-react";
import type { Shift } from "../../types";
import { fmtDateLong, fmtTimeRange } from "../../utils/datetime";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface Props {
    shift: Shift;
    onConfirm: (shiftId: number, reason: string) => Promise<void>;
    onClose: () => void;
}

export default function SwapRequestModal({ shift, onConfirm, onClose }: Props) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!reason.trim()) {
            setError("נא לציין סיבה לבקשת ההחלפה.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await onConfirm(shift.id, reason.trim());
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "שגיאה בהגשת בקשת החלפה"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                className="modal-backdrop"
                dir="rtl"
                onClick={onClose}
                role="dialog"
                aria-modal
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
            >
                <motion.div
                    className="modal-content modal-content--sm"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                >
                    <header className="modal-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ color: "var(--brand)" }}>
                                <ArrowLeftRight size={20} />
                            </span>
                            <h3>בקשת החלפת משמרת</h3>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="סגור"
                        >
                            <X size={16} />
                        </button>
                    </header>
                    <p className="modal-subtitle">
                        {shift.title || "משמרת"} · {fmtDateLong(shift.startTime)} · {fmtTimeRange(shift.startTime, shift.endTime)}
                    </p>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="form-group">
                            <label htmlFor="swapReason">סיבת ההחלפה</label>
                            <textarea
                                id="swapReason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="לדוגמה: תור לרופא, לימודים, אירוע משפחתי..."
                                rows={3}
                                maxLength={300}
                                autoFocus
                            />
                            <span className="form-hint">
                                {reason.length}/300 · הבקשה תישלח לאישור מנהל היחידה
                            </span>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={onClose}
                                disabled={loading}
                            >
                                ביטול
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={loading}
                            >
                                {loading ? "שולח..." : "שלח בקשה למנהל"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
