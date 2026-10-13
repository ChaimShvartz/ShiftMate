import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getRoleLabel } from "../../utils/formatters";

const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link active" : "nav-link";

const Navbar = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="app-header">
            <div className="header-brand">
                <Link to="/" className="brand-logo">
                    <span className="brand-icon">⏱️</span>
                    <span className="brand-name">ShiftMate</span>
                </Link>

                {user && (
                    <nav className="header-nav">
                        {user.role === "admin" && (
                            <NavLink to="/admin" className={getNavLinkClass}>
                                ניהול מערכת
                            </NavLink>
                        )}

                        {user.role === "manager" && (
                            <>
                                <NavLink
                                    to="/schedule"
                                    className={getNavLinkClass}
                                >
                                    לוח משמרות
                                </NavLink>
                                <NavLink
                                    to="/manager/swaps"
                                    className={getNavLinkClass}
                                >
                                    בקשות החלפה
                                </NavLink>
                            </>
                        )}

                        {user.role === "employee" && (
                            <>
                                <NavLink
                                    to="/my-shifts"
                                    className={getNavLinkClass}
                                >
                                    המשמרות שלי
                                </NavLink>
                                <NavLink
                                    to="/swaps"
                                    className={getNavLinkClass}
                                >
                                    בורסת משמרות
                                </NavLink>
                            </>
                        )}
                    </nav>
                )}
            </div>

            {user && (
                <div className="header-user-actions">
                    <div className="user-info">
                        <span className="user-name">{user.fullName}</span>
                        <span className="user-meta">
                            {getRoleLabel(user.role)}
                            {user.unitName ? ` • ${user.unitName}` : ""}
                            {` • #${user.employeeCode}`}
                        </span>
                    </div>

                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            isActive ? "btn-profile active" : "btn-profile"
                        }
                    >
                        פרופיל
                    </NavLink>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="btn-logout"
                    >
                        יציאה
                    </button>
                </div>
            )}
        </header>
    );
};

export default Navbar;
