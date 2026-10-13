import { getErrorMessage } from "../../utils/getErrorMessage";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCheck, Save } from "lucide-react";
import type { Unit, User } from "../../types";

interface EditUserModalProps {
    isOpen: boolean;
    user: User | null;
    units: Unit[];
    onClose: () => void;
    onSubmit: (
        employeeCode: string,
        updates: {
            fullName?: string;
            phone?: string;
            email?: string;
            unitName?: string;
            maxWeeklyHours?: number | null;
            password?: string;
        },
    ) => Promise<User | null>;
}

const EditUserModal = ({
    isOpen,
    user,
    units,
    onClose,
    onSubmit,
}: EditUserModalProps) => {
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        unitName: "",
        maxWeeklyHours: "",
        password: "",
    });

    const [status, setStatus] = useState<{
        loading: boolean;
        error: string | null;
        success: boolean;
    }>({
        loading: false,
        error: null,
        success: false,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                phone: user.phone || "",
                email: user.email || "",
                unitName: user.unitName || "",
                maxWeeklyHours: user.maxWeeklyHours
                    ? String(user.maxWeeklyHours)
                    : "",
                password: "",
            });
            setStatus({ loading: false, error: null, success: false });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ loading: true, error: null, success: false });

        try {
            const updates: {
                fullName?: string;
                phone?: string;
                email?: string;
                unitName?: string;
                maxWeeklyHours?: number | null;
                password?: string;
            } = {
                fullName: formData.fullName.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
            };

            if (formData.password) {
                updates.password = formData.password;
            }

            if (user.role === "manager") {
                updates.unitName = formData.unitName || undefined;
            } else if (user.role === "employee") {
                updates.unitName = formData.unitName || undefined;
                updates.maxWeeklyHours = formData.maxWeeklyHours
                    ? Number(formData.maxWeeklyHours)
                    : 40;
            }

            const res = await onSubmit(user.employeeCode, updates);
            if (res) {
                setStatus({ loading: false, error: null, success: true });
                setTimeout(() => {
                    onClose();
                }, 800);
            }
        } catch (err) {
            setStatus((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "שגיאה בעדכון פרטי המשתמש"),
            }));
        }
    };

    const getRoleTitle = () => {
        switch (user.role) {
            case "admin":
                return "עריכת מנהל ראשי";
            case "manager":
                return "עריכת מנהל יחידה";
            case "employee":
                return "עריכת עובד";
            default:
                return "עריכת משתמש";
        }
    };

    const getRoleSubtitle = () => {
        switch (user.role) {
            case "admin":
                return "מנהל מערכת ראשי (ניהול גלובלי ללא שיוך יחידה)";
            case "manager":
                return `מנהל יחידה #${user.employeeCode}`;
            case "employee":
                return `עובד יחידה #${user.employeeCode}`;
            default:
                return "";
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
                            <UserCheck size={20} style={{ color: "var(--brand)" }} />
                            <div>
                                <h3>{getRoleTitle()}</h3>
                                <p className="modal-subtitle" style={{ margin: 0 }}>{getRoleSubtitle()}</p>
                            </div>
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
                    {status.success && (
                        <div className="success-message">הפרטים עודכנו בהצלחה!</div>
                    )}

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="form-group">
                            <label htmlFor="editFullName">שם מלא</label>
                            <input
                                id="editFullName"
                                name="fullName"
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="editPhone">טלפון</label>
                                <input
                                    id="editPhone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    dir="ltr"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="editEmail">אימייל</label>
                                <input
                                    id="editEmail"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {user.role === "admin" && (
                            <div className="role-notice-card">
                                <span>מנהל ראשי מנהל את כלל המערכת ואינו כפוף ליחידה או מכסת שעות.</span>
                            </div>
                        )}

                        {(user.role === "manager" || user.role === "employee") && (
                            <div className="form-group">
                                <label htmlFor="editUnit">
                                    {user.role === "manager"
                                        ? "יחידה מנוהלת *"
                                        : "שיוך יחידה *"}
                                </label>
                                <select
                                    id="editUnit"
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
                        )}

                        {user.role === "employee" && (
                            <div className="form-group">
                                <label htmlFor="editMaxWeeklyHours">
                                    מכסת שעות שבועית (למשמרות)
                                </label>
                                <input
                                    id="editMaxWeeklyHours"
                                    name="maxWeeklyHours"
                                    type="number"
                                    min={1}
                                    max={168}
                                    placeholder="ברירת מחדל: 40"
                                    value={formData.maxWeeklyHours}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="editPassword">
                                סיסמה חדשה (השאר ריק ללא שינוי)
                            </label>
                            <input
                                id="editPassword"
                                name="password"
                                type="password"
                                minLength={6}
                                placeholder="הזן רק אם ברצונך לשנות סיסמה"
                                value={formData.password}
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

export default EditUserModal;
