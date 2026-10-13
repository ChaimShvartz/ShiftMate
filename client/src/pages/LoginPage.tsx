import ThemeToggle from "../components/ui/ThemeToggle";
import { Bell, CalendarDays, Repeat } from "lucide-react";
import Logo, { LogoMark } from "../components/brand/Logo";
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

    const DEMO = [
        { day: "ראשון", shifts: [["06:00", "דנה", "a"], ["14:00", "אורי", "b"]] },
        { day: "שני", shifts: [["06:00", "אורי", "b"], ["22:00", "מיכל", "c"]] },
        { day: "שלישי", shifts: [["14:00", "דנה", "a"], ["14:00", "נועם", "swap"]] },
        { day: "רביעי", shifts: [["06:00", "מיכל", "c"], ["22:00", "אורי", "b"]] },
        { day: "חמישי", shifts: [["06:00", "נועם", "d"], ["14:00", "דנה", "a"]] },
    ] as const;

    return (
        <main className="login-page" dir="rtl">
            <section className="login-board" aria-hidden>
                <span className="login-board__mark"><LogoMark size={560} /></span>
                <div className="login-board__copy">
                    <h2>כל המשמרות והחלפות במקום אחד</h2>
                    <p>המנהל מפרסם לוח, העובדים מבקשים להחליף, וכולם רואים מה השתנה ברגע שזה קורה.</p>
                </div>

                <div className="login-board__bottom">
                    <motion.div className="demo-week" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } } }}>
                        <span className="demo-week__tag">דוגמה להמחשה</span>
                        {DEMO.map((d) => (
                            <div key={d.day} className="demo-week__day">
                                <small>{d.day}</small>
                                {d.shifts.map(([time, who, tone]) => (
                                    <motion.span key={time} className={`demo-shift demo-shift--${tone}`} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } }}>
                                        <b>{time}</b>{who}
                                    </motion.span>
                                ))}
                            </div>
                        ))}
                    </motion.div>

                    <ul className="login-board__points">
                        <li><CalendarDays size={18} />לוח שבועי ברור לכל עובד</li>
                        <li><Repeat size={18} />בורסת החלפות שמתעדכנת בזמן אמת</li>
                        <li><Bell size={18} />התראות מיידיות על כל שינוי</li>
                    </ul>
                </div>
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
