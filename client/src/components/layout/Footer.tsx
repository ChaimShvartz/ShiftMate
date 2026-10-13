import { Link } from "react-router-dom";
import Logo from "../brand/Logo";

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="app-footer__inner">
                <Link to="/" aria-label="ShiftMate"><Logo height={26} /></Link>
                <p>© {new Date().getFullYear()} ShiftMate · ניהול משמרות והחלפות בזמן אמת</p>
            </div>
        </footer>
    );
}
