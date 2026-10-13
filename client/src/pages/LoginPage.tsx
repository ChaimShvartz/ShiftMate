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

    return (
        <main className="login-page" dir="rtl">
            <div className="login-theme">
                <ThemeToggle />
            </div>
            <motion.div
                className="login-card"
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
                <header className="login-header">
                    <Logo size={48} />
                    <p className="login-subtitle">
                        מערכת מתקדמת לניהול עובדים, משמרות וחילופים בזמן אמת
                    </p>
                </header>

                {state.isSystemInitialized === false && (
                    <motion.div
                        className="system-uninitialized-banner"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span>המערכת עדיין אינה מוגדרת. </span>
                        <Link to="/setup">הגדר מנהל ראשי ראשוני</Link>
                    </motion.div>
                )}

                <LoginForm
                    onSubmit={handleLogin}
                    loading={state.loading}
                    error={state.error}
                    initialEmployeeCode={location.state?.employeeCode || ""}
                />
            </motion.div>
        </main>
    );
};

export default LoginPage;
