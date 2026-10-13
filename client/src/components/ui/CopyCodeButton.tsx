import { Check, Copy } from "lucide-react";
import { useState } from "react";

// Copies the employee code (digits only - that is what you type at login).
export default function CopyCodeButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        const clean = code.replace(/\D/g, "");
        try {
            await navigator.clipboard.writeText(clean);
        } catch {
            const t = document.createElement("textarea");
            t.value = clean;
            document.body.appendChild(t);
            t.select();
            document.execCommand("copy");
            t.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }

    return (
        <button type="button" className="btn btn--ghost btn--sm copy-btn" onClick={() => void copy()} aria-live="polite">
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "הועתק" : "העתק קוד"}
        </button>
    );
}
