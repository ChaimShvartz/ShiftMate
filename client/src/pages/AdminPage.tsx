import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, UserCheck, Users, Settings } from "lucide-react";
import { createUnit, deleteUnit, getAllUnits } from "../api/units";
import {
    createUser,
    deleteUser,
    getAllUsers,
    replaceManager,
    updateUser,
} from "../api/users";
import EditUserModal from "../components/admin/EditUserModal";
import ReplaceManagerModal from "../components/admin/ReplaceManagerModal";
import UnitsSection from "../components/admin/UnitsSection";
import UserFormModal from "../components/admin/UserFormModal";
import UsersTable from "../components/admin/UsersTable";
import type { Role, Unit, User } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";

interface AdminPageState {
    units: Unit[];
    users: User[];
    loading: boolean;
    error: string | null;
    feedback: string | null;
    filters: { unitName: string; role: string };
    isAddUserOpen: boolean;
    replacingManager: User | null;
    editingUser: User | null;
    activeTab: "users" | "units";
}

const AdminPage = () => {
    const [state, setState] = useState<AdminPageState>({
        units: [],
        users: [],
        loading: true,
        error: null,
        feedback: null,
        filters: { unitName: "", role: "" },
        isAddUserOpen: false,
        replacingManager: null,
        editingUser: null,
        activeTab: "users",
    });

    const loadData = async (filterParams = state.filters) => {
        try {
            const [unitsData, usersData] = await Promise.all([
                getAllUnits(),
                getAllUsers({
                    unitName: filterParams.unitName || undefined,
                    role: filterParams.role || undefined,
                }),
            ]);

            setState((prev) => ({
                ...prev,
                units: unitsData,
                users: usersData,
                loading: false,
                error: null,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "שגיאה בטעינת נתוני מערכת"),
            }));
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (filters: {
        unitName: string;
        role: string;
    }) => {
        setState((prev) => ({ ...prev, filters, loading: true }));
        loadData(filters);
    };

    const handleCreateUser = async (userData: {
        role: Role;
        fullName: string;
        phone: string;
        email: string;
        password: string;
        unitName?: string;
        maxWeeklyHours?: number | null;
    }) => {
        const newUser = await createUser(userData);
        setState((prev) => ({
            ...prev,
            users: [newUser, ...prev.users],
            feedback: `משתמש חדש (${newUser.fullName}) נוסף בהצלחה! קוד: #${newUser.employeeCode}`,
        }));
        return newUser;
    };

    const handleUpdateUser = async (
        employeeCode: string,
        updates: {
            fullName?: string;
            phone?: string;
            email?: string;
            unitName?: string;
            maxWeeklyHours?: number | null;
            password?: string;
        },
    ) => {
        const updated = await updateUser(employeeCode, updates);
        setState((prev) => ({
            ...prev,
            users: prev.users.map((u) =>
                u.employeeCode === employeeCode ? updated : u,
            ),
            feedback: `פרטי ${updated.fullName} עודכנו בהצלחה`,
        }));
        return updated;
    };

    const handleDeleteUser = async (employeeCode: string, name: string) => {
        try {
            await deleteUser(employeeCode);
            setState((prev) => ({
                ...prev,
                users: prev.users.filter(
                    (u) => u.employeeCode !== employeeCode,
                ),
                feedback: `משתמש ${name} נמחק בהצלחה`,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: getErrorMessage(err, "שגיאה במחיקת המשתמש"),
            }));
        }
    };

    const handleReplaceManager = async (
        managerCode: string,
        data: {
            fullName: string;
            phone: string;
            email: string;
            password: string;
        },
    ) => {
        const result = await replaceManager(managerCode, data);
        setState((prev) => ({
            ...prev,
            users: prev.users.map((u) =>
                u.employeeCode === managerCode ? result.newManager : u,
            ),
            feedback: `מנהל היחידה הוחלף בהצלחה. קוד המנהל החדש: #${result.newManager.employeeCode}`,
        }));
        return result;
    };

    const handleAddUnit = async (name: string) => {
        try {
            const newUnit = await createUnit(name);
            setState((prev) => ({
                ...prev,
                units: [...prev.units, newUnit],
                error: null,
                feedback: `יחידה חדשה '${newUnit.name}' נוצרה בהצלחה`,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                feedback: null,
                error: getErrorMessage(err, "שגיאה ביצירת היחידה"),
            }));
        }
    };

    const handleDeleteUnit = async (name: string) => {
        try {
            await deleteUnit(name);
            setState((prev) => ({
                ...prev,
                units: prev.units.filter((u) => u.name !== name),
                error: null,
                feedback: `יחידה '${name}' נמחקה בהצלחה`,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                feedback: null,
                error: getErrorMessage(err, "שגיאה במחיקת היחידה"),
            }));
        }
    };

    return (
        <motion.div
            className="admin-page-container"
            dir="rtl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <header className="admin-header">
                <div className="admin-title">
                    <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Settings size={28} style={{ color: "var(--brand)" }} />
                        <span>ניהול מערכת ShiftMate</span>
                    </h1>
                    <p>
                        פאנל שליטה ראשי: ניהול עובדים, מנהלים ויחידות ארגוניות
                    </p>
                </div>
            </header>

            <section className="admin-stats-grid" aria-label="נתוני מערכת">
                <motion.div
                    className="admin-stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                    <div className="admin-stat-icon admin-stat-icon--units">
                        <Building2 size={24} />
                    </div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-value">{state.units.length}</span>
                        <span className="admin-stat-label">יחידות פעילות</span>
                    </div>
                </motion.div>

                <motion.div
                    className="admin-stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                    <div className="admin-stat-icon admin-stat-icon--managers">
                        <UserCheck size={24} />
                    </div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-value">
                            {state.users.filter((u) => u.role === "manager").length}
                        </span>
                        <span className="admin-stat-label">מנהלי יחידות</span>
                    </div>
                </motion.div>

                <motion.div
                    className="admin-stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                    <div className="admin-stat-icon admin-stat-icon--employees">
                        <Users size={24} />
                    </div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-value">
                            {state.users.filter((u) => u.role === "employee").length}
                        </span>
                        <span className="admin-stat-label">עובדים משובצים</span>
                    </div>
                </motion.div>
            </section>

            {state.feedback && (
                <div className="feedback-banner">
                    <span>{state.feedback}</span>
                    <button
                        type="button"
                        className="btn-dismiss"
                        onClick={() =>
                            setState((prev) => ({ ...prev, feedback: null }))
                        }
                    >
                        ✕
                    </button>
                </div>
            )}

            {state.error && (
                <div className="error-banner">
                    <span>{state.error}</span>
                    <button
                        type="button"
                        className="btn-dismiss"
                        onClick={() =>
                            setState((prev) => ({ ...prev, error: null }))
                        }
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="admin-tabs-bar">
                <button
                    type="button"
                    className={`tab-btn ${state.activeTab === "users" ? "active" : ""}`}
                    onClick={() =>
                        setState((prev) => ({ ...prev, activeTab: "users", error: null }))
                    }
                >
                    {state.activeTab === "users" && (
                        <motion.span
                            layoutId="admin-active-tab-pill"
                            className="tab-active-indicator"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        />
                    )}
                    <span className="tab-label">👥 ניהול משתמשים ({state.users.length})</span>
                </button>
                <button
                    type="button"
                    className={`tab-btn ${state.activeTab === "units" ? "active" : ""}`}
                    onClick={() =>
                        setState((prev) => ({ ...prev, activeTab: "units", error: null }))
                    }
                >
                    {state.activeTab === "units" && (
                        <motion.span
                            layoutId="admin-active-tab-pill"
                            className="tab-active-indicator"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        />
                    )}
                    <span className="tab-label">🏢 ניהול יחידות ({state.units.length})</span>
                </button>
            </div>

            {state.loading ? (
                <div className="loading-state">טוען נתונים...</div>
            ) : state.activeTab === "users" ? (
                <UsersTable
                    users={state.users}
                    units={state.units}
                    filters={state.filters}
                    onFilterChange={handleFilterChange}
                    onDeleteUser={handleDeleteUser}
                    onOpenReplaceManager={(manager) =>
                        setState((prev) => ({
                            ...prev,
                            replacingManager: manager,
                        }))
                    }
                    onOpenEditUser={(user) =>
                        setState((prev) => ({
                            ...prev,
                            editingUser: user,
                        }))
                    }
                    onOpenAddUser={() =>
                        setState((prev) => ({ ...prev, isAddUserOpen: true }))
                    }
                />
            ) : (
                <UnitsSection
                    units={state.units}
                    onAddUnit={handleAddUnit}
                    onDeleteUnit={handleDeleteUnit}
                    loading={state.loading}
                />
            )}

            <UserFormModal
                isOpen={state.isAddUserOpen}
                onClose={() =>
                    setState((prev) => ({ ...prev, isAddUserOpen: false }))
                }
                units={state.units}
                onSubmit={handleCreateUser}
            />

            <EditUserModal
                isOpen={Boolean(state.editingUser)}
                user={state.editingUser}
                units={state.units}
                onClose={() =>
                    setState((prev) => ({ ...prev, editingUser: null }))
                }
                onSubmit={handleUpdateUser}
            />

            <ReplaceManagerModal
                isOpen={Boolean(state.replacingManager)}
                onClose={() =>
                    setState((prev) => ({ ...prev, replacingManager: null }))
                }
                currentManager={state.replacingManager}
                onSubmit={handleReplaceManager}
            />
        </motion.div>
    );
};

export default AdminPage;
