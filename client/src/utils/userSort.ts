import type { User } from "../types";

export type UserSort = "unit" | "name" | "code" | "newest";

export const SORT_OPTIONS: { value: UserSort; label: string }[] = [
    { value: "unit", label: "לפי יחידה ושם" },
    { value: "name", label: "לפי שם" },
    { value: "code", label: "לפי קוד עובד" },
    { value: "newest", label: "החדשים ראשונים" },
];

const he = (a: string, b: string) => a.localeCompare(b, "he");
const ROLE_ORDER = { admin: 0, manager: 1, employee: 2 } as const;

export interface UserGroup {
    key: string;
    title: string;
    users: User[];
}

// Stable, predictable order: admin group first, units alphabetically,
// manager before employees, then employees by name.
export function groupUsers(users: User[], sort: UserSort): UserGroup[] {
    const byName = (a: User, b: User) => he(a.fullName, b.fullName);
    const inUnit = (a: User, b: User) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || byName(a, b);

    if (sort !== "unit") {
        const sorted = [...users].sort(
            sort === "name"
                ? byName
                : sort === "code"
                  ? (a, b) => a.employeeCode.localeCompare(b.employeeCode)
                  : (a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "") || byName(a, b),
        );
        return [{ key: "all", title: "", users: sorted }];
    }

    const map = new Map<string, User[]>();
    for (const u of users) {
        const key = u.role === "admin" ? "" : (u.unitName ?? "ללא יחידה");
        map.set(key, [...(map.get(key) ?? []), u]);
    }
    return [...map.entries()]
        .sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : he(a, b)))
        .map(([key, list]) => ({ key: key || "__system", title: key || "כלל המערכת", users: list.sort(inUnit) }));
}
