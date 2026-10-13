import ThemeToggle from "../components/ui/ThemeToggle";
import Logo from "../components/brand/Logo";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getSetupStatus } from "../api/setup";
import LoginForm from "../components/auth/LoginForm";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/getErrorMessage";

interface LoginPageState {
    loading: boolean;
    error: string | null;
    isSystemInitialized: boolean | null;
}

const LoginPage = () => {
    const [state, setState] = useState<LoginPageState>({
        loading: false,
        error: null,
        isSystemInitialized: null,
    });

    const login = useAuthStore((state) => state.login);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            if (user.role === "admin") navigate("/admin");
            else if (user.role === "manager") navigate("/dashboard");
            else navigate("/my-shifts");
        }
    }, [user, navigate]);

    useEffect(() => {
        getSetupStatus()
            .then((res) =>
                setState((prev) => ({
                    ...prev,
                    isSystemInitialized: res.initialized,
                })),
            )
            .catch(() =>
                setState((prev) => ({
                    ...prev,
                    isSystemInitialized: true,
                })),
            );
    }, []);

    const handleLogin = async ({
        employeeCode,
        password,
    }: {
        employeeCode: string;
        password: string;
    }) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            await login(employeeCode, password);
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.role === "admin") {
                navigate("/admin");
            } else if (currentUser?.role === "manager") {
                navigate("/dashboard");
            } else {
                navigate("/my-shifts");
            }
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "ההתחברות נכשלה, נסו שוב"),
            }));
        }
    };

    const rows = [
        ["06:00 – 14:00", "משמרת בוקר", "משובץ", true],
        ["14:00 – 22:00", "משמרת ערב", "בהחלפה", false],
        ["22:00 – 06:00", "משמרת לילה", "משובץ", true],
    ] as const;

    return (
        <main className="login-page" dir="rtl">
            <section className="login-board" aria-hidden>
                <Logo height={38} />
                <div>
                    <h2>כל המשמרות והחלפות במקום אחד</h2>
                    <p>המנהל מפרסם לוח, העובדים מבקשים להחליף, וכולם רואים מה השתנה ברגע שזה קורה.</p>
                </div>
                <motion.div className="departures" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } } }}>
                    {rows.map(([time, name, tag, ok]) => (
                        <motion.div key={time} className="departures__row" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } } }}>
                            <span className="departures__time">{time}</span>
                            <span className="departures__name">{name}</span>
                            <span className={`departures__tag ${ok ? "departures__tag--ok" : ""}`}>{tag}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            <section className="login-form-side">
                <div className="login-theme"><ThemeToggle /></div>
                <div className="login-card">
                    <header className="login-header">
                        <Logo height={34} />
                        <h1>כניסה למערכת</h1>
                        <p className="login-subtitle">הזן קוד עובד (או אימייל, אם אתה מנהל) וסיסמה.</p>
                    </header>

                    {state.isSystemInitialized === false && (
                        <div className="system-uninitialized-banner">
                            <span>המערכת עדיין לא הוגדרה. </span>
                            <Link to="/setup">הגדר מנהל ראשי</Link>
                        </div>
                    )}

                    <LoginForm onSubmit={handleLogin} loading={state.loading} error={state.error} initialEmployeeCode={location.state?.employeeCode || ""} />
                </div>
            </section>
        </main>
    );
};

export default LoginPage;
