import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/layout/Footer";
import TopNav from "../components/layout/TopNav";
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
        <div className="shell" dir="rtl">
            <TopNav />
            <main className="app-main">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
