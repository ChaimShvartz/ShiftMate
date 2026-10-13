import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Building2, LayoutList, Repeat, User, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUnits } from "../../api/units";
import { getAllUsers } from "../../api/users";
import { getBoard, getManagerSwaps } from "../../api/swaps";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import type { Unit, User as UserT } from "../../types";
import { fmtDateShort, fmtTimeRange } from "../../utils/datetime";

interface Item { id: string; label: string; hint?: string; to: string; kind: "page" | "person" | "swap" | "unit"; }

const ICON = { page: LayoutList, person: UserRound, swap: Repeat, unit: Building2 };

// Ctrl/⌘+K opens a role-aware command palette: jump to pages, people, requests, units.
export default function CommandPalette() {
    const open = useUiStore((s) => s.paletteOpen);
    const setOpen = useUiStore((s) => s.setPaletteOpen);
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(!useUiStore.getState().paletteOpen);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [setOpen]);

    useEffect(() => {
        if (!open || !user) return;
        let alive = true;
        (async () => {
            const pages: Item[] =
                user.role === "admin"
                    ? [{ id: "p-admin", label: "ניהול מערכת", to: "/admin", kind: "page" }]
                    : user.role === "manager"
                      ? [
                            { id: "p-dash", label: "בקשות החלפה", to: "/dashboard", kind: "page" },
                            { id: "p-sched", label: "לוח משמרות", to: "/schedule", kind: "page" },
                        ]
                      : [
                            { id: "p-mine", label: "המשמרות שלי", to: "/my-shifts", kind: "page" },
                            { id: "p-board", label: "בורסת משמרות", to: "/swaps", kind: "page" },
                        ];
            pages.push({ id: "p-profile", label: "הפרופיל שלי", to: "/profile", kind: "page" });
            setItems(pages);
            try {
                const extra: Item[] = [];
                if (user.role === "admin") {
                    const [users, units] = await Promise.all([getAllUsers(), getAllUnits()]);
                    users.forEach((u: UserT) => extra.push({ id: `u-${u.employeeCode}`, label: u.fullName, hint: `#${u.employeeCode}`, to: `/admin?q=${encodeURIComponent(u.fullName)}`, kind: "person" }));
                    units.forEach((u: Unit) => extra.push({ id: `unit-${u.name}`, label: u.name, hint: "יחידה", to: `/admin?tab=units&q=${encodeURIComponent(u.name)}`, kind: "unit" }));
                } else if (user.role === "manager") {
                    const [emps, swaps] = await Promise.all([getAllUsers({ role: "employee" }), getManagerSwaps()]);
                    emps.forEach((u: UserT) => extra.push({ id: `e-${u.employeeCode}`, label: u.fullName, hint: `#${u.employeeCode}`, to: `/schedule?q=${encodeURIComponent(u.fullName)}`, kind: "person" }));
                    swaps.filter((s) => !s.status.startsWith("closed")).forEach((s) =>
                        extra.push({ id: `s-${s._id}`, label: `החלפה · ${s.requesterName}`, hint: s.shiftDetails ? `${fmtDateShort(s.shiftDetails.startTime)} ${fmtTimeRange(s.shiftDetails.startTime, s.shiftDetails.endTime)}` : "", to: `/dashboard?swap=${s._id}`, kind: "swap" }));
                } else {
                    const board = await getBoard();
                    board.forEach((s) => extra.push({ id: `b-${s._id}`, label: `בבורסה · ${s.requesterName}`, hint: s.shiftDetails ? fmtDateShort(s.shiftDetails.startTime) : "", to: `/swaps?q=${encodeURIComponent(s.requesterName ?? "")}`, kind: "swap" }));
                }
                if (alive) setItems([...pages, ...extra]);
            } catch {
                /* pages stay available even if data fails to load */
            }
        })();
        return () => {
            alive = false;
        };
    }, [open, user]);

    if (!user) return null;
    const go = (to: string) => {
        setOpen(false);
        navigate(to);
    };
    const groups: [string, Item["kind"]][] = [["ניווט", "page"], ["אנשים", "person"], ["בקשות החלפה", "swap"], ["יחידות", "unit"]];

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="dialog__overlay" />
                <Dialog.Content className="dialog__content cmdk" dir="rtl" aria-describedby={undefined}>
                    <Dialog.Title className="sr-only">חיפוש</Dialog.Title>
                    <Command label="חיפוש כללי" loop>
                        <Command.Input placeholder="חיפוש עובד, בקשה או עמוד…" autoFocus />
                        <Command.List>
                            <Command.Empty>לא נמצאו תוצאות</Command.Empty>
                            {groups.map(([heading, kind]) => {
                                const list = items.filter((i) => i.kind === kind);
                                if (!list.length) return null;
                                return (
                                    <Command.Group key={kind} heading={heading}>
                                        {list.map((i) => {
                                            const Icon = ICON[i.kind] ?? User;
                                            return (
                                                <Command.Item key={i.id} value={`${i.label} ${i.hint ?? ""}`} onSelect={() => go(i.to)}>
                                                    <Icon size={16} aria-hidden />
                                                    <span>{i.label}</span>
                                                    {i.hint && <small>{i.hint}</small>}
                                                </Command.Item>
                                            );
                                        })}
                                    </Command.Group>
                                );
                            })}
                        </Command.List>
                    </Command>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
