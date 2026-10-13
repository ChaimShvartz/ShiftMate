import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Edit2, ArrowRightLeft, Trash2, RotateCcw, ArrowUpDown } from "lucide-react";
import type { Unit, User } from "../../types";
import { useUiStore } from "../../store/uiStore";
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
    const [sortField, setSortField] = useState<"role" | "unitName" | "fullName" | "employeeCode" | null>(null);
    const [sortAsc, setSortAsc] = useState<boolean>(true);

    const handleSort = (field: "role" | "unitName" | "fullName" | "employeeCode") => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    const sortedUsers = useMemo(() => {
        if (!sortField) return users;
        return [...users].sort((a, b) => {
            const valA = (a[sortField] ?? "").toString();
            const valB = (b[sortField] ?? "").toString();
            const cmp = valA.localeCompare(valB, "he");
            return sortAsc ? cmp : -cmp;
        });
    }, [users, sortField, sortAsc]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({
            ...filters,
            [name]: value,
        });
    };

    const handleDelete = async (user: User) => {
        const ok = await useUiStore.getState().confirm({
            title: "מחיקת משתמש",
            message: `למחוק את ${user.fullName} (#${user.employeeCode})? הפעולה אינה ניתנת לביטול.`,
            confirmLabel: "מחק",
            danger: true,
        });
        if (ok) onDeleteUser(user.employeeCode, user.fullName);
    };

    return (
        <section className="admin-users-section">
            <header className="section-header">
                <div className="section-title-wrap">
                    <h2>ניהול משתמשים</h2>
                    <p>צפייה, סינון, הוספה ועריכה של משתמשי המערכת</p>
                </div>
                <motion.button
                    type="button"
                    className="btn-primary"
                    onClick={onOpenAddUser}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <UserPlus size={16} />
                    <span>הוסף משתמש חדש</span>
                </motion.button>
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
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <RotateCcw size={13} />
                            <span>איפוס סינונים</span>
                        </span>
                    </button>
                )}
            </div>

            <div className="users-table-container">
                {sortedUsers.length === 0 ? (
                    <p className="empty-state">
                        לא נמצאו משתמשים תואמים לסינון.
                    </p>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("employeeCode")} style={{ cursor: "pointer", userSelect: "none" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <span>קוד עובד</span>
                                        <ArrowUpDown size={12} style={{ opacity: sortField === "employeeCode" ? 1 : 0.4 }} />
                                    </span>
                                </th>
                                <th onClick={() => handleSort("fullName")} style={{ cursor: "pointer", userSelect: "none" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <span>שם מלא</span>
                                        <ArrowUpDown size={12} style={{ opacity: sortField === "fullName" ? 1 : 0.4 }} />
                                    </span>
                                </th>
                                <th onClick={() => handleSort("role")} style={{ cursor: "pointer", userSelect: "none" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <span>תפקיד</span>
                                        <ArrowUpDown size={12} style={{ opacity: sortField === "role" ? 1 : 0.4 }} />
                                    </span>
                                </th>
                                <th onClick={() => handleSort("unitName")} style={{ cursor: "pointer", userSelect: "none" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <span>יחידה</span>
                                        <ArrowUpDown size={12} style={{ opacity: sortField === "unitName" ? 1 : 0.4 }} />
                                    </span>
                                </th>
                                <th>טלפון</th>
                                <th>אימייל</th>
                                <th>שעות/שבוע</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((u) => (
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
                                    <td style={{ direction: "ltr", textAlign: "right" }}>{u.phone}</td>
                                    <td>{u.email}</td>
                                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                                        {u.role === "employee"
                                            ? `${u.maxWeeklyHours || 40} שע'`
                                            : "—"}
                                    </td>
                                    <td className="actions-cell">
                                        <motion.button
                                            type="button"
                                            className="btn-edit"
                                            onClick={() => onOpenEditUser(u)}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                <Edit2 size={12} />
                                                <span>ערוך</span>
                                            </span>
                                        </motion.button>

                                        {u.role === "manager" && (
                                            <motion.button
                                                type="button"
                                                className="btn-replace"
                                                onClick={() =>
                                                    onOpenReplaceManager(u)
                                                }
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                    <ArrowRightLeft size={12} />
                                                    <span>החלף מנהל</span>
                                                </span>
                                            </motion.button>
                                        )}

                                        {u.role !== "admin" && (
                                            <motion.button
                                                type="button"
                                                className="btn-delete"
                                                onClick={() => handleDelete(u)}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                    <Trash2 size={12} />
                                                    <span>מחק</span>
                                                </span>
                                            </motion.button>
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
