import Logo from "../brand/Logo";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface SetupFormProps {
    onSubmit: (data: {
        fullName: string;
        phone: string;
        email: string;
        password: string;
    }) => void;
    loading: boolean;
    error: string | null;
}

const initialForm = {
    fullName: "",
    phone: "",
    email: "",
    password: "",
};

const SetupForm = ({ onSubmit, loading, error }: SetupFormProps) => {
    const [formData, setFormData] = useState(initialForm);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            password: formData.password,
        });
    };

    return (
        <div className="setup-form-container" dir="rtl">
            <header className="setup-header">
                <Logo height={44} />
                <h2>הקמת מערכת ראשונית</h2>
                <p>יצירת חשבון מנהל ראשי למערכת</p>
            </header>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="setup-form">
                <div className="form-group">
                    <label htmlFor="fullName">שם מלא של המנהל</label>
                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        placeholder="ישראל ישראלי"
                        value={formData.fullName}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">טלפון</label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="0501234567"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">אימייל</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="admin@example.com"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">סיסמה (לפחות 6 תווים)</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="הזן סיסמה מאובטחת"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" disabled={loading} className="btn-submit">
                    {loading ? "יוצר מנהל..." : "הקמת מערכת וסיום"}
                </button>
            </form>

            <footer className="setup-footer">
                <Link to="/login">כבר יש לך חשבון? התחבר כאן</Link>
            </footer>
        </div>
    );
};

export default SetupForm;
