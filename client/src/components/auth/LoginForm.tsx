import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, ArrowLeft, Loader2 } from "lucide-react";

interface LoginFormProps {
    onSubmit: (data: { employeeCode: string; password: string }) => void;
    loading: boolean;
    error: string | null;
    initialEmployeeCode?: string;
}

const LoginForm = ({
    onSubmit,
    loading,
    error,
    initialEmployeeCode = "",
}: LoginFormProps) => {
    const [formData, setFormData] = useState({
        employeeCode: initialEmployeeCode,
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            employeeCode: formData.employeeCode.trim(),
            password: formData.password,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="login-form" dir="rtl">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="employeeCode">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <User size={13} style={{ opacity: 0.7 }} />
                        <span>קוד עובד או אימייל</span>
                    </span>
                </label>
                <input
                    id="employeeCode"
                    name="employeeCode"
                    type="text"
                    required
                    autoComplete="username"
                    dir="ltr"
                    placeholder="לדוגמה: 123456"
                    value={formData.employeeCode}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Lock size={13} style={{ opacity: 0.7 }} />
                        <span>סיסמה</span>
                    </span>
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="הזן את סיסמתך"
                    value={formData.password}
                    onChange={handleChange}
                />
            </div>

            <motion.button
                type="submit"
                disabled={loading}
                className="btn-submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: "8px" }}
            >
                {loading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Loader2 size={16} className="animate-spin" />
                        <span>מתחבר למערכת...</span>
                    </span>
                ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span>כניסה למערכת</span>
                        <ArrowLeft size={16} />
                    </span>
                )}
            </motion.button>
        </form>
    );
};

export default LoginForm;
