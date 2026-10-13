import type { ComplianceResult } from "../../types";
import { COMPLIANCE_LABEL, complianceText } from "../../utils/compliance";

export default function ComplianceBadge({ result }: { result: ComplianceResult }) {
    const icon = { ok: "🟢", warning: "🟡", violation: "🔴" }[result.status];
    return (
        <span className={`compliance compliance--${result.status}`} title={complianceText(result)}>
            <span aria-hidden>{icon}</span>
            <span className="compliance__label">{COMPLIANCE_LABEL[result.status]}</span>
            <span className="compliance__text">{complianceText(result)}</span>
        </span>
    );
}
