import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

interface ProtectedRouteProps {
    allowedRoles?: Role[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === "admin") return <Navigate to="/admin" replace />;
        if (user.role === "manager") return <Navigate to="/schedule" replace />;
        return <Navigate to="/my-shifts" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
