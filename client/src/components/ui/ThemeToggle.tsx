import { useThemeStore, type ThemeMode } from "../../store/themeStore";

const OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: "light", label: "מצב בהיר", icon: "☀" },
    { mode: "system", label: "לפי המכשיר", icon: "◐" },
    { mode: "dark", label: "מצב כהה", icon: "☾" },
];

export default function ThemeToggle() {
    const mode = useThemeStore((s) => s.mode);
    const setMode = useThemeStore((s) => s.setMode);

    return (
        <div className="theme-toggle" role="radiogroup" aria-label="ערכת נושא">
            {OPTIONS.map((o) => (
                <button
                    key={o.mode}
                    type="button"
                    role="radio"
                    aria-checked={mode === o.mode}
                    aria-label={o.label}
                    title={o.label}
                    className={mode === o.mode ? "is-active" : ""}
                    onClick={() => setMode(o.mode)}
                >
                    {o.icon}
                </button>
            ))}
        </div>
    );
}
