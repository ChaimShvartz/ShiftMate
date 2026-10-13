import { initialsOf, personClass } from "../../utils/person";

export default function Avatar({ name, code, size = "md" }: { name?: string | null; code?: string | null; size?: "sm" | "md" | "lg" }) {
    return <span className={`pavatar pavatar--${size} ${personClass(code)}`} aria-hidden>{initialsOf(name)}</span>;
}

export function AvatarStack({ people, max = 4 }: { people: { name?: string | null; code: string }[]; max?: number }) {
    if (!people.length) return <span className="muted" style={{ fontSize: 13 }}>אין מועמדים</span>;
    return (
        <span className="astack" title={people.map((p) => p.name).join(", ")}>
            {people.slice(0, max).map((p) => <Avatar key={p.code} name={p.name} code={p.code} size="sm" />)}
            {people.length > max && <span className="pavatar pavatar--sm pc-more">+{people.length - max}</span>}
        </span>
    );
}
