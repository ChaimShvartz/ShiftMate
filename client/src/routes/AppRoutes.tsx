import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AdminPage from "../pages/AdminPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import SetupPage from "../pages/SetupPage";
import MyShiftsPage from "../pages/MyShiftsPage";
import SwapBoardPage from "../pages/SwapBoardPage";
import ManagerSwapsPage from "../pages/ManagerSwapsPage";
import ProfilePage from "../pages/ProfilePage";
import ProtectedRoute from "./ProtectedRoute";
import { useAuthStore } from "../store/authStore";

const HomeRedirect = () => {
    const user = useAuthStore((state) => state.user);
    if (user?.role === "manager") return <Navigate to="/manager/swaps" replace />;
    if (user?.role === "employee") return <Navigate to="/my-shifts" replace />;
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomeRedirect />} />

                    <Route
                        element={<ProtectedRoute allowedRoles={["admin"]} />}
                    >
                        <Route path="/admin" element={<AdminPage />} />
                    </Route>

                    <Route path="/my-shifts" element={<MyShiftsPage />} />
                    <Route path="/swaps" element={<SwapBoardPage />} />
                    <Route path="/manager/swaps" element={<ManagerSwapsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;
