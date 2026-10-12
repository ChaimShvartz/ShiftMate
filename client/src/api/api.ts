import axios from "axios";

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export function addAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
