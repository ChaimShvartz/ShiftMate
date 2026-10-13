import { useId } from "react";

// ShiftMate mark: a clock face with two opposing swap arrows. Spins on hover.
export function LogoMark({ size = 34 }: { size?: number }) {
    const gid = useId();
    const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
    return (
        <svg className="logo-mark" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="ShiftMate">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--brand-hover)" />
                    <stop offset="100%" stopColor="var(--brand)" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--logo-ink, var(--ink))" strokeWidth="5" />
            {ticks.map((deg) => (
                <line key={deg} x1="50" y1={deg % 90 === 0 ? 10 : 12} x2="50" y2={deg % 90 === 0 ? 17 : 15} stroke="var(--logo-ink, var(--ink))" strokeWidth={deg % 90 === 0 ? 3.5 : 2} strokeLinecap="round" transform={`rotate(${deg} 50 50)`} />
            ))}
            <path d="M29 45 A23 23 0 0 1 69 38" fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" />
            <polygon points="74,31 76,47 61,41" fill="var(--logo-ink, var(--ink))" />
            <path d="M71 55 A23 23 0 0 1 31 62" fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" />
            <polygon points="26,69 24,53 39,59" fill="var(--logo-ink, var(--ink))" />
        </svg>
    );
}

export default function Logo({ height = 34, variant = "horizontal" }: { height?: number; variant?: "horizontal" | "icon" }) {
    return (
        <span className="logo" dir="ltr">
            <LogoMark size={height} />
            {variant === "horizontal" && (
                <span className="logo-word" style={{ fontSize: height * 0.64 }}>
                    <b>Shift</b>
                    <span>Mate</span>
                </span>
            )}
        </span>
    );
}
