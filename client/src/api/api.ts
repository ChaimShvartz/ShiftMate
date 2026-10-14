import axios from "axios";

// VITE_API_URL may be set with or without the trailing /api; always end up with it.
const rawBase = (import.meta.env.VITE_API_URL || "http://localhost:2026").replace(/\/+$/, "");
export const apiBaseUrl = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

export const apiClient = axios.create({ baseURL: apiBaseUrl });

// Attach the token to every request and drop the session when it is rejected.
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

apiClient.interceptors.response.use(
    (res) => res,
    (err) => {
        const isLogin = err.config?.url?.includes("/auth/login");
        if (err.response?.status === 401 && !isLogin) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (location.pathname !== "/login") location.assign("/login");
        }
        return Promise.reject(err);
    },
);

// Kept for the existing api modules; the interceptor already adds the header.
export function addAuthHeaders() {
    return {};
}
