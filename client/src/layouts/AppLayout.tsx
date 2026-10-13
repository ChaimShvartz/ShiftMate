import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";

export default function AppLayout() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.user?.role);
    const connect = useNotificationStore((s) => s.connect);
    const disconnect = useNotificationStore((s) => s.disconnect);
    const load = useNotificationStore((s) => s.load);

    useEffect(() => {
        if (!token || role === "admin") return;
        connect(token);
        void load();
        return disconnect;
    }, [token, role, connect, disconnect, load]);

    return (
        <div className="app-layout" dir="rtl">
            <Navbar />
            <main className="app-main">
                <Outlet />
            </main>
            <footer className="app-footer">
                © {new Date().getFullYear()} ShiftMate — ניהול ובורסת משמרות בזמן אמת
            </footer>
        </div>
    );
}
