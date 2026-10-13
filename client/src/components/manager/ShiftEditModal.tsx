import React, { useEffect, useState } from "react";
import type { Shift, User } from "../../types";

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
    if (!isoString) return "";
    try {
        const d = new Date(isoString);
        const pad = (n: number) => String(n).padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return "";
    }
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
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
            });
            onClose();
        } catch (err: any) {
            setStatus({
                loading: false,
                error: err?.message || "שגיאה בעדכון המשמרת",
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
