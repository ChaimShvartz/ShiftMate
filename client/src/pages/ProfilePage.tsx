import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    User as UserIcon,
    Phone,
    Mail,
    KeyRound,
    Clock,
    MapPin,
    Shield,
    Save,
    CheckCircle2,
} from "lucide-react";
import { updateMe } from "../api/users";
import { useAuthStore } from "../store/authStore";
import { getRoleLabel } from "../utils/formatters";
import { getErrorMessage } from "../utils/getErrorMessage";

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
        <motion.div
            className="profile-page"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <div className="profile-card">
                <motion.div
                    className="profile-avatar"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    {user?.fullName?.[0]?.toUpperCase() ?? "?"}
                </motion.div>
                <h1 className="profile-card__name">{user?.fullName}</h1>
                <div className="profile-meta-badges">
                    <span className="profile-card__role">
                        {getRoleLabel(user?.role)}
                    </span>
                    {user?.employeeCode && (
                        <span className="profile-card__code">
                            #{user.employeeCode}
                        </span>
                    )}
                    {user?.role === "admin" && (
                        <span className="profile-card__badge-admin" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Shield size={13} />
                            <span>ניהול כלל המערכת</span>
                        </span>
                    )}
                    {user?.role === "manager" && user?.unitName && (
                        <span className="profile-card__unit" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={13} />
                            <span>מנהל יחידת {user.unitName}</span>
                        </span>
                    )}
                    {user?.role === "employee" && (
                        <>
                            {user?.unitName && (
                                <span className="profile-card__unit" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <MapPin size={13} />
                                    <span>יחידת {user.unitName}</span>
                                </span>
                            )}
                            <span className="profile-card__hours" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Clock size={13} />
                                <span>מכסת שעות: {user?.maxWeeklyHours || 40} שעות/שבוע</span>
                            </span>
                        </>
                    )}
                </div>

                <form className="profile-form" onSubmit={handleSubmit}>
                    <h2 className="profile-form__title">עריכת פרטים אישיים</h2>

                    <div className="profile-form__row">
                        <label className="profile-form__label">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <UserIcon size={12} style={{ opacity: 0.6 }} />
                                <span>שם מלא</span>
                            </span>
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
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <Phone size={12} style={{ opacity: 0.6 }} />
                                <span>טלפון</span>
                            </span>
                            <input
                                className="profile-form__input"
                                name="phone"
                                value={form.phone ?? ""}
                                onChange={handleChange}
                                minLength={6}
                                dir="ltr"
                            />
                        </label>
                    </div>

                    <label className="profile-form__label">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Mail size={12} style={{ opacity: 0.6 }} />
                            <span>כתובת דוא״ל</span>
                        </span>
                        <input
                            className="profile-form__input"
                            type="email"
                            name="email"
                            value={form.email ?? ""}
                            onChange={handleChange}
                            dir="ltr"
                        />
                    </label>

                    <div className="profile-form__divider">
                        שינוי סיסמה (אופציונלי)
                    </div>

                    <div className="profile-form__row">
                        <label className="profile-form__label">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <KeyRound size={12} style={{ opacity: 0.6 }} />
                                <span>סיסמה חדשה</span>
                            </span>
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
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <KeyRound size={12} style={{ opacity: 0.6 }} />
                                <span>אימות סיסמה</span>
                            </span>
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
                        <p className="profile-form__success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <CheckCircle2 size={16} />
                            <span>הפרופיל עודכן בהצלחה!</span>
                        </p>
                    )}

                    <motion.button
                        type="submit"
                        className="profile-form__submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <Save size={15} />
                            <span>{loading ? "שומר..." : "שמירת שינויים"}</span>
                        </span>
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
}
