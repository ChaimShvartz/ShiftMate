import { useEffect, useState } from "react";
import { updateMe } from "../api/users";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/getErrorMessage";
import { getRoleLabel } from "../utils/formatters";

interface FormState {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();

    const [form, setForm] = useState<FormState>({
        fullName: user?.fullName ?? "",
        phone: user?.phone ?? "",
        email: user?.email ?? "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setForm((prev) => ({
                ...prev,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
            }));
        }
    }, [user]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (form.password && form.password !== form.confirmPassword) {
            setError("הסיסמאות אינן תואמות.");
            return;
        }

        const payload: {
            fullName?: string;
            phone?: string;
            email?: string;
            password?: string;
        } = {};

        if (form.fullName && form.fullName !== user?.fullName) {
            payload.fullName = form.fullName;
        }
        if (form.phone && form.phone !== user?.phone) {
            payload.phone = form.phone;
        }
        if (form.email && form.email !== user?.email) {
            payload.email = form.email;
        }
        if (form.password) {
            payload.password = form.password;
        }

        if (Object.keys(payload).length === 0) {
            setError("לא זוהו שינויים לעדכון.");
            return;
        }

        setLoading(true);
        try {
            const updated = await updateMe(payload);
            updateUser(updated);
            setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
            setSuccess(true);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "שגיאה בעדכון הפרופיל"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-avatar">
                    {user?.fullName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <h1 className="profile-card__name">{user?.fullName}</h1>
                <span className="profile-card__role">{getRoleLabel(user?.role)}</span>
                {user?.unitName && (
                    <span className="profile-card__unit">📍 {user.unitName}</span>
                )}

                <form className="profile-form" onSubmit={handleSubmit}>
                    <h2 className="profile-form__title">עריכת פרופיל</h2>

                    <div className="profile-form__row">
                        <label className="profile-form__label">
                            שם מלא
                            <input
                                className="profile-form__input"
                                name="fullName"
                                value={form.fullName ?? ""}
                                onChange={handleChange}
                                minLength={2}
                                required
                            />
                        </label>
                        <label className="profile-form__label">
                            טלפון
                            <input
                                className="profile-form__input"
                                name="phone"
                                value={form.phone ?? ""}
                                onChange={handleChange}
                                minLength={6}
                            />
                        </label>
                    </div>

                    <label className="profile-form__label">
                        כתובת דוא״ל
                        <input
                            className="profile-form__input"
                            type="email"
                            name="email"
                            value={form.email ?? ""}
                            onChange={handleChange}
                        />
                    </label>

                    <div className="profile-form__divider">שינוי סיסמה (אופציונלי)</div>

                    <div className="profile-form__row">
                        <label className="profile-form__label">
                            סיסמה חדשה
                            <input
                                className="profile-form__input"
                                type="password"
                                name="password"
                                value={form.password ?? ""}
                                onChange={handleChange}
                                minLength={6}
                                placeholder="השאר ריק כדי לשמור על הסיסמה הנוכחית"
                            />
                        </label>
                        <label className="profile-form__label">
                            אימות סיסמה
                            <input
                                className="profile-form__input"
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="הזן שוב את הסיסמה החדשה"
                            />
                        </label>
                    </div>

                    {error && <p className="profile-form__error">{error}</p>}
                    {success && (
                        <p className="profile-form__success">✅ הפרופיל עודכן בהצלחה!</p>
                    )}

                    <button
                        type="submit"
                        className="profile-form__submit"
                        disabled={loading}
                    >
                        {loading ? "שומר..." : "שמירת שינויים"}
                    </button>
                </form>
            </div>
        </div>
    );
}

