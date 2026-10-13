import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
            else if (user.role === "manager") navigate("/schedule");
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
                navigate("/schedule");
            } else {
                navigate("/my-shifts");
            }
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "קוד עובד או סיסמה שגויים"),
            }));
        }
    };

    return (
        <main className="login-page" dir="rtl">
            <div className="login-bg-glow login-bg-glow--1" />
            <div className="login-bg-glow login-bg-glow--2" />
            <div className="login-card">
                <header className="login-header">
                    <img
                        src="/logo-horizontal.png"
                        alt="ShiftMate"
                        className="login-logo-img"
                    />
                    <p className="login-subtitle">
                        מערכת חכמה לניהול משמרות, עובדים וחילופים
                    </p>
                </header>

                {state.isSystemInitialized === false && (
                    <div className="system-uninitialized-banner">
                        <span>המערכת עדיין אינה מוגדרת. </span>
                        <Link to="/setup">הגדר מנהל ראשי ראשוני</Link>
                    </div>
                )}

                <LoginForm
                    onSubmit={handleLogin}
                    loading={state.loading}
                    error={state.error}
                    initialEmployeeCode={location.state?.employeeCode || ""}
                />
            </div>
        </main>
    );
};

export default LoginPage;
