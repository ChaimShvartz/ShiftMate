import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Plus, Trash2, Calendar } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import type { Unit } from "../../types";

interface UnitsSectionProps {
    units: Unit[];
    onAddUnit: (name: string) => Promise<void>;
    onDeleteUnit: (name: string) => Promise<void>;
    loading: boolean;
}

const initialForm = {
    name: "",
};

const UnitsSection = ({
    units,
    onAddUnit,
    onDeleteUnit,
    loading,
}: UnitsSectionProps) => {
    const [formData, setFormData] = useState(initialForm);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        if (!trimmedName) return;

        await onAddUnit(trimmedName);
        setFormData(initialForm);
    };

    const handleDelete = async (name: string) => {
        const ok = await useUiStore.getState().confirm({
            title: "מחיקת יחידה",
            message: `למחוק את היחידה "${name}"? ניתן למחוק רק יחידה ריקה מעובדים.`,
            confirmLabel: "מחק",
            danger: true,
        });
        if (ok) onDeleteUnit(name);
    };

    return (
        <section className="admin-units-section">
            <header className="section-header">
                <div>
                    <h2>ניהול יחידות ארגוניות</h2>
                    <p>הקמה ומחיקה של מחלקות, סניפים וצוותים בארגון</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="unit-create-form">
                <div className="form-group">
                    <label htmlFor="unitName">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <Building2 size={13} style={{ opacity: 0.6 }} />
                            <span>שם יחידה חדשה</span>
                        </span>
                    </label>
                    <input
                        id="unitName"
                        name="name"
                        type="text"
                        required
                        placeholder="לדוגמה: מוקד שירות לקוחות, סניף צפון..."
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>
                <motion.button
                    type="submit"
                    disabled={loading}
                    className="btn-submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Plus size={16} />
                        <span>{loading ? "מוסיף..." : "הוסף יחידה"}</span>
                    </span>
                </motion.button>
            </form>

            <div className="units-list-container">
                <h3>רשימת יחידות קיימות ({units.length})</h3>
                {units.length === 0 ? (
                    <p className="empty-state">לא קיימות יחידות במערכת.</p>
                ) : (
                    <table className="units-table">
                        <thead>
                            <tr>
                                <th>שם יחידה</th>
                                <th>תאריך הקמה</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.name}>
                                    <td className="unit-name-cell">
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                            <Building2 size={15} style={{ color: "var(--brand)" }} />
                                            <span>{unit.name}</span>
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                                            <Calendar size={13} style={{ opacity: 0.5 }} />
                                            <span>
                                                {unit.created_at
                                                    ? new Date(
                                                          unit.created_at,
                                                      ).toLocaleDateString("he-IL")
                                                    : "—"}
                                            </span>
                                        </span>
                                    </td>
                                    <td>
                                        <motion.button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() =>
                                                handleDelete(unit.name)
                                            }
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                <Trash2 size={12} />
                                                <span>מחק</span>
                                            </span>
                                        </motion.button>
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

export default UnitsSection;
