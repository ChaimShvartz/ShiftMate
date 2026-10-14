import { Building2, Plus, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useUiStore } from "../../store/uiStore";
import type { Unit } from "../../types";
import { matches } from "../../utils/search";
import SearchInput from "../ui/SearchInput";

interface Props {
    units: Unit[];
    onAddUnit: (name: string) => Promise<void>;
    onDeleteUnit: (name: string) => Promise<void>;
    loading: boolean;
    initialQuery?: string;
}

const UnitsSection = ({ units, onAddUnit, onDeleteUnit, loading, initialQuery = "" }: Props) => {
    const [name, setName] = useState("");
    const [query, setQuery] = useState(initialQuery);
    const rows = useMemo(() => units.filter((u) => matches(query, u.name)).sort((a, b) => a.name.localeCompare(b.name, "he")), [units, query]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        await onAddUnit(trimmed);
        setName("");
    };

    const remove = async (n: string) => {
        const ok = await useUiStore.getState().confirm({ title: "מחיקת יחידה", message: `היחידה "${n}" תימחק. אפשר למחוק רק יחידה שאין בה עובדים ומנהל.`, confirmLabel: "מחק יחידה", danger: true });
        if (ok) await onDeleteUnit(n);
    };

    return (
        <section>
            <form onSubmit={submit} className="unit-create-form">
                <div className="form-group">
                    <label htmlFor="unitName">שם יחידה חדשה</label>
                    <input id="unitName" type="text" required placeholder="לדוגמה: מיון" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="btn btn--primary"><Plus size={16} />הוסף יחידה</button>
            </form>

            <div className="toolbar">
                <SearchInput label="חיפוש יחידות" placeholder="חיפוש יחידה" value={query} onChange={setQuery} />
            </div>

            {rows.length === 0 ? (
                <div className="detail__empty"><strong>{query ? "לא נמצאו יחידות" : "עדיין אין יחידות"}</strong><span>{query ? "נסה חיפוש אחר." : "הוסף את היחידה הראשונה בטופס למעלה."}</span></div>
            ) : (
                <ul className="dir__list dir__list--plain">
                    {rows.map((u) => (
                        <li key={u.name} className="dir__row dir__row--unit">
                            <span className="dir__open dir__open--static">
                                <span className="dir__unit-icon"><Building2 size={18} /></span>
                                <span className="dir__name"><strong>{u.name}</strong><small>נוצרה {u.created_at ? new Date(u.created_at).toLocaleDateString("he-IL") : "—"}</small></span>
                            </span>
                            <button type="button" className="icon-btn dir__menu dir__menu--danger" aria-label={`מחק את היחידה ${u.name}`} title="מחיקת יחידה" onClick={() => void remove(u.name)}><Trash2 size={17} /></button>
                        </li>
                    ))}
                </ul>
            )}
            <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>{rows.length} מתוך {units.length} יחידות</p>
        </section>
    );
};

export default UnitsSection;
