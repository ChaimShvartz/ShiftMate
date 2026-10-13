import ThemeToggle from "../components/ui/ThemeToggle";
import { Bell, CalendarDays, Repeat } from "lucide-react";
import Logo, { LogoMark } from "../components/brand/Logo";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSetupStatus } from "../api/setup";
import LoginForm from "../components/auth/LoginForm";
import LoginScene from "../components/auth/LoginScene";
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

    return (
        <main className="login-page" dir="rtl">
            <section className="login-board" aria-hidden>
                <span className="login-board__mark"><LogoMark size={560} /></span>
                <div className="login-board__copy">
                    <h2>כל המשמרות והחלפות במקום אחד</h2>
                    <p>המנהל מפרסם לוח, העובדים מבקשים להחליף, וכולם רואים מה השתנה ברגע שזה קורה.</p>
                </div>

                <LoginScene />

                <ul className="login-board__points">
                    <li><CalendarDays size={18} />לוח שבועי ברור לכל עובד</li>
                    <li><Repeat size={18} />בורסת החלפות שמתעדכנת בזמן אמת</li>
                    <li><Bell size={18} />התראות מיידיות על כל שינוי</li>
                </ul>
            </section>

            <section className="login-form-side">
                <div className="login-theme"><ThemeToggle /></div>
                <div className="login-card">
                    <header className="login-header">
                        <Logo height={72} />
                        <h1>כניסה למערכת</h1>
                        <p className="login-subtitle">הזן את קוד העובד שקיבלת מהמנהל ואת הסיסמה שלך.</p>
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
