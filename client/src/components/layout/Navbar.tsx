import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { getRoleLabel } from "../../utils/formatters";
import Logo from "../brand/Logo";
import NotificationBell from "../notifications/NotificationBell";
import ThemeToggle from "../ui/ThemeToggle";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link active" : "nav-link";

const NAV: Record<string, { to: string; label: string }[]> = {
    admin: [{ to: "/admin", label: "ניהול מערכת" }],
    manager: [
        { to: "/dashboard", label: "דאשבורד" },
        { to: "/schedule", label: "לוח משמרות" },
    ],
    employee: [
        { to: "/my-shifts", label: "המשמרות שלי" },
        { to: "/swaps", label: "בורסת משמרות" },
    ],
};

export default function Navbar() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const disconnect = useNotificationStore((s) => s.disconnect);
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        disconnect();
        logout();
        navigate("/login");
    };

    const initials = user.fullName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("");

    return (
        <header className="app-header">
            <div className="app-header__inner">
                <Link to="/" className="brand-logo" aria-label="ShiftMate - דף הבית">
                    <Logo size={34} />
                </Link>

                <nav className="header-nav" aria-label="ניווט ראשי">
                    {NAV[user.role].map((l) => (
                        <NavLink key={l.to} to={l.to} className={linkClass}>
                            {l.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="header-actions">
                    <ThemeToggle />
                    {user.role !== "admin" && <NotificationBell />}
                    <NavLink to="/profile" className="user-chip" title="הפרופיל שלי">
                        <span className="avatar">{initials}</span>
                        <span className="user-chip__text">
                            <strong>{user.fullName}</strong>
                            <small>
                                {getRoleLabel(user.role)}
                                {user.unitName ? ` · ${user.unitName}` : ""}
                            </small>
                        </span>
                    </NavLink>
                    <button type="button" onClick={handleLogout} className="btn-logout">
                        יציאה
                    </button>
                </div>
            </div>
        </header>
    );
}
