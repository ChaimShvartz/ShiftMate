import React from "react";
import type { Unit, User } from "../../types";
import { getRoleLabel } from "../../utils/formatters";

interface UsersTableProps {
    users: User[];
    units: Unit[];
    filters: { unitName: string; role: string };
    onFilterChange: (filters: { unitName: string; role: string }) => void;
    onDeleteUser: (employeeCode: string, name: string) => Promise<void>;
    onOpenReplaceManager: (manager: User) => void;
    onOpenEditUser: (user: User) => void;
    onOpenAddUser: () => void;
}

const UsersTable = ({
    users,
    units,
    filters,
    onFilterChange,
    onDeleteUser,
    onOpenReplaceManager,
    onOpenEditUser,
    onOpenAddUser,
}: UsersTableProps) => {
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({
            ...filters,
            [name]: value,
        });
    };

    const handleDelete = (user: User) => {
        if (
            window.confirm(
                `האם אתה בטוח שברצונך למחוק את ${user.fullName} (#${user.employeeCode})?`,
            )
        ) {
            onDeleteUser(user.employeeCode, user.fullName);
        }
    };

    return (
        <section className="admin-users-section">
            <header className="section-header">
                <div className="section-title-wrap">
                    <h2>ניהול משתמשים</h2>
                    <p>צפייה, סינון, הוספה ועריכה של משתמשי המערכת</p>
                </div>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={onOpenAddUser}
                >
                    + הוסף משתמש חדש
                </button>
            </header>

            <div className="users-filters-bar">
                <div className="filter-group">
                    <label htmlFor="filterUnit">סינון לפי יחידה:</label>
                    <select
                        id="filterUnit"
                        name="unitName"
                        value={filters.unitName}
                        onChange={handleFilterChange}
                    >
                        <option value="">כל היחידות</option>
                        {units.map((u) => (
                            <option key={u.name} value={u.name}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filterRole">סינון לפי תפקיד:</label>
                    <select
                        id="filterRole"
                        name="role"
                        value={filters.role}
                        onChange={handleFilterChange}
                    >
                        <option value="">כל התפקידים</option>
                        <option value="admin">מנהל ראשי</option>
                        <option value="manager">מנהל יחידה</option>
                        <option value="employee">עובד</option>
                    </select>
                </div>

                {(filters.unitName || filters.role) && (
                    <button
                        type="button"
                        className="btn-clear-filters"
                        onClick={() =>
                            onFilterChange({ unitName: "", role: "" })
                        }
                    >
                        איפוס סינונים
                    </button>
                )}
            </div>

            <div className="users-table-container">
                {users.length === 0 ? (
                    <p className="empty-state">
                        לא נמצאו משתמשים תואמים לסינון.
                    </p>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>קוד עובד</th>
                                <th>שם מלא</th>
                                <th>תפקיד</th>
                                <th>יחידה</th>
                                <th>טלפון</th>
                                <th>אימייל</th>
                                <th>שעות/שבוע</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.employeeCode}>
                                    <td className="code-cell">
                                        #{u.employeeCode}
                                    </td>
                                    <td className="name-cell">{u.fullName}</td>
                                    <td>
                                        <span
                                            className={`role-badge role-${u.role}`}
                                        >
                                            {getRoleLabel(u.role)}
                                        </span>
                                    </td>
                                    <td>
                                        {u.role === "admin" ? (
                                            <span className="unit-global-tag">
                                                כלל המערכת
                                            </span>
                                        ) : (
                                            u.unitName || "—"
                                        )}
                                    </td>
                                    <td>{u.phone}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        {u.role === "employee"
                                            ? `${u.maxWeeklyHours || 40} שע'`
                                            : "—"}
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            type="button"
                                            className="btn-edit"
                                            onClick={() => onOpenEditUser(u)}
                                        >
                                            ערוך
                                        </button>

                                        {u.role === "manager" && (
                                            <button
                                                type="button"
                                                className="btn-replace"
                                                onClick={() =>
                                                    onOpenReplaceManager(u)
                                                }
                                            >
                                                החלף מנהל
                                            </button>
                                        )}

                                        {u.role !== "admin" && (
                                            <button
                                                type="button"
                                                className="btn-delete"
                                                onClick={() => handleDelete(u)}
                                            >
                                                מחק
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
};

export default UsersTable;
