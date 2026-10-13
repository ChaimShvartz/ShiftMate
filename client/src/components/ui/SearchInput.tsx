import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    label: string;
}

// Press "/" anywhere on the page to jump to the search field.
export default function SearchInput({ value, onChange, placeholder = "חיפוש…", label }: Props) {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
                e.preventDefault();
                ref.current?.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="search" role="search">
            <Search size={16} aria-hidden />
            <input
                ref={ref}
                type="search"
                aria-label={label}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {value && (
                <button type="button" className="search__clear" aria-label="נקה חיפוש" onClick={() => onChange("")}>
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
