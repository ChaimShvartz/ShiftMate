import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { ComplianceResult } from "../../types";
import { COMPLIANCE_LABEL, complianceText } from "../../utils/compliance";

export default function ComplianceBadge({ result }: { result: ComplianceResult }) {
    const isOk = result.status === "ok";
    const isWarning = result.status === "warning";

    return (
        <span
            className={`compliance compliance--${result.status}`}
            title={complianceText(result)}
        >
            <span aria-hidden style={{ display: "grid", placeItems: "center" }}>
                {isOk ? (
                    <CheckCircle2 size={14} style={{ color: "var(--success)" }} />
                ) : isWarning ? (
                    <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
                ) : (
                    <ShieldAlert size={14} style={{ color: "var(--danger)" }} />
                )}
            </span>
            <span className="compliance__label">{COMPLIANCE_LABEL[result.status]}</span>
            <span className="compliance__text">{complianceText(result)}</span>
        </span>
    );
}
