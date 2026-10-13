import { ArrowRightLeft, Building2, Clock, Mail, Pencil, Phone, Trash2, UserPlus } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useUiStore } from "../../store/uiStore";
import type { Unit, User } from "../../types";
import { getRoleLabel } from "../../utils/formatters";
import { matches } from "../../utils/search";
import { personClass } from "../../utils/person";
import Avatar from "../ui/Avatar";
import SearchInput from "../ui/SearchInput";

interface UsersTableProps {
    users: User[];
    units: Unit[];
    filters: { unitName: string; role: string };
    initialQuery?: string;
    onFilterChange: (filters: { unitName: string; role: string }) => void;
    onDeleteUser: (employeeCode: string, name: string) => Promise<void>;
    onOpenReplaceManager: (manager: User) => void;
    onOpenEditUser: (user: User) => void;
    onOpenAddUser: () => void;
}

const UsersTable = ({ users, units, filters, initialQuery = "", onFilterChange, onDeleteUser, onOpenReplaceManager, onOpenEditUser, onOpenAddUser }: UsersTableProps) => {
    const [query, setQuery] = useState(initialQuery);

    const rows = useMemo(() => users.filter((u) => matches(query, u.fullName, u.employeeCode, u.email, u.phone, u.unitName, getRoleLabel(u.role))), [users, query]);

    const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => onFilterChange({ ...filters, [e.target.name]: e.target.value });

    const remove = async (u: User) => {
        const ok = await useUiStore.getState().confirm({ title: "מחיקת עובד", message: `${u.fullName} (#${u.employeeCode}) יימחק לצמיתות. אי אפשר למחוק עובד שעדיין משובץ למשמרות.`, confirmLabel: "מחק עובד", danger: true });
        if (ok) await onDeleteUser(u.employeeCode, u.fullName);
    };

    return (
        <section>
            <div className="toolbar">
                <SearchInput label="חיפוש משתמשים" placeholder="שם, קוד, אימייל, טלפון או יחידה" value={query} onChange={setQuery} />
                <select name="unitName" aria-label="סינון לפי יחידה" value={filters.unitName} onChange={onSelect}>
                    <option value="">כל היחידות</option>
                    {units.map((u) => <option key={u.name} value={u.name}>{u.name}</option>)}
                </select>
                <select name="role" aria-label="סינון לפי תפקיד" value={filters.role} onChange={onSelect}>
                    <option value="">כל התפקידים</option>
                    <option value="admin">מנהל ראשי</option>
                    <option value="manager">מנהל יחידה</option>
                    <option value="employee">עובד</option>
                </select>
                {(filters.unitName || filters.role || query) && (
                    <button type="button" className="btn-clear-filters" onClick={() => { onFilterChange({ unitName: "", role: "" }); setQuery(""); }}>נקה סינון</button>
                )}
                <span className="toolbar__spacer" />
                <button type="button" className="btn btn--primary" onClick={onOpenAddUser}><UserPlus size={16} />משתמש חדש</button>
            </div>

            {rows.length === 0 ? (
                <div className="detail__empty"><strong>{query || filters.unitName || filters.role ? "לא נמצאו משתמשים" : "עדיין אין משתמשים"}</strong><span>{query || filters.unitName || filters.role ? "נסה לשנות את החיפוש או את הסינון." : "הוסף את המשתמש הראשון בכפתור למעלה."}</span></div>
            ) : (
                <div className="people">
                    {rows.map((u) => (
                        <article key={u.employeeCode} className={`pcard ${personClass(u.employeeCode)}`}>
                            <div className="pcard__top">
                                <Avatar name={u.fullName} code={u.employeeCode} size="lg" />
                                <div><strong>{u.fullName}</strong><small>#{u.employeeCode}</small></div>
                                <span className={`role-badge role-${u.role}`} style={{ marginInlineStart: "auto" }}>{getRoleLabel(u.role)}</span>
                            </div>
                            <div className="pcard__meta">
                                <span><Building2 size={15} />{u.role === "admin" ? "כלל המערכת" : u.unitName || "ללא יחידה"}</span>
                                <span><Phone size={15} /><bdi dir="ltr">{u.phone}</bdi></span>
                                <span><Mail size={15} /><bdi dir="ltr">{u.email}</bdi></span>
                                {u.role === "employee" && <span><Clock size={15} />עד {u.maxWeeklyHours || 40} שעות בשבוע</span>}
                            </div>
                            <div className="pcard__foot">
                                <div className="pcard__actions">
                                    <button type="button" className="btn-edit" onClick={() => onOpenEditUser(u)}><Pencil size={12} />ערוך</button>
                                    {u.role === "manager" && <button type="button" className="btn-replace" onClick={() => onOpenReplaceManager(u)} title="מנהל יחידה אינו נמחק — רק מוחלף"><ArrowRightLeft size={12} />החלף מנהל</button>}
                                    {u.role === "employee" && <button type="button" className="btn-delete" onClick={() => void remove(u)}><Trash2 size={12} />מחק</button>}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
            <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>{rows.length} מתוך {users.length} משתמשים · מנהל יחידה לא נמחק, רק מוחלף</p>
        </section>
    );
};

export default UsersTable;
