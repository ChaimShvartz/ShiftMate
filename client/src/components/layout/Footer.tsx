import { useAuthStore } from "../../store/authStore";
import { getRoleLabel } from "../../utils/formatters";

const Footer = () => {
    const user = useAuthStore((state) => state.user);

    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p className="footer-copyright">
                    © {new Date().getFullYear()} ShiftMate — מערכת ניהול ובורסת
                    משמרות חכמה
                </p>
                {user && (
                    <p className="footer-status">
                        מחובר כ-<strong>{user.fullName}</strong> (
                        {getRoleLabel(user.role)})
                    </p>
                )}
            </div>
        </footer>
    );
};

export default Footer;
