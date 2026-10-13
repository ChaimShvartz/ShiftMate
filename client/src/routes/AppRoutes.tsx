import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/LoginPage";
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
                </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
