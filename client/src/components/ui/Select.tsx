import * as RS from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export interface Option { value: string; label: string; }

interface Props {
    value: string;
    onValueChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    id?: string;
    name?: string;
    required?: boolean;
    ariaLabel?: string;
    className?: string;
}

// Radix Select (the empty string is not a valid item value, so "" maps to a sentinel).
const EMPTY = "__empty__";

export default function Select({ value, onValueChange, options, placeholder, id, name, required, ariaLabel, className = "" }: Props) {
    const toItem = (v: string) => (v === "" ? EMPTY : v);
    const fromItem = (v: string) => (v === EMPTY ? "" : v);
    const selected = options.find((o) => o.value === value);

    return (
        <RS.Root value={toItem(value)} onValueChange={(v) => onValueChange(fromItem(v))} name={name} required={required} dir="rtl">
            <RS.Trigger id={id} aria-label={ariaLabel} className={`select__trigger ${className}`}>
                <span className={selected && selected.value !== "" ? "" : "select__placeholder"}>{selected ? selected.label : placeholder}</span>
                <RS.Icon><ChevronDown size={16} /></RS.Icon>
            </RS.Trigger>
            <RS.Portal>
                <RS.Content className="select__content" position="popper" sideOffset={6} dir="rtl">
                    <RS.Viewport className="select__viewport">
                        {options.map((o) => (
                            <RS.Item key={o.value || EMPTY} value={toItem(o.value)} className="select__item">
                                <RS.ItemText>{o.label}</RS.ItemText>
                                <RS.ItemIndicator className="select__check"><Check size={15} /></RS.ItemIndicator>
                            </RS.Item>
                        ))}
                    </RS.Viewport>
                </RS.Content>
            </RS.Portal>
        </RS.Root>
    );
}
