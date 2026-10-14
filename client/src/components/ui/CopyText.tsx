import { Check, Copy } from "lucide-react";
import { useState } from "react";

// Small copy-to-clipboard button for a value (phone, email, code).
export default function CopyText({ value, label, digitsOnly = false }: { value: string; label: string; digitsOnly?: boolean }) {
    const [done, setDone] = useState(false);
    async function copy() {
        const text = digitsOnly ? value.replace(/\D/g, "") : value;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const t = document.createElement("textarea");
            t.value = text;
            document.body.appendChild(t);
            t.select();
            document.execCommand("copy");
            t.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
    }
    return (
        <button type="button" className="copy-mini" onClick={() => void copy()} aria-label={`העתק ${label}`} title={`העתק ${label}`}>
            {done ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );
}
