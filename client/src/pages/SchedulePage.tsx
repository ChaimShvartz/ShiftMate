import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Upload } from "lucide-react";
import { deleteShift, getShifts, updateShift } from "../api/shifts";
import { getAllUsers } from "../api/users";
import ExcelImportModal from "../components/manager/ExcelImportModal";
import ShiftEditModal from "../components/manager/ShiftEditModal";
import WeekScheduleView from "../components/manager/WeekScheduleView";
import { useNotificationStore } from "../store/notificationStore";
import type { Shift, ShiftWeek, User } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";

interface SchedulePageState {
    week: ShiftWeek | null;
    employees: User[];
    loading: boolean;
    error: string | null;
    feedback: string | null;
    isImportModalOpen: boolean;
    editingShift: Shift | null;
}

const SchedulePage = () => {
    const [state, setState] = useState<SchedulePageState>({
        week: null,
        employees: [],
        loading: true,
        error: null,
        feedback: null,
        isImportModalOpen: false,
        editingShift: null,
    });

    const loadData = async (weekNumber?: number) => {
        try {
            const [weekData, employeesData] = await Promise.all([
                getShifts(weekNumber),
                getAllUsers({ role: "employee" }),
            ]);

            setState((prev) => ({
                ...prev,
                week: (weekData as ShiftWeek) || null,
                employees: employeesData,
                loading: false,
                error: null,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "שגיאה בטעינת לוח המשמרות"),
            }));
        }
    };

    const shiftsVersion = useNotificationStore((s) => s.shiftsVersion);
    const currentWeek = state.week?.weekNumber;
    useEffect(() => {
        void loadData(currentWeek ?? undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shiftsVersion]);

    const handleImportSuccess = (newWeek: ShiftWeek) => {
        setState((prev) => ({
            ...prev,
            feedback: `לוח המשמרות לשבוע ${newWeek.weekNumber} עודכן בהצלחה!`,
        }));
        void loadData(newWeek.weekNumber);
    };

    const handleSaveShift = async (
        weekNumber: number,
        shiftId: number,
        data: {
            title?: string;
            assignedEmployeeCode?: string;
            startTime?: string;
            endTime?: string;
        },
    ) => {
        try {
            await updateShift(weekNumber, shiftId, data);
            await loadData(state.week?.weekNumber);
            setState((prev) => ({
                ...prev,
                feedback: `משמרת #${shiftId} עודכנה בהצלחה.`,
            }));
        } catch (err) {
            throw new Error(getErrorMessage(err, "שגיאה בעדכון המשמרת"), { cause: err });
        }
    };

    const handleDeleteShift = async (shiftId: number) => {
        if (!state.week) return;
        setState((prev) => ({ ...prev, error: null, feedback: null }));

        try {
            await deleteShift(state.week.weekNumber, shiftId);
            await loadData(state.week.weekNumber);
            setState((prev) => ({
                ...prev,
                feedback: `משמרת #${shiftId} נמחקה בהצלחה.`,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: getErrorMessage(err, "שגיאה במחיקת המשמרת"),
            }));
        }
    };

    return (
        <motion.div
            className="schedule-page"
            dir="rtl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <header className="page-header">
                <div className="page-title-wrap">
                    <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Calendar size={28} style={{ color: "var(--brand)" }} />
                        <span>לוח משמרות יחידתי</span>
                    </h1>
                    <p>צפייה, עריכה וניהול שיבוץ שבועי באקסל</p>
                </div>

                <div className="page-actions-wrap">
                    <motion.button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                            setState((prev) => ({
                                ...prev,
                                isImportModalOpen: true,
                            }))
                        }
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Upload size={16} />
                        <span>העלאת לוח משמרות (Excel)</span>
                    </motion.button>
                </div>
            </header>

            {state.feedback && (
                <div className="feedback-banner success">{state.feedback}</div>
            )}
            {state.error && (
                <div className="feedback-banner error">{state.error}</div>
            )}

            {(state.week?.weeks?.length ?? 0) > 1 && (
                <div className="week-switch" role="group" aria-label="בחירת שבוע">
                    {state.week?.weeks?.map((w) => {
                        const active = w.weekNumber === state.week?.weekNumber;
                        return (
                            <button
                                key={w.weekNumber}
                                type="button"
                                className={active ? "is-active" : ""}
                                onClick={() => loadData(w.weekNumber)}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="week-active-pill"
                                        className="tab-active-indicator"
                                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                    />
                                )}
                                <span className="tab-label">שבוע {w.weekNumber}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {state.loading ? (
                <div className="loading-state">טוען לוח משמרות...</div>
            ) : (
                <WeekScheduleView
                    week={state.week}
                    employees={state.employees}
                    onEditShift={(shift) =>
                        setState((prev) => ({ ...prev, editingShift: shift }))
                    }
                    onDeleteShift={handleDeleteShift}
                />
            )}

            <ExcelImportModal
                isOpen={state.isImportModalOpen}
                onClose={() =>
                    setState((prev) => ({ ...prev, isImportModalOpen: false }))
                }
                onImportSuccess={handleImportSuccess}
            />

            <ShiftEditModal
                isOpen={Boolean(state.editingShift)}
                onClose={() =>
                    setState((prev) => ({ ...prev, editingShift: null }))
                }
                shift={state.editingShift}
                weekNumber={state.week?.weekNumber || 1}
                employees={state.employees}
                onSave={handleSaveShift}
            />
        </motion.div>
    );
};

export default SchedulePage;
