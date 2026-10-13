import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import { useAuthStore } from "../store/authStore";
import { useSwapStore } from "../store/useSwapStore";

const AppLayout = () => {
    const token = useAuthStore((state) => state.token);
    const unitName = useAuthStore((state) => state.user?.unitName);
    const connectRealtime = useSwapStore((state) => state.connectRealtime);
    const disconnectRealtime = useSwapStore(
        (state) => state.disconnectRealtime,
    );

    useEffect(() => {
        if (token && unitName) {
            connectRealtime(token, unitName);
        }
        return () => {
            disconnectRealtime();
        };
    }, [token, unitName, connectRealtime, disconnectRealtime]);

    return (
        <div className="app-layout" dir="rtl">
            <Navbar />
            <main className="app-main">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default AppLayout;
