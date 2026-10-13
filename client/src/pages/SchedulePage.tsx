import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { deleteShift, getShifts, updateShift } from "../api/shifts";
import { getAllUsers } from "../api/users";
import SearchInput from "../components/ui/SearchInput";
import ExcelImportModal from "../components/manager/ExcelImportModal";
import ShiftCreateModal from "../components/manager/ShiftCreateModal";
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
    creating: { employeeCode?: string; date?: string } | null;
}

const SchedulePage = () => {
    const [params] = useSearchParams();
    const [query, setQuery] = useState(params.get("q") ?? "");
    const [state, setState] = useState<SchedulePageState>({
        week: null,
        employees: [],
        loading: true,
        error: null,
        feedback: null,
        isImportModalOpen: false,
        editingShift: null,
        creating: null,
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
        <div className="page">
            <header className="page-head">
                <div>
                    <h1 className="page__title">לוח משמרות</h1>
                    <p className="page__subtitle">
                        {state.week?.weekNumber ? <>שבוע <b>{state.week.weekNumber}</b> · {state.week.shifts.length} משמרות</> : "אין עדיין לוח לשבוע הזה"}. לחיצה על משמרת פותחת עריכה.
                    </p>
                </div>
                <div className="page-actions">
                    <SearchInput label="חיפוש בלוח" placeholder="חיפוש עובד או משמרת" value={query} onChange={setQuery} />
                    {state.week && state.week.weekNumber && (
                        <button type="button" className="btn btn--ghost" onClick={() => setState((prev) => ({ ...prev, creating: {} }))}>
                            <Plus size={16} />
                            הוסף משמרת
                        </button>
                    )}
                    <button type="button" className="btn btn--primary" onClick={() => setState((prev) => ({ ...prev, isImportModalOpen: true }))}>
                        <Upload size={16} />
                        העלאת לוח (Excel)
                    </button>
                </div>
            </header>

            {state.feedback && <div className="feedback-banner"><span>{state.feedback}</span><button type="button" className="btn-dismiss" aria-label="סגור" onClick={() => setState((p) => ({ ...p, feedback: null }))}><X size={16} /></button></div>}
            {state.error && <div className="error-banner"><span>{state.error}</span></div>}

            {(state.week?.weeks?.length ?? 0) > 1 && (
                <div className="toolbar">
                    <div className="week-switch" role="group" aria-label="בחירת שבוע">
                        {state.week?.weeks?.map((w) => (
                            <button key={w.weekNumber} type="button" className={w.weekNumber === state.week?.weekNumber ? "is-active" : ""} onClick={() => loadData(w.weekNumber)}>
                                שבוע {w.weekNumber}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {state.loading ? (
                <div className="loading-state">טוען לוח משמרות…</div>
            ) : (
                <WeekScheduleView
                    week={state.week}
                    employees={state.employees}
                    query={query}
                    onEditShift={(shift) => setState((prev) => ({ ...prev, editingShift: shift }))}
                    onDeleteShift={handleDeleteShift}
                    onAddShift={(employeeCode, date) => setState((prev) => ({ ...prev, creating: { employeeCode, date } }))}
                />
            )}

            <ExcelImportModal isOpen={state.isImportModalOpen} onClose={() => setState((prev) => ({ ...prev, isImportModalOpen: false }))} onImportSuccess={handleImportSuccess} />

            {state.creating && state.week && state.week.weekNumber && (
                <ShiftCreateModal
                    open
                    week={state.week}
                    employees={state.employees}
                    prefill={state.creating}
                    onClose={() => setState((prev) => ({ ...prev, creating: null }))}
                    onCreated={() => {
                        setState((prev) => ({ ...prev, feedback: "המשמרת נוספה ללוח והעובד קיבל התראה." }));
                        void loadData(state.week?.weekNumber);
                    }}
                />
            )}

            <ShiftEditModal
                isOpen={Boolean(state.editingShift)}
                onClose={() => setState((prev) => ({ ...prev, editingShift: null }))}
                shift={state.editingShift}
                weekNumber={state.week?.weekNumber || 1}
                employees={state.employees}
                onSave={handleSaveShift}
            />
        </div>
    );
};

export default SchedulePage;
