import { useEffect, useState } from "react";
import { createUnit, deleteUnit, getAllUnits } from "../api/units";
import {
    createUser,
    deleteUser,
    getAllUsers,
    replaceManager,
} from "../api/users";
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
                error: getErrorMessage(err, "שגיאה בטעינת נתוני המערכת"),
            }));
        }
    };

    useEffect(() => {
        loadData(state.filters);
    }, [state.filters.unitName, state.filters.role]);

    const handleFilterChange = (newFilters: {
        unitName: string;
        role: string;
    }) => {
        setState((prev) => ({ ...prev, filters: newFilters }));
    };

    const handleAddUnit = async (name: string) => {
        setState((prev) => ({ ...prev, error: null, feedback: null }));
        try {
            const newUnit = await createUnit(name);
            setState((prev) => ({
                ...prev,
                units: [...prev.units, newUnit],
                feedback: `היחידה "${name}" נוספה בהצלחה!`,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: getErrorMessage(err, "שגיאה בהוספת יחידה"),
            }));
        }
    };

    const handleDeleteUnit = async (name: string) => {
        setState((prev) => ({ ...prev, error: null, feedback: null }));
        try {
            await deleteUnit(name);
            setState((prev) => ({
                ...prev,
                units: prev.units.filter((u) => u.name !== name),
                feedback: `היחידה "${name}" נמחקה בהצלחה.`,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: getErrorMessage(err, "שגיאה במחיקת יחידה"),
            }));
        }
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
        try {
            const newUser = await createUser(userData);
            await loadData(state.filters);
            return newUser;
        } catch (err) {
            throw new Error(getErrorMessage(err, "שגיאה ביצירת המשתמש"));
        }
    };

    const handleDeleteUser = async (employeeCode: string, name: string) => {
        setState((prev) => ({ ...prev, error: null, feedback: null }));
        try {
            await deleteUser(employeeCode);
            setState((prev) => ({
                ...prev,
                users: prev.users.filter(
                    (u) => u.employeeCode !== employeeCode,
                ),
                feedback: `המשתמש ${name} (#${employeeCode}) נמחק בהצלחה.`,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: getErrorMessage(err, "שגיאה במחיקת המשתמש"),
            }));
        }
    };

    const handleReplaceManager = async (
        employeeCode: string,
        newManagerData: {
            fullName: string;
            phone: string;
            email: string;
            password: string;
        },
    ) => {
        try {
            const result = await replaceManager(employeeCode, newManagerData);
            await loadData(state.filters);
            return result;
        } catch (err) {
            throw new Error(getErrorMessage(err, "שגיאה בהחלפת מנהל היחידה"));
        }
    };

    return (
        <div className="admin-page" dir="rtl">
            <header className="page-header">
                <h1>🏢 פורטל ניהול מערכת</h1>
                <p>שליטה מלאה ביחידות הארגון ובמשתמשים</p>
            </header>

            {state.feedback && (
                <div className="feedback-banner success">{state.feedback}</div>
            )}
            {state.error && (
                <div className="feedback-banner error">{state.error}</div>
            )}

            <div className="admin-tabs-bar">
                <button
                    type="button"
                    className={`tab-btn ${state.activeTab === "users" ? "active" : ""}`}
                    onClick={() =>
                        setState((prev) => ({ ...prev, activeTab: "users" }))
                    }
                >
                    👥 ניהול משתמשים ({state.users.length})
                </button>
                <button
                    type="button"
                    className={`tab-btn ${state.activeTab === "units" ? "active" : ""}`}
                    onClick={() =>
                        setState((prev) => ({ ...prev, activeTab: "units" }))
                    }
                >
                    🏢 ניהול יחידות ({state.units.length})
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
                    error={state.error}
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

            <ReplaceManagerModal
                isOpen={Boolean(state.replacingManager)}
                onClose={() =>
                    setState((prev) => ({ ...prev, replacingManager: null }))
                }
                currentManager={state.replacingManager}
                onSubmit={handleReplaceManager}
            />
        </div>
    );
};

export default AdminPage;
