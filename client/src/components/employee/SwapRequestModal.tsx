import { useState } from "react";
import type { Shift } from "../../types";
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
        } catch (err: unknown) {
            setError(getErrorMessage(err, "שגיאה בהגשת בקשת החלפה"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal>
            <div className="swap-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="swap-modal__title">בקשת החלפת משמרת</h2>
                <p className="swap-modal__subtitle">
                    משמרת #{shift.id} — {shift.title || "ללא כותרת"}
                </p>

                <form onSubmit={handleSubmit} className="swap-modal__form">
                    <label className="swap-modal__label">
                        סיבת ההחלפה
                        <textarea
                            className="swap-modal__textarea"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="לדוגמה: תור לרופא, אירוע משפחתי..."
                            rows={3}
                            maxLength={300}
                            autoFocus
                        />
                    </label>
                    {error && <p className="swap-modal__error">{error}</p>}
                    <div className="swap-modal__actions">
                        <button
                            type="button"
                            className="swap-modal__btn swap-modal__btn--cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className="swap-modal__btn swap-modal__btn--submit"
                            disabled={loading}
                        >
                            {loading ? "שולח..." : "שלח בקשה"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
