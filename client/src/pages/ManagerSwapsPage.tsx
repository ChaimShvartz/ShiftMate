import { useEffect, useState } from "react";
import ApplicantsList from "../components/swaps/ApplicantsList";
import { useAuthStore } from "../store/authStore";
import { useSwapStore } from "../store/useSwapStore";
import { getErrorMessage } from "../utils/getErrorMessage";

// Manager sees ALL swaps pending_manager_publish — fetch separately
import { getBoard as getAllManagerSwaps } from "../api/swaps";
import type { SwapRequest } from "../types";

export default function ManagerSwapsPage() {
    const { user } = useAuthStore();
    const {
        compliance,
        publishSwap,
        rejectSwap,
        approveApplicant,
        rejectApplicant,
        fetchCompliance,
        addToast,
    } = useSwapStore();

    const [swaps, setSwaps] = useState<SwapRequest[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const data = await getAllManagerSwaps();
            setSwaps(data);
        } catch (err: unknown) {
            addToast(getErrorMessage(err, "שגיאה בטעינת בקשות החלפה"), "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handlePublish(id: string) {
        try {
            await publishSwap(id);
            addToast("הבקשה פורסמה לבורסה בהצלחה", "success");
            load();
        } catch (err: unknown) {
            addToast(
                getErrorMessage(err, "שגיאה בפרסום הבקשה לבורסה"),
                "error",
            );
        }
    }

    async function handleRejectSwap(id: string) {
        try {
            await rejectSwap(id);
            addToast("בקשת ההחלפה נדחתה", "warning");
            load();
        } catch (err: unknown) {
            addToast(getErrorMessage(err, "שגיאה בדחיית בקשת ההחלפה"), "error");
        }
    }

    async function handleApproveApplicant(
        swapId: string,
        employeeCode: string,
    ) {
        try {
            await approveApplicant(swapId, employeeCode);
            addToast(`ההחלפה אושרה עבור עובד ${employeeCode}`, "success");
            load();
        } catch (err: unknown) {
            addToast(getErrorMessage(err, "שגיאה באישור המועמד"), "error");
        }
    }

    async function handleRejectApplicant(swapId: string, employeeCode: string) {
        try {
            await rejectApplicant(swapId, employeeCode);
            addToast("המועמד נדחה", "warning");
            load();
        } catch (err: unknown) {
            addToast(getErrorMessage(err, "שגיאה בדחיית המועמד"), "error");
        }
    }

    const pendingPublish = swaps.filter(
        (s) => s.status === "pending_manager_publish",
    );
    const onBoard = swaps.filter((s) => s.status === "published_to_board");

    return (
        <div className="page">
            <h1 className="page__title">ניהול בקשות החלפה</h1>
            <p className="page__subtitle">יחידה: {user?.unitName}</p>

            {loading && <p className="page__loading">טוען...</p>}

            {/* Pending Publish Section */}
            {pendingPublish.length > 0 && (
                <section className="manager-swaps__section">
                    <h2 className="manager-swaps__section-title">
                        ⏳ ממתין לאישור פרסום ({pendingPublish.length})
                    </h2>
                    {pendingPublish.map((swap) => (
                        <div key={swap._id} className="manager-swap-item">
                            <div className="manager-swap-item__info">
                                <strong>
                                    {swap.requesterName ??
                                        swap.requesterEmployeeCode}
                                </strong>
                                {swap.shiftDetails && (
                                    <span>
                                        {" "}
                                        · משמרת #{swap.shiftId}
                                        {swap.shiftDetails.title
                                            ? ` (${swap.shiftDetails.title})`
                                            : ""}
                                    </span>
                                )}
                                {swap.reason && (
                                    <p className="manager-swap-item__reason">
                                        "{swap.reason}"
                                    </p>
                                )}
                            </div>
                            <div className="manager-swap-item__actions">
                                <button
                                    className="mgr-btn mgr-btn--publish"
                                    onClick={() => handlePublish(swap._id)}
                                >
                                    📢 פרסם לבורסה
                                </button>
                                <button
                                    className="mgr-btn mgr-btn--reject"
                                    onClick={() => handleRejectSwap(swap._id)}
                                >
                                    ✗ דחה
                                </button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* On Board — applicants section */}
            {onBoard.length > 0 && (
                <section className="manager-swaps__section">
                    <h2 className="manager-swaps__section-title">
                        📋 בבורסה — מועמדים ({onBoard.length})
                    </h2>
                    {onBoard.map((swap) => (
                        <div key={swap._id} className="manager-swap-item">
                            <div className="manager-swap-item__info">
                                <strong>
                                    {swap.requesterName ??
                                        swap.requesterEmployeeCode}
                                </strong>
                                {swap.shiftDetails && (
                                    <span> · משמרת #{swap.shiftId}</span>
                                )}
                            </div>
                            <ApplicantsList
                                swapId={swap._id}
                                applicants={swap.applicants}
                                enrichedSwap={swap}
                                compliance={compliance}
                                onFetchCompliance={fetchCompliance}
                                onApprove={(code) =>
                                    handleApproveApplicant(swap._id, code)
                                }
                                onReject={(code) =>
                                    handleRejectApplicant(swap._id, code)
                                }
                            />
                        </div>
                    ))}
                </section>
            )}

            {!loading &&
                pendingPublish.length === 0 &&
                onBoard.length === 0 && (
                    <p className="page__empty">אין בקשות החלפה פעילות.</p>
                )}
        </div>
    );
}
