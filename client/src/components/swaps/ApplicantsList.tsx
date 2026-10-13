import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { SwapApplicant } from "../../types";
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
        return <p className="applicants__empty">עדיין אין מועמדים ממתינים להחלטה.</p>;
    }

    return (
        <ul className="applicants-list">
            {pending.map((a) => {
                const blocked = a.compliance?.status === "violation";
                return (
                    <motion.li
                        key={a.employeeCode}
                        className="applicant-item"
                        layout
                    >
                        <div className="applicant-item__who">
                            <span className="avatar avatar--sm">{(a.employeeName ?? a.employeeCode).slice(0, 1)}</span>
                            <div>
                                <strong>{a.employeeName ?? a.employeeCode}</strong>
                                <small>#{a.employeeCode}</small>
                            </div>
                        </div>
                        {a.compliance && <ComplianceBadge result={a.compliance} />}
                        <div className="applicant-item__actions">
                            <motion.button
                                type="button"
                                className="applicant-item__btn applicant-item__btn--approve"
                                disabled={busy || blocked}
                                title={blocked ? "לא ניתן לאשר: קיימת חריגה מחוקי העבודה" : "אשר מועמד"}
                                onClick={() => onApprove(a.employeeCode)}
                                whileTap={{ scale: 0.96 }}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <Check size={14} />
                                    <span>אשר</span>
                                </span>
                            </motion.button>
                            <motion.button
                                type="button"
                                className="applicant-item__btn applicant-item__btn--reject"
                                disabled={busy}
                                onClick={() => onReject(a.employeeCode)}
                                whileTap={{ scale: 0.96 }}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <X size={14} />
                                    <span>דחה</span>
                                </span>
                            </motion.button>
                        </div>
                    </motion.li>
                );
            })}
        </ul>
    );
}
