import { getErrorMessage } from "../../utils/getErrorMessage";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, CheckCircle2 } from "lucide-react";
import type { Role, Unit, User } from "../../types";

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    units: Unit[];
    onSubmit: (userData: {
        role: Role;
        fullName: string;
        phone: string;
        email: string;
        password: string;
        unitName?: string;
        maxWeeklyHours?: number | null;
    }) => Promise<User | null>;
}

const initialForm = {
    role: "employee" as Role,
    fullName: "",
    phone: "",
    email: "",
    password: "",
    unitName: "",
    maxWeeklyHours: "",
};

const UserFormModal = ({
    isOpen,
    onClose,
    units,
    onSubmit,
}: UserFormModalProps) => {
    const [formData, setFormData] = useState(initialForm);
    const [status, setStatus] = useState<{
        loading: boolean;
        error: string | null;
        createdUser: User | null;
    }>({
        loading: false,
        error: null,
        createdUser: null,
    });

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const result = await onSubmit({
                role: formData.role,
                fullName: formData.fullName.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                password: formData.password,
                unitName: formData.unitName || undefined,
                maxWeeklyHours:
                    formData.role === "employee" && formData.maxWeeklyHours
                        ? Number(formData.maxWeeklyHours)
                        : null,
            });

            if (result) {
                setStatus({
                    loading: false,
                    error: null,
                    createdUser: result,
                });
            }
        } catch (err) {
            setStatus((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "שגיאה ביצירת משתמש"),
            }));
        }
    };

    const handleClose = () => {
        setFormData(initialForm);
        setStatus({ loading: false, error: null, createdUser: null });
        onClose();
    };

    const isManager = formData.role === "manager";

    return (
        <AnimatePresence>
            <motion.div
                className="modal-backdrop"
                dir="rtl"
                onClick={handleClose}
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
                            <UserPlus size={20} style={{ color: "var(--brand)" }} />
                            <div>
                                <h3>
                                    {isManager ? "מינוי מנהל יחידה" : "הוספת עובד חדש"}
                                </h3>
                                <p className="modal-subtitle" style={{ margin: 0 }}>
                                    {isManager
                                        ? "הגדרת מנהל יחידה פעיל"
                                        : "הגדרת עובד חדש ושיוכו ליחידה"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        >
                            <X size={16} />
                        </button>
                    </header>

                    {status.error && (
                        <div className="error-message">{status.error}</div>
                    )}

                    {status.createdUser ? (
                        <div className="modal-success-content">
                            <div className="success-icon">
                                <CheckCircle2 size={44} style={{ color: "var(--success)", margin: "0 auto 12px" }} />
                            </div>
                            <h4>המשתמש נוצר בהצלחה!</h4>
                            <p>
                                <strong>{status.createdUser.fullName}</strong> נוסף למערכת.
                            </p>
                            <div className="code-box">
                                <span>קוד עובד שהוקצה:</span>
                                <strong className="code-value">
                                    #{status.createdUser.employeeCode}
                                </strong>
                            </div>
                            <p className="code-note">
                                מסור קוד זה לעובד לצורך התחברותו הראשונית.
                            </p>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleClose}
                            >
                                סיום וסגירה
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="userRole">תפקיד המשתמש</label>
                                <select
                                    id="userRole"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="employee">
                                        עובד (משובץ למשמרות)
                                    </option>
                                    <option value="manager">
                                        מנהל יחידה (אחראי משמרות)
                                    </option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="userFullName">שם מלא</label>
                                <input
                                    id="userFullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    placeholder="לדוגמה: ישראל ישראלי"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="userPhone">טלפון</label>
                                    <input
                                        id="userPhone"
                                        name="phone"
                                        type="tel"
                                        required
                                        placeholder="0501234567"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        dir="ltr"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="userEmail">כתובת אימייל</label>
                                    <input
                                        id="userEmail"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="userUnit">
                                    {isManager
                                        ? "יחידה לניהול *"
                                        : "יחידה משויכת *"}
                                </label>
                                <select
                                    id="userUnit"
                                    name="unitName"
                                    value={formData.unitName}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">בחר יחידה...</option>
                                    {units.map((u) => (
                                        <option key={u.name} value={u.name}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="userPassword">סיסמה ראשונית</label>
                                <input
                                    id="userPassword"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="לפחות 6 תווים"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            {formData.role === "employee" ? (
                                <div className="form-group">
                                    <label htmlFor="maxWeeklyHours">
                                        מקסימום שעות שבועיות (אופציונלי)
                                    </label>
                                    <input
                                        id="maxWeeklyHours"
                                        name="maxWeeklyHours"
                                        type="number"
                                        min={1}
                                        max={100}
                                        placeholder="ברירת מחדל: 40 שעות"
                                        value={formData.maxWeeklyHours}
                                        onChange={handleChange}
                                    />
                                    <small className="form-hint">
                                        מכסה זו משמשת לבדיקות תאימות ושיבוץ משמרות.
                                    </small>
                                </div>
                            ) : null}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={handleClose}
                                >
                                    ביטול
                                </button>
                                <motion.button
                                    type="submit"
                                    disabled={status.loading}
                                    className="btn-submit"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {status.loading
                                        ? "יוצר..."
                                        : isManager
                                          ? "מנה מנהל יחידה"
                                          : "צור עובד חדש"}
                                </motion.button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UserFormModal;
