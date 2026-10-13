import { useEffect, useState } from "react";
import { getShifts } from "../api/shifts";
import ShiftCard from "../components/employee/ShiftCard";
import SwapRequestModal from "../components/employee/SwapRequestModal";
import { useAuthStore } from "../store/authStore";
import { useSwapStore } from "../store/useSwapStore";
import type { Shift, ShiftWeek } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function MyShiftsPage() {
    const { user } = useAuthStore();
    const { createSwap, addToast } = useSwapStore();

    const [weekDoc, setWeekDoc] = useState<ShiftWeek | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    useEffect(() => {
        getShifts()
            .then(setWeekDoc)
            .catch((err) => {
                addToast(getErrorMessage(err, "שגיאה בטעינת משמרות"), "error");
            })
            .finally(() => setLoading(false));
    }, [addToast]);

    async function handleSwapConfirm(shiftId: number, reason: string) {
        try {
            await createSwap(shiftId, reason);
            addToast("בקשת ההחלפה הוגשה בהצלחה!", "success");
            // Re-fetch shifts to reflect swap_pending status
            const fresh = await getShifts();
            setWeekDoc(fresh);
            setSelectedShift(null);
        } catch (err: unknown) {
            addToast(getErrorMessage(err, "שגיאה בהגשת בקשת החלפה"), "error");
            throw err;
        }
    }

    const myShifts = (weekDoc?.shifts ?? []).filter(
        (s) => s.assignedEmployeeCode === user?.employeeCode,
    );

    return (
        <div className="page">
            <h1 className="page__title">המשמרות שלי</h1>

            {user?.unitName && (
                <p className="page__subtitle">
                    יחידה: <strong>{user.unitName}</strong>
                    {weekDoc && ` · שבוע ${weekDoc.weekNumber}`}
                </p>
            )}

            {loading && <p className="page__loading">טוען משמרות...</p>}

            {!loading && myShifts.length === 0 && (
                <p className="page__empty">אין משמרות משובצות עבור השבוע הנוכחי.</p>
            )}

            <div className="shifts-grid">
                {myShifts.map((shift) => (
                    <ShiftCard
                        key={shift.id}
                        shift={shift}
                        onRequestSwap={setSelectedShift}
                    />
                ))}
            </div>

            {selectedShift && (
                <SwapRequestModal
                    shift={selectedShift}
                    onConfirm={handleSwapConfirm}
                    onClose={() => setSelectedShift(null)}
                />
            )}
        </div>
    );
}
