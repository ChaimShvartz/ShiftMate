import { motion } from "framer-motion";
import { Building2, LogOut, Search } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useUiStore } from "../../store/uiStore";
import { getRoleLabel } from "../../utils/formatters";
import { initialsOf } from "../../utils/person";
import Logo from "../brand/Logo";
import NotificationBell from "../notifications/NotificationBell";
import ThemeToggle from "../ui/ThemeToggle";

const NAV: Record<string, { to: string; label: string }[]> = {
    admin: [{ to: "/admin", label: "ניהול מערכת" }],
    manager: [
        { to: "/dashboard", label: "בקשות החלפה" },
        { to: "/schedule", label: "לוח משמרות" },
    ],
    employee: [
        { to: "/my-shifts", label: "המשמרות שלי" },
        { to: "/swaps", label: "בורסת משמרות" },
    ],
};

export default function TopNav() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const disconnect = useNotificationStore((s) => s.disconnect);
    const openSearch = useUiStore((s) => s.setPaletteOpen);
    const navigate = useNavigate();
    if (!user) return null;

    return (
        <header className="topnav">
            <div className="topnav__inner">
                <Link
                    to="/"
                    className="topnav__brand"
                    aria-label="ShiftMate - דף הבית"
                >
                    <Logo height={50} />
                </Link>

                <nav className="topnav__links" aria-label="ניווט ראשי">
                    {(NAV[user.role] ?? []).map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `topnav__link ${isActive ? "is-active" : ""}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="topnav-pill"
                                            className="topnav__pill"
                                            transition={{
                                                type: "spring",
                                                stiffness: 460,
                                                damping: 36,
                                            }}
                                        />
                                    )}
                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <span className="topnav__spacer" />

                <div className="topnav__tools">
                    <button
                        type="button"
                        className="search-trigger"
                        onClick={() => openSearch(true)}
                        aria-label="חיפוש כללי"
                    >
                        <Search size={16} />
                        <span>חיפוש</span>
                    </button>
                    {user.role !== "admin" && <NotificationBell />}
                    <ThemeToggle />
                    {user.unitName && (
                        <span className="unit-chip">
                            <Building2 size={14} />
                            {user.unitName}
                        </span>
                    )}
                    <NavLink
                        to="/profile"
                        className="user-menu"
                        title="הפרופיל שלי"
                    >
                        <span className="user-menu__text">
                            <strong>{user.fullName}</strong>
                            <small>{getRoleLabel(user.role)}</small>
                        </span>
                        <span className="avatar">
                            {initialsOf(user.fullName)}
                        </span>
                    </NavLink>
                    <button
                        type="button"
                        className="btn-logout"
                        title="התנתק"
                        aria-label="התנתק"
                        onClick={() => {
                            disconnect();
                            logout();
                            navigate("/login");
                        }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
