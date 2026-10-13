import type { ComplianceResult, SwapApplicant, SwapRequest } from "../../types";

interface Props {
    swapId: string;
    applicants: SwapApplicant[];
    enrichedSwap: SwapRequest;
    compliance: Record<string, ComplianceResult>;
    onFetchCompliance: (swapId: string, employeeCode: string) => void;
    onApprove: (employeeCode: string) => void;
    onReject: (employeeCode: string) => void;
}

const COMPLIANCE_ICON: Record<string, string> = {
    ok: "🟢",
    warning: "🟡",
    violation: "🔴",
};

export default function ApplicantsList({
    swapId,
    applicants,
    compliance,
    onFetchCompliance,
    onApprove,
    onReject,
}: Props) {
    const pending = applicants.filter((a) => a.status === "pending");

    if (pending.length === 0) {
        return <p className="applicants__empty">אין מועמדים ממתינים.</p>;
    }

    return (
        <ul className="applicants-list">
            {pending.map((applicant) => {
                const key = `${swapId}:${applicant.employeeCode}`;
                const result = compliance[key];

                return (
                    <li key={applicant.employeeCode} className="applicant-item">
                        <span className="applicant-item__code">
                            {applicant.employeeCode}
                        </span>

                        {result ? (
                            <span
                                className="applicant-item__compliance"
                                title={result.details}
                            >
                                {COMPLIANCE_ICON[result.status]}{" "}
                                {result.details}
                            </span>
                        ) : (
                            <button
                                className="applicant-item__check-btn"
                                onClick={() =>
                                    onFetchCompliance(
                                        swapId,
                                        applicant.employeeCode,
                                    )
                                }
                            >
                                בדיקת חוקיות
                            </button>
                        )}

                        <div className="applicant-item__actions">
                            <button
                                className="applicant-item__btn applicant-item__btn--approve"
                                onClick={() =>
                                    onApprove(applicant.employeeCode)
                                }
                                disabled={result?.status === "violation"}
                                title={
                                    result?.status === "violation"
                                        ? "לא ניתן לאשר: קיימת חריגה מחוקי העבודה"
                                        : "אשר מועמד"
                                }
                            >
                                ✓ אשר
                            </button>
                            <button
                                className="applicant-item__btn applicant-item__btn--reject"
                                onClick={() => onReject(applicant.employeeCode)}
                            >
                                ✗ דחה
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
