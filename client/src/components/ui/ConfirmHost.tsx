import { useUiStore } from "../../store/uiStore";
import Modal from "./Modal";

// Themed replacement for window.confirm.
export default function ConfirmHost() {
    const req = useUiStore((s) => s.confirmRequest);
    const resolve = useUiStore((s) => s.resolveConfirm);

    return (
        <Modal open={Boolean(req)} onOpenChange={(o) => !o && resolve(false)} title={req?.title ?? ""} description={req?.message} size="sm">
            <div className="dialog__actions">
                <button type="button" autoFocus className={req?.danger ? "btn btn--danger" : "btn btn--primary"} onClick={() => resolve(true)}>
                    {req?.confirmLabel}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => resolve(false)}>
                    ביטול
                </button>
            </div>
        </Modal>
    );
}
