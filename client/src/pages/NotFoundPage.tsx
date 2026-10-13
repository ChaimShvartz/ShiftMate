import Logo from "../components/brand/Logo";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
    return (
        <main className="not-found-page" dir="rtl">
            <div className="not-found-card">
                <Logo variant="icon" height={56} />
                <h1 className="not-found-code">404</h1>
                <h2 className="not-found-title">העמוד לא נמצא</h2>
                <p className="not-found-desc">
                    הכתובת שחיפשת אינה קיימת או שהועברה למיקום אחר.
                </p>
                <Link to="/" className="btn-primary">
                    חזרה לדף הראשי
                </Link>
            </div>
        </main>
    );
};

export default NotFoundPage;
