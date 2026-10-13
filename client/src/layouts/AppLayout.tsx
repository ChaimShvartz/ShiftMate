import { Outlet } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

const AppLayout = () => {
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
