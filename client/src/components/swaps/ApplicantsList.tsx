import { Check, X } from "lucide-react";
import type { SwapApplicant } from "../../types";
import Avatar from "../ui/Avatar";
import ComplianceBadge from "./ComplianceBadge";

interface Props {
    applicants: SwapApplicant[];
    busy?: boolean;
    onApprove: (employeeCode: string) => void;
    onReject: (employeeCode: string) => void;
}

export default function ApplicantsList({ applicants, busy, onApprove, onReject }: Props) {
    const pending = applicants.filter((a) => a.status === "pending");

    if (pending.length === 0) {
        return <p className="applicants__empty">עדיין אין מועמדים שממתינים להחלטה. עובדים יופיעו כאן ברגע שיגישו מועמדות.</p>;
    }

    return (
        <ul className="applicants-list">
            {pending.map((a) => {
                const blocked = a.compliance?.status === "violation";
                return (
                    <li key={a.employeeCode} className="applicant-item">
                        <div className="applicant-item__who">
                            <Avatar name={a.employeeName ?? a.employeeCode} code={a.employeeCode} size="sm" />
                            <div>
                                <strong>{a.employeeName ?? a.employeeCode}</strong>
                                <small>#{a.employeeCode}</small>
                            </div>
                        </div>
                        {a.compliance ? <ComplianceBadge result={a.compliance} /> : <span />}
                        <div className="applicant-item__actions">
                            <button
                                type="button"
                                className="applicant-item__btn applicant-item__btn--approve"
                                disabled={busy || blocked}
                                title={blocked ? "לא ניתן לאשר: קיימת חריגה מחוקי העבודה" : "אשר מועמד"}
                                onClick={() => onApprove(a.employeeCode)}
                            >
                                <Check size={14} /> אשר
                            </button>
                            <button type="button" className="applicant-item__btn applicant-item__btn--reject" disabled={busy} onClick={() => onReject(a.employeeCode)}>
                                <X size={14} /> דחה
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
