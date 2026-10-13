import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemeMode } from "../../store/themeStore";

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { mode: "light", label: "מצב בהיר", Icon: Sun },
    { mode: "system", label: "לפי המכשיר", Icon: Monitor },
    { mode: "dark", label: "מצב כהה", Icon: Moon },
];

export default function ThemeToggle() {
    const mode = useThemeStore((s) => s.mode);
    const setMode = useThemeStore((s) => s.setMode);

    return (
        <ToggleGroup.Root className="theme-toggle" type="single" value={mode} onValueChange={(v) => v && setMode(v as ThemeMode)} aria-label="ערכת נושא">
            {OPTIONS.map(({ mode: m, label, Icon }) => (
                <ToggleGroup.Item key={m} value={m} aria-label={label} title={label}>
                    <Icon size={15} />
                </ToggleGroup.Item>
            ))}
        </ToggleGroup.Root>
    );
}
