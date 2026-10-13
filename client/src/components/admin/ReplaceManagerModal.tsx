import React, { useState } from "react";
import type { User } from "../../types";

interface ReplaceManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentManager: User | null;
    onSubmit: (
        employeeCode: string,
        newManagerData: {
            fullName: string;
            phone: string;
            email: string;
            password: string;
        },
    ) => Promise<{
        replacedManager: { employeeCode: string; name: string };
        newManager: User;
    } | null>;
}

const initialForm = {
    fullName: "",
    phone: "",
    email: "",
    password: "",
};

const ReplaceManagerModal = ({
    isOpen,
    onClose,
    currentManager,
    onSubmit,
}: ReplaceManagerModalProps) => {
    const [formData, setFormData] = useState(initialForm);
    const [status, setStatus] = useState<{
        loading: boolean;
        error: string | null;
        newManager: User | null;
    }>({
        loading: false,
        error: null,
        newManager: null,
    });

    if (!isOpen || !currentManager) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const res = await onSubmit(currentManager.employeeCode, {
                fullName: formData.fullName.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                password: formData.password,
            });

            if (res) {
                setStatus({
                    loading: false,
                    error: null,
                    newManager: res.newManager,
                });
            }
        } catch (err: any) {
            setStatus((prev) => ({
                ...prev,
                loading: false,
                error: err?.message || "שגיאה בהחלפת מנהל",
            }));
        }
    };

    const handleClose = () => {
        setFormData(initialForm);
        setStatus({ loading: false, error: null, newManager: null });
        onClose();
    };

    return (
        <div className="modal-backdrop" dir="rtl">
            <div className="modal-content">
                <header className="modal-header">
                    <h3>החלפת מנהל יחידה</h3>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={handleClose}
                    >
                        ✕
                    </button>
                </header>

                <div className="current-manager-banner">
                    <p>
                        מחליף את: <strong>{currentManager.fullName}</strong> (#
                        {currentManager.employeeCode})
                    </p>
                    <p>
                        יחידה: <strong>{currentManager.unitName}</strong>
                    </p>
                </div>

                {status.error && (
                    <div className="error-message">{status.error}</div>
                )}

                {status.newManager ? (
                    <div className="modal-success-content">
                        <div className="success-icon">🔄</div>
                        <h4>המנהל הוחלף בהצלחה!</h4>
                        <p>
                            <strong>{status.newManager.fullName}</strong> הוא
                            כעת המנהל של יחידת {currentManager.unitName}.
                        </p>
                        <div className="code-box">
                            <span>קוד עובד של המנהל החדש:</span>
                            <strong className="code-value">
                                #{status.newManager.employeeCode}
                            </strong>
                        </div>
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
                            <label htmlFor="newManagerFullName">
                                שם מלא של המנהל החדש
                            </label>
                            <input
                                id="newManagerFullName"
                                name="fullName"
                                type="text"
                                required
                                placeholder="לדוגמה: משה כהן"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newManagerPhone">טלפון</label>
                            <input
                                id="newManagerPhone"
                                name="phone"
                                type="tel"
                                required
                                placeholder="0509876543"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newManagerEmail">אימייל</label>
                            <input
                                id="newManagerEmail"
                                name="email"
                                type="email"
                                required
                                placeholder="manager@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newManagerPassword">
                                סיסמה זמנית
                            </label>
                            <input
                                id="newManagerPassword"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                placeholder="לפחות 6 תווים"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleClose}
                            >
                                ביטול
                            </button>
                            <button
                                type="submit"
                                disabled={status.loading}
                                className="btn-submit"
                            >
                                {status.loading ? "מחליף..." : "בצע החלפת מנהל"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReplaceManagerModal;
