export function LogoMark({ size = 36 }: { size?: number }) {
    const ticks = Array.from({ length: 12 }, (_, i) => i * 30);

    return (
        <svg
            className="logo-mark"
            width={size}
            height={size}
            viewBox="0 0 100 100"
            role="img"
            aria-label="ShiftMate"
        >
            <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="3.5"
            />
            {ticks.map((deg) => (
                <line
                    key={deg}
                    x1="50"
                    y1={deg % 90 === 0 ? 10 : 13}
                    x2="50"
                    y2={deg % 90 === 0 ? 18 : 15}
                    stroke="var(--text-3)"
                    strokeWidth={deg % 90 === 0 ? 2.5 : 1.5}
                    strokeLinecap="round"
                    transform={`rotate(${deg} 50 50)`}
                />
            ))}
            <path
                d="M29 45 A23 23 0 0 1 69 38"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="5"
                strokeLinecap="round"
            />
            <polygon points="73,32 75,46 62,40" fill="var(--brand)" />
            <path
                d="M71 55 A23 23 0 0 1 31 62"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="5"
                strokeLinecap="round"
            />
            <polygon points="27,68 25,54 38,60" fill="var(--brand)" />
        </svg>
    );
}

export default function Logo({
    size = 36,
    showWord = true,
}: {
    size?: number;
    showWord?: boolean;
}) {
    return (
        <span className="logo" dir="ltr" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <LogoMark size={size} />
            {showWord && (
                <span
                    className="logo-word"
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: size * 0.58,
                        letterSpacing: "-0.03em",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                    }}
                >
                    <b style={{ color: "var(--text)", fontWeight: 800 }}>Shift</b>
                    <span style={{ color: "var(--brand-400)", fontWeight: 600 }}>Mate</span>
                </span>
            )}
        </span>
    );
}
