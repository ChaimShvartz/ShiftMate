import React, { useState } from "react";
import type { Unit } from "../../types";

interface UnitsSectionProps {
    units: Unit[];
    onAddUnit: (name: string) => Promise<void>;
    onDeleteUnit: (name: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

const initialForm = {
    name: "",
};

const UnitsSection = ({
    units,
    onAddUnit,
    onDeleteUnit,
    loading,
    error,
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

    const handleDelete = (name: string) => {
        if (window.confirm(`האם אתה בטוח שברצונך למחוק את יחידה "${name}"?`)) {
            onDeleteUnit(name);
        }
    };

    return (
        <section className="admin-units-section">
            <header className="section-header">
                <h2>ניהול יחידות</h2>
                <p>הקמה ומחיקה של יחידות וצוותים בארגון</p>
            </header>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="unit-create-form">
                <div className="form-group">
                    <label htmlFor="unitName">שם יחידה חדשה</label>
                    <input
                        id="unitName"
                        name="name"
                        type="text"
                        required
                        placeholder="לדוגמה: מוקד שירות לקוחות"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-submit">
                    {loading ? "מוסיף..." : "הוסף יחידה"}
                </button>
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
                                        {unit.name}
                                    </td>
                                    <td>
                                        {unit.created_at
                                            ? new Date(
                                                  unit.created_at,
                                              ).toLocaleDateString("he-IL")
                                            : "—"}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() =>
                                                handleDelete(unit.name)
                                            }
                                        >
                                            מחק
                                        </button>
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
