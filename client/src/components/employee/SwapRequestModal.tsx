import { useState } from "react";
import type { Shift } from "../../types";
import { fmtDateLong, fmtTimeRange } from "../../utils/datetime";
import { getErrorMessage } from "../../utils/getErrorMessage";
import Modal from "../ui/Modal";

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
            setError("כדי שהמנהל יוכל להחליט, כתוב בקצרה למה אתה מבקש להחליף.");
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
        <Modal open onOpenChange={(o) => !o && onClose()} title="בקשת החלפה למשמרת" description={`${shift.title || "משמרת"} · ${fmtDateLong(shift.startTime)} · ${fmtTimeRange(shift.startTime, shift.endTime)}`}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label htmlFor="swapReason">למה אתה מבקש להחליף?</label>
                    <textarea id="swapReason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="לדוגמה: תור לרופא, אירוע משפחתי" rows={3} maxLength={300} autoFocus />
                    <span className="form-hint">{reason.length}/300 · הבקשה תישלח למנהל, ורק אחרי אישורו תופיע בבורסה.</span>
                </div>
                {error && <div className="error-message">{error}</div>}
                <div className="dialog__actions">
                    <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? "שולח…" : "שלח למנהל"}</button>
                    <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>ביטול</button>
                </div>
            </form>
        </Modal>
    );
}
