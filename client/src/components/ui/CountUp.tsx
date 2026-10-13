import { gsap } from "gsap";
import { useEffect, useRef } from "react";

// Counts a number up on mount / when it changes. Non-numeric values render as-is.
export default function CountUp({ value }: { value: number | string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const last = useRef(0);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof value !== "number") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            el.textContent = String(value);
            return;
        }
        const state = { n: last.current };
        const tween = gsap.to(state, {
            n: value,
            duration: 1.1,
            ease: "power3.out",
            onUpdate: () => {
                el.textContent = String(Math.round(state.n));
            },
        });
        last.current = value;
        return () => {
            tween.kill();
        };
    }, [value]);

    return <span ref={ref}>{value}</span>;
}
