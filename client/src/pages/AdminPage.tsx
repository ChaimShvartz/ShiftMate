import { X } from "lucide-react";
import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
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
    const [params] = useSearchParams();
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
        activeTab: params.get("tab") === "units" ? "units" : "users",
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
        <div className="page">
            <header className="page-head">
                <div>
                    <h1 className="page__title">ניהול מערכת</h1>
                    <p className="page__subtitle">
                        <b>{state.units.length}</b> יחידות · <b>{state.users.filter((u) => u.role === "manager").length}</b> מנהלי יחידה · <b>{state.users.filter((u) => u.role === "employee").length}</b> עובדים
                    </p>
                </div>
            </header>

            {state.feedback && (
                <div className="feedback-banner"><span>{state.feedback}</span><button type="button" className="btn-dismiss" aria-label="סגור" onClick={() => setState((prev) => ({ ...prev, feedback: null }))}><X size={16} /></button></div>
            )}
            {state.error && (
                <div className="error-banner"><span>{state.error}</span><button type="button" className="btn-dismiss" aria-label="סגור" onClick={() => setState((prev) => ({ ...prev, error: null }))}><X size={16} /></button></div>
            )}

            <Tabs.Root value={state.activeTab} onValueChange={(v) => setState((prev) => ({ ...prev, activeTab: v as "users" | "units" }))}>
                <Tabs.List className="tabs__list" aria-label="אזורי ניהול">
                    <Tabs.Trigger className="tabs__trigger" value="users">
                        משתמשים <span className="tabs__count">{state.users.length}</span>
                        {state.activeTab === "users" && <motion.span layoutId="admin-tab" className="tabs__bar" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    </Tabs.Trigger>
                    <Tabs.Trigger className="tabs__trigger" value="units">
                        יחידות <span className="tabs__count">{state.units.length}</span>
                        {state.activeTab === "units" && <motion.span layoutId="admin-tab" className="tabs__bar" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    </Tabs.Trigger>
                </Tabs.List>

                {state.loading ? (
                    <div className="loading-state">טוען נתונים…</div>
                ) : (
                    <>
                        <Tabs.Content value="users">
                            <UsersTable
                                users={state.users}
                                units={state.units}
                                filters={state.filters}
                                initialQuery={params.get("q") ?? ""}
                                onFilterChange={handleFilterChange}
                                onDeleteUser={handleDeleteUser}
                                onOpenReplaceManager={(manager) => setState((prev) => ({ ...prev, replacingManager: manager }))}
                                onOpenEditUser={(user) => setState((prev) => ({ ...prev, editingUser: user }))}
                                onOpenAddUser={() => setState((prev) => ({ ...prev, isAddUserOpen: true }))}
                            />
                        </Tabs.Content>
                        <Tabs.Content value="units">
                            <UnitsSection units={state.units} onAddUnit={handleAddUnit} onDeleteUnit={handleDeleteUnit} loading={state.loading} initialQuery={params.get("q") ?? ""} />
                        </Tabs.Content>
                    </>
                )}
            </Tabs.Root>

            <UserFormModal isOpen={state.isAddUserOpen} onClose={() => setState((prev) => ({ ...prev, isAddUserOpen: false }))} units={state.units} onSubmit={handleCreateUser} />
            <EditUserModal isOpen={Boolean(state.editingUser)} user={state.editingUser} units={state.units} onClose={() => setState((prev) => ({ ...prev, editingUser: null }))} onSubmit={handleUpdateUser} />
            <ReplaceManagerModal isOpen={Boolean(state.replacingManager)} onClose={() => setState((prev) => ({ ...prev, replacingManager: null }))} currentManager={state.replacingManager} onSubmit={handleReplaceManager} />
        </div>
    );
};

export default AdminPage;
