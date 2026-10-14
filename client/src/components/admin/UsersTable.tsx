import * as Menu from "@radix-ui/react-dropdown-menu";
import { ArrowRightLeft, Building2, ChevronLeft, Clock, Crown, Mail, MoreHorizontal, Pencil, Phone, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useUiStore } from "../../store/uiStore";
import type { Unit, User } from "../../types";
import { getRoleLabel } from "../../utils/formatters";
import { personClass } from "../../utils/person";
import { matches } from "../../utils/search";
import { SORT_OPTIONS, groupUsers, type UserSort } from "../../utils/userSort";
import Avatar from "../ui/Avatar";
import CopyText from "../ui/CopyText";
import SearchInput from "../ui/SearchInput";
import Select from "../ui/Select";
import Sheet from "../ui/Sheet";

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

// People directory: rows grouped by unit, actions in a menu, details in a side sheet.
const UsersTable = ({ users, units, filters, initialQuery = "", onFilterChange, onDeleteUser, onOpenReplaceManager, onOpenEditUser, onOpenAddUser }: UsersTableProps) => {
    const [query, setQuery] = useState(initialQuery);
    const [sort, setSort] = useState<UserSort>("unit");
    const [openCode, setOpenCode] = useState<string | null>(null);

    const rows = useMemo(() => users.filter((u) => matches(query, u.fullName, u.employeeCode, u.email, u.phone, u.unitName, getRoleLabel(u.role))), [users, query]);
    const groups = useMemo(() => groupUsers(rows, sort), [rows, sort]);
    const selected = users.find((u) => u.employeeCode === openCode) ?? null;

    const remove = async (u: User) => {
        const ok = await useUiStore.getState().confirm({ title: "מחיקת עובד", message: `${u.fullName} (#${u.employeeCode}) יימחק לצמיתות. אי אפשר למחוק עובד שעדיין משובץ למשמרות.`, confirmLabel: "מחק עובד", danger: true });
        if (ok) {
            setOpenCode(null);
            await onDeleteUser(u.employeeCode, u.fullName);
        }
    };

    const actions = (u: User) => (
        <>
            <Menu.Item className="menu__item" onSelect={() => onOpenEditUser(u)}><Pencil size={15} />עריכה</Menu.Item>
            {u.role === "manager" && <Menu.Item className="menu__item" onSelect={() => onOpenReplaceManager(u)}><ArrowRightLeft size={15} />החלפת מנהל</Menu.Item>}
            {u.role === "employee" && <><Menu.Separator className="menu__sep" /><Menu.Item className="menu__item menu__item--danger" onSelect={() => void remove(u)}><Trash2 size={15} />מחיקה</Menu.Item></>}
        </>
    );

    return (
        <section>
            <div className="toolbar">
                <SearchInput label="חיפוש משתמשים" placeholder="שם, קוד, אימייל, טלפון או יחידה" value={query} onChange={setQuery} />
                <Select ariaLabel="סינון לפי יחידה" className="select__trigger--pill" value={filters.unitName} onValueChange={(v) => onFilterChange({ ...filters, unitName: v })} options={[{ value: "", label: "כל היחידות" }, ...units.map((u) => ({ value: u.name, label: u.name }))]} />
                <Select ariaLabel="סינון לפי תפקיד" className="select__trigger--pill" value={filters.role} onValueChange={(v) => onFilterChange({ ...filters, role: v })} options={[{ value: "", label: "כל התפקידים" }, { value: "admin", label: "מנהל ראשי" }, { value: "manager", label: "מנהל יחידה" }, { value: "employee", label: "עובד" }]} />
                <Select ariaLabel="מיון" className="select__trigger--pill" value={sort} onValueChange={(v) => setSort(v as UserSort)} options={SORT_OPTIONS} />
                {(filters.unitName || filters.role || query) && (
                    <button type="button" className="btn-clear-filters" onClick={() => { onFilterChange({ unitName: "", role: "" }); setQuery(""); }}>נקה סינון</button>
                )}
                <span className="toolbar__spacer" />
                <button type="button" className="btn btn--primary" onClick={onOpenAddUser}><UserPlus size={16} />משתמש חדש</button>
            </div>

            {rows.length === 0 ? (
                <div className="detail__empty"><strong>{query || filters.unitName || filters.role ? "לא נמצאו משתמשים" : "עדיין אין משתמשים"}</strong><span>{query || filters.unitName || filters.role ? "נסה לשנות את החיפוש או את הסינון." : "הוסף את המשתמש הראשון בכפתור למעלה."}</span></div>
            ) : (
                <div className="dir">
                    {groups.map((g) => (
                        <div key={g.key} className="dir__group">
                            {g.title && <h3 className="dir__title"><Building2 size={15} />{g.title}<span>{g.users.length}</span></h3>}
                            <ul className="dir__list">
                                {g.users.map((u) => (
                                    <li key={u.employeeCode} className={`dir__row ${personClass(u.employeeCode)}`}>
                                        <button type="button" className="dir__open" onClick={() => setOpenCode(u.employeeCode)} aria-label={`פרטי ${u.fullName}`}>
                                            <Avatar name={u.fullName} code={u.employeeCode} size="md" />
                                            <span className="dir__name">
                                                <strong>{u.fullName}{u.role === "manager" && <Crown size={13} aria-label="מנהל יחידה" />}</strong>
                                                <small>#{u.employeeCode}{sort !== "unit" && u.unitName ? ` · ${u.unitName}` : ""}</small>
                                            </span>
                                            <span className={`role-badge role-${u.role} dir__role`}>{getRoleLabel(u.role)}</span>
                                            <span className="dir__phone mono"><bdi dir="ltr">{u.phone}</bdi></span>
                                            <span className="dir__hours mono">{u.role === "employee" ? `${u.maxWeeklyHours || 40} ש׳` : ""}</span>
                                            <ChevronLeft size={16} className="dir__chev" aria-hidden />
                                        </button>
                                        <Menu.Root>
                                            <Menu.Trigger className="icon-btn dir__menu" aria-label={`פעולות ל${u.fullName}`}><MoreHorizontal size={18} /></Menu.Trigger>
                                            <Menu.Portal><Menu.Content className="menu__content" align="end" sideOffset={6}>{actions(u)}</Menu.Content></Menu.Portal>
                                        </Menu.Root>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
            <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>{rows.length} מתוך {users.length} משתמשים · מנהל יחידה לא נמחק, רק מוחלף</p>

            <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setOpenCode(null)} title="פרטי משתמש">
                {selected && (
                    <div className="detail">
                        <div className="detail__head">
                            <div className="detail__who">
                                <Avatar name={selected.fullName} code={selected.employeeCode} size="lg" />
                                <div><strong>{selected.fullName}</strong><small>#{selected.employeeCode}</small></div>
                            </div>
                            <span className={`role-badge role-${selected.role}`}>{getRoleLabel(selected.role)}</span>
                        </div>
                        <dl className="facts">
                            <div><dt><Building2 size={15} />יחידה</dt><dd>{selected.role === "admin" ? "כלל המערכת" : selected.unitName || "ללא יחידה"}</dd></div>
                            <div><dt><Phone size={15} />טלפון</dt><dd><bdi dir="ltr">{selected.phone}</bdi><CopyText value={selected.phone} label="טלפון" /></dd></div>
                            <div><dt><Mail size={15} />אימייל</dt><dd><bdi dir="ltr">{selected.email}</bdi><CopyText value={selected.email} label="אימייל" /></dd></div>
                            <div><dt>#</dt><dd><bdi dir="ltr">{selected.employeeCode}</bdi><CopyText value={selected.employeeCode} label="קוד עובד" digitsOnly /></dd></div>
                            {selected.role === "employee" && <div><dt><Clock size={15} />מכסה שבועית</dt><dd>{selected.maxWeeklyHours || 40} שעות</dd></div>}
                        </dl>
                        <div className="detail__actions">
                            <button type="button" className="btn btn--primary" onClick={() => { setOpenCode(null); onOpenEditUser(selected); }}><Pencil size={16} />עריכה</button>
                            {selected.role === "manager" && <button type="button" className="btn btn--ghost" onClick={() => { setOpenCode(null); onOpenReplaceManager(selected); }}><ArrowRightLeft size={16} />החלפת מנהל</button>}
                            {selected.role === "employee" && <button type="button" className="btn btn--danger" onClick={() => void remove(selected)}><Trash2 size={16} />מחיקה</button>}
                        </div>
                        {selected.role === "manager" && <p className="muted" style={{ fontSize: 13 }}>מנהל יחידה לא נמחק. כדי להחליף אותו, השתמש ב"החלפת מנהל", כך שהיחידה לא נשארת בלי מנהל.</p>}
                    </div>
                )}
            </Sheet>
        </section>
    );
};

export default UsersTable;
