import { motion } from "framer-motion";
import { Sun, Laptop, Moon } from "lucide-react";
import { useThemeStore, type ThemeMode } from "../../store/themeStore";

const OPTIONS: { mode: ThemeMode; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { mode: "light", label: "מצב בהיר", icon: Sun },
    { mode: "system", label: "לפי המכשיר", icon: Laptop },
    { mode: "dark", label: "מצב כהה", icon: Moon },
];

export default function ThemeToggle() {
    const mode = useThemeStore((s) => s.mode);
    const setMode = useThemeStore((s) => s.setMode);

    return (
        <div className="theme-toggle" role="radiogroup" aria-label="ערכת נושא">
            {OPTIONS.map((o) => {
                const Icon = o.icon;
                const active = mode === o.mode;
                return (
                    <button
                        key={o.mode}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={o.label}
                        title={o.label}
                        className={active ? "is-active" : ""}
                        onClick={() => setMode(o.mode)}
                    >
                        {active && (
                            <motion.span
                                layoutId="theme-active-pill"
                                className="theme-toggle__active-pill"
                                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                            />
                        )}
                        <span style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={14} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
