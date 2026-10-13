import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Calendar,
    ArrowLeftRight,
    LayoutDashboard,
    Shield,
    LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { getRoleLabel } from "../../utils/formatters";
import Logo from "../brand/Logo";
import NotificationBell from "../notifications/NotificationBell";
import ThemeToggle from "../ui/ThemeToggle";

interface NavItem {
    to: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV: Record<string, NavItem[]> = {
    admin: [{ to: "/admin", label: "ניהול מערכת", icon: Shield }],
    manager: [
        { to: "/dashboard", label: "דאשבורד", icon: LayoutDashboard },
        { to: "/schedule", label: "לוח משמרות", icon: Calendar },
    ],
    employee: [
        { to: "/my-shifts", label: "המשמרות שלי", icon: Calendar },
        { to: "/swaps", label: "בורסת משמרות", icon: ArrowLeftRight },
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

    const navLinks = NAV[user.role] ?? [];

    return (
        <header className="app-header">
            <div className="app-header__inner">
                <Link to="/" className="brand-logo" aria-label="ShiftMate - דף הבית">
                    <Logo size={34} />
                </Link>

                <nav className="header-nav" aria-label="ניווט ראשי">
                    {navLinks.map((l) => {
                        const Icon = l.icon;
                        return (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                className={({ isActive }) =>
                                    `nav-link ${isActive ? "active" : ""}`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon size={16} />
                                        <span>{l.label}</span>
                                        {isActive && (
                                            <motion.span
                                                layoutId="navbar-indicator"
                                                className="nav-indicator"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 350,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
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
                    <motion.button
                        type="button"
                        onClick={handleLogout}
                        className="btn-logout"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="התנתק מהמערכת"
                    >
                        <LogOut size={14} />
                        <span>יציאה</span>
                    </motion.button>
                </div>
            </div>
        </header>
    );
}
