import { useEffect } from "react";
import SwapCard from "../components/swaps/SwapCard";
import { useAuthStore } from "../store/authStore";
import { useSwapStore } from "../store/useSwapStore";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function SwapBoardPage() {
    const { user } = useAuthStore();
    const { board, loadingBoard, fetchBoard, applySwap, addToast } =
        useSwapStore();

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    async function handleApply(swapId: string) {
        try {
            await applySwap(swapId);
            addToast("המועמדות הוגשה בהצלחה!", "success");
        } catch (err: unknown) {
            addToast(getErrorMessage(err, "שגיאה בהגשת מועמדות"), "error");
        }
    }

    const isEmployee = user?.role === "employee";

    return (
        <div className="page">
            <h1 className="page__title">בורסת משמרות</h1>
            <p className="page__subtitle">
                בקשות החלפת משמרת פתוחות ביחידה שלך
            </p>

            {loadingBoard && (
                <p className="page__loading">טוען בורסת משמרות...</p>
            )}

            {!loadingBoard && board.length === 0 && (
                <p className="page__empty">אין בקשות החלפה פתוחות כרגע.</p>
            )}

            <div className="swaps-grid">
                {board.map((swap) => (
                    <SwapCard
                        key={swap._id}
                        swap={swap}
                        currentEmployeeCode={user?.employeeCode ?? ""}
                        onApply={
                            isEmployee ? () => handleApply(swap._id) : undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
}
