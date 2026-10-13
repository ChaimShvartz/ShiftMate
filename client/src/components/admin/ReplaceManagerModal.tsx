import CopyCodeButton from "../ui/CopyCodeButton";
import { getErrorMessage } from "../../utils/getErrorMessage";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, CheckCircle2 } from "lucide-react";
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
        } catch (err) {
            setStatus((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "שגיאה בהחלפת מנהל"),
            }));
        }
    };

    const handleClose = () => {
        setFormData(initialForm);
        setStatus({ loading: false, error: null, newManager: null });
        onClose();
    };

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
                            <ArrowRightLeft size={20} style={{ color: "var(--brand)" }} />
                            <h3>החלפת מנהל יחידה</h3>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        >
                            <X size={16} />
                        </button>
                    </header>

                    <div className="current-manager-banner">
                        <p>
                            מחליף את: <strong>{currentManager.fullName}</strong> (#{currentManager.employeeCode})
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
                            <div className="success-icon">
                                <CheckCircle2 size={44} style={{ color: "var(--success)", margin: "0 auto 12px" }} />
                            </div>
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
                                <CopyCodeButton code={status.newManager.employeeCode} />
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

                            <div className="form-row">
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
                                        dir="ltr"
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
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="newManagerPassword">
                                    סיסמה ראשונית
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
                                <motion.button
                                    type="submit"
                                    disabled={status.loading}
                                    className="btn-submit"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {status.loading ? "מחליף..." : "בצע החלפת מנהל"}
                                </motion.button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReplaceManagerModal;
