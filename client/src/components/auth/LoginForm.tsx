import React, { useState } from "react";

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
                <label htmlFor="employeeCode">קוד עובד או אימייל</label>
                <input
                    id="employeeCode"
                    name="employeeCode"
                    type="text"
                    required
                    autoComplete="username"
                    dir="ltr"
                    placeholder="123456"
                    value={formData.employeeCode}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">סיסמה</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="הזן סיסמה"
                    value={formData.password}
                    onChange={handleChange}
                />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
                {loading ? "מתחבר..." : "התחבר למערכת"}
            </button>
        </form>
    );
};

export default LoginForm;
