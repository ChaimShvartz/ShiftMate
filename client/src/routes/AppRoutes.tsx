import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AdminPage from "../pages/AdminPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import SchedulePage from "../pages/SchedulePage";
import SetupPage from "../pages/SetupPage";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />

            {/* Protected layout routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />

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
                        <Route path="/schedule" element={<SchedulePage />} />
                    </Route>
                </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;
