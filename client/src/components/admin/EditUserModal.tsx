import React, { useEffect, useState } from "react";
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
        setStatus((prev) => ({ ...prev, loading: true, error: null }));

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
        } catch (err: any) {
            setStatus((prev) => ({
                ...prev,
                loading: false,
                error: err?.message || "שגיאה בעדכון פרטי המשתמש",
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
        <div className="modal-backdrop" dir="rtl">
            <div className="modal-content">
                <header className="modal-header">
                    <div>
                        <h3>{getRoleTitle()}</h3>
                        <p className="modal-subtitle">{getRoleSubtitle()}</p>
                    </div>
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

                    <div className="form-group">
                        <label htmlFor="editPhone">טלפון</label>
                        <input
                            id="editPhone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={handleChange}
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
                        />
                    </div>

                    {user.role === "admin" && (
                        <div className="role-notice-card">
                            <span>🌐</span>
                            <span>
                                מנהל ראשי מנהל את כלל המערכת ואינו כפוף ליחידה
                                או מכסת שעות.
                            </span>
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

                    {user.role === "manager" && (
                        <div className="role-notice-card">
                            <span>ℹ️</span>
                            <span>למנהל יחידה אין מכסת שעות עובד שבועית.</span>
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

export default EditUserModal;
