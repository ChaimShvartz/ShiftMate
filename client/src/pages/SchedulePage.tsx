import { useEffect, useState } from "react";
import { deleteShift, getShifts, updateShift } from "../api/shifts";
import { getAllUsers } from "../api/users";
import ExcelImportModal from "../components/manager/ExcelImportModal";
import ShiftEditModal from "../components/manager/ShiftEditModal";
import WeekScheduleView from "../components/manager/WeekScheduleView";
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

    useEffect(() => {
        loadData();
    }, []);

    const handleImportSuccess = (newWeek: ShiftWeek) => {
        setState((prev) => ({
            ...prev,
            week: newWeek,
            feedback: `לוח המשמרות לשבוע ${newWeek.weekNumber} עודכן בהצלחה!`,
        }));
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
            throw new Error(getErrorMessage(err, "שגיאה בעדכון המשמרת"));
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
        <div className="schedule-page" dir="rtl">
            <header className="page-header">
                <div className="page-title-wrap">
                    <h1>📅 לוח משמרות יחידתי</h1>
                    <p>צפייה, עריכה והעלאת קובץ שיבוץ שבועי באקסל</p>
                </div>

                <div className="page-actions-wrap">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                            setState((prev) => ({
                                ...prev,
                                isImportModalOpen: true,
                            }))
                        }
                    >
                        📤 העלאת לוח משמרות (Excel)
                    </button>
                </div>
            </header>

            {state.feedback && (
                <div className="feedback-banner success">{state.feedback}</div>
            )}
            {state.error && (
                <div className="feedback-banner error">{state.error}</div>
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
        </div>
    );
};

export default SchedulePage;
