import React, { useEffect, useState } from "react";
import type { Shift, User } from "../../types";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface ShiftEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: Shift | null;
    weekNumber: number;
    employees: User[];
    onSave: (
        weekNumber: number,
        shiftId: number,
        data: {
            title?: string;
            assignedEmployeeCode?: string;
            startTime?: string;
            endTime?: string;
        },
    ) => Promise<void>;
}

const formatForDateTimeInput = (isoString?: string) => {
    // Shift times are floating wall-clock values stored as UTC - never convert.
    return isoString ? isoString.slice(0, 16) : "";
};

const initialForm = {
    title: "",
    assignedEmployeeCode: "",
    startTime: "",
    endTime: "",
};

const ShiftEditModal = ({
    isOpen,
    onClose,
    shift,
    weekNumber,
    employees,
    onSave,
}: ShiftEditModalProps) => {
    const [formData, setFormData] = useState(initialForm);
    const [status, setStatus] = useState<{
        loading: boolean;
        error: string | null;
    }>({
        loading: false,
        error: null,
    });

    useEffect(() => {
        if (shift) {
            setFormData({
                title: shift.title || "",
                assignedEmployeeCode: shift.assignedEmployeeCode || "",
                startTime: formatForDateTimeInput(shift.startTime),
                endTime: formatForDateTimeInput(shift.endTime),
            });
            setStatus({ loading: false, error: null });
        }
    }, [shift]);

    if (!isOpen || !shift) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ loading: true, error: null });

        try {
            await onSave(weekNumber, shift.id, {
                title: formData.title.trim() || undefined,
                assignedEmployeeCode:
                    formData.assignedEmployeeCode || undefined,
                startTime: `${formData.startTime}:00.000Z`,
                endTime: `${formData.endTime}:00.000Z`,
            });
            onClose();
        } catch (err) {
            setStatus({
                loading: false,
                error: getErrorMessage(err, "שגיאה בעדכון המשמרת"),
            });
        }
    };

    return (
        <div className="modal-backdrop" dir="rtl">
            <div className="modal-content">
                <header className="modal-header">
                    <h3>עריכת משמרת #{shift.id}</h3>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </header>

                {status.error && (
                    <div className="error-message">{status.error}</div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="shiftTitle">
                            כותרת משמרת (אופציונלי)
                        </label>
                        <input
                            id="shiftTitle"
                            name="title"
                            type="text"
                            placeholder="לדוגמה: משמרת בוקר"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="assignedEmployee">עובד משובץ</label>
                        <select
                            id="assignedEmployee"
                            name="assignedEmployeeCode"
                            value={formData.assignedEmployeeCode}
                            onChange={handleChange}
                            required
                        >
                            <option value="">בחר עובד מהיחידה...</option>
                            {employees.map((emp) => (
                                <option
                                    key={emp.employeeCode}
                                    value={emp.employeeCode}
                                >
                                    {emp.fullName} (#{emp.employeeCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="shiftStartTime">מועד התחלה</label>
                        <input
                            id="shiftStartTime"
                            name="startTime"
                            type="datetime-local"
                            required
                            value={formData.startTime}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="shiftEndTime">מועד סיום</label>
                        <input
                            id="shiftEndTime"
                            name="endTime"
                            type="datetime-local"
                            required
                            value={formData.endTime}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={status.loading}
                            className="btn-submit"
                        >
                            {status.loading ? "שומר..." : "שמור שינויים"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShiftEditModal;
