import Select from "../ui/Select";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Clock, User, Save } from "lucide-react";
import type { Shift, User as UserType } from "../../types";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface ShiftEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: Shift | null;
    weekNumber: number;
    employees: UserType[];
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
        <AnimatePresence>
            <motion.div
                className="modal-backdrop"
                dir="rtl"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                >
                    <header className="modal-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Edit2 size={18} style={{ color: "var(--brand)" }} />
                            <h3>עריכת משמרת #{shift.id}</h3>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        >
                            <X size={16} />
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
                                placeholder="לדוגמה: משמרת בוקר, תורנות מוקד..."
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="assignedEmployee">
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <User size={13} style={{ opacity: 0.6 }} />
                                    <span>עובד משובץ</span>
                                </span>
                            </label>
                            <Select
                                id="assignedEmployee"
                                name="assignedEmployeeCode"
                                required
                                value={formData.assignedEmployeeCode}
                                placeholder="בחר עובד מהיחידה"
                                onValueChange={(v) => setFormData((prev) => ({ ...prev, assignedEmployeeCode: v }))}
                                options={employees.map((emp) => ({ value: emp.employeeCode, label: `${emp.fullName} (#${emp.employeeCode})` }))}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="shiftStartTime">
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                        <Clock size={13} style={{ opacity: 0.6 }} />
                                        <span>מועד התחלה</span>
                                    </span>
                                </label>
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
                                <label htmlFor="shiftEndTime">
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                        <Clock size={13} style={{ opacity: 0.6 }} />
                                        <span>מועד סיום</span>
                                    </span>
                                </label>
                                <input
                                    id="shiftEndTime"
                                    name="endTime"
                                    type="datetime-local"
                                    required
                                    value={formData.endTime}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={onClose}
                            >
                                ביטול
                            </button>
                            <motion.button
                                type="submit"
                                disabled={status.loading}
                                className="btn-submit"
                                whileTap={{ scale: 0.98 }}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <Save size={15} />
                                    <span>{status.loading ? "שומר..." : "שמור שינויים"}</span>
                                </span>
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ShiftEditModal;
