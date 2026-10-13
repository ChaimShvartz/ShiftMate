import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AdminPage from "../pages/AdminPage";
import LoginPage from "../pages/LoginPage";
import ManagerDashboardPage from "../pages/ManagerDashboardPage";
import MyShiftsPage from "../pages/MyShiftsPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProfilePage from "../pages/ProfilePage";
import SchedulePage from "../pages/SchedulePage";
import SetupPage from "../pages/SetupPage";
import SwapBoardPage from "../pages/SwapBoardPage";
import { useAuthStore } from "../store/authStore";
import ProtectedRoute from "./ProtectedRoute";

const HomeRedirect = () => {
    const user = useAuthStore((state) => state.user);
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "manager") return <Navigate to="/dashboard" replace />;
    if (user?.role === "employee") return <Navigate to="/my-shifts" replace />;
    return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />

            {/* Protected layout routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomeRedirect />} />

                    {/* Admin routes */}
                    <Route
                        element={<ProtectedRoute allowedRoles={["admin"]} />}
                    >
                        <Route path="/admin" element={<AdminPage />} />
                    </Route>

                    {/* Manager routes */}
                    <Route
                        element={<ProtectedRoute allowedRoles={["manager"]} />}
                    >
                        <Route path="/dashboard" element={<ManagerDashboardPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="/manager/swaps" element={<Navigate to="/dashboard" replace />} />
                    </Route>

                    {/* Employee routes */}
                    <Route
                        element={<ProtectedRoute allowedRoles={["employee"]} />}
                    >
                        <Route path="/my-shifts" element={<MyShiftsPage />} />
                        <Route path="/swaps" element={<SwapBoardPage />} />
                    </Route>

                    {/* Shared authenticated routes */}
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;
