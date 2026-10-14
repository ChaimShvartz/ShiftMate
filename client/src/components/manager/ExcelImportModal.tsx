import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { downloadTemplate, importShifts } from "../../api/shifts";
import type { ShiftWeek } from "../../types";
import { getErrorDetails, getErrorMessage } from "../../utils/getErrorMessage";

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: (week: ShiftWeek) => void;
}

interface ImportState {
    file: File | null;
    loading: boolean;
    downloading: boolean;
    error: string | null;
    rowErrors: { row?: number; message: string }[];
    successMessage: string | null;
}

const ExcelImportModal = ({
    isOpen,
    onClose,
    onImportSuccess,
}: ExcelImportModalProps) => {
    const [state, setState] = useState<ImportState>({
        file: null,
        loading: false,
        downloading: false,
        error: null,
        rowErrors: [],
        successMessage: null,
    });

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setState((prev) => ({
            ...prev,
            file: selectedFile,
            error: null,
            rowErrors: [],
            successMessage: null,
        }));
    };

    const handleDownloadTemplate = async () => {
        setState((prev) => ({ ...prev, downloading: true, error: null }));
        try {
            const blob = await downloadTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "shifts_template.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setState((prev) => ({ ...prev, downloading: false }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                downloading: false,
                error: getErrorMessage(err, "שגיאה בהורדת תבנית האקסל"),
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.file) {
            setState((prev) => ({
                ...prev,
                error: "אנא בחר קובץ אקסל להעלאה",
            }));
            return;
        }

        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
            rowErrors: [],
        }));

        try {
            const createdWeek = await importShifts(state.file);
            setState((prev) => ({
                ...prev,
                loading: false,
                successMessage: `לוח המשמרות לשבוע ${createdWeek.weekNumber} הועלה בהצלחה!`,
            }));
            setTimeout(() => {
                onImportSuccess(createdWeek);
                handleClose();
            }, 1200);
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "שגיאה בהעלאת קובץ האקסל"),
                rowErrors: getErrorDetails(err),
            }));
        }
    };

    const handleClose = () => {
        setState({
            file: null,
            loading: false,
            downloading: false,
            error: null,
            rowErrors: [],
            successMessage: null,
        });
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-backdrop"
                dir="rtl"
                onClick={handleClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                >
                    <header className="modal-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <FileSpreadsheet size={20} style={{ color: "var(--brand)" }} />
                            <h3>העלאת לוח משמרות שבועי (Excel)</h3>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        >
                            <X size={16} />
                        </button>
                    </header>

                    <div className="rule-notice-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <AlertTriangle size={15} />
                            <strong>שים לב לכלל העסקי:</strong>
                        </div>
                        <p>
                            העלאת לוח משמרות שבועי מתאפשרת{" "}
                            <strong>אך ורק בימי רביעי וחמישי</strong> עבור השבוע הבא.
                        </p>
                    </div>

                    {state.error && (
                        <div className="error-message">{state.error}</div>
                    )}
                    {state.rowErrors.length > 0 && (
                        <ul className="row-errors">
                            {state.rowErrors.map((r, i) => (
                                <li key={i}>
                                    {r.row ? <b>שורה {r.row}:</b> : null} {r.message}
                                </li>
                            ))}
                        </ul>
                    )}
                    {state.successMessage && (
                        <div className="success-message" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <CheckCircle2 size={16} />
                            <span>{state.successMessage}</span>
                        </div>
                    )}

                    <div className="template-download-section">
                        <p>זקוק לתבנית הקובץ עם שמות העובדים של היחידה?</p>
                        <motion.button
                            type="button"
                            className="btn-secondary"
                            onClick={handleDownloadTemplate}
                            disabled={state.downloading}
                            whileTap={{ scale: 0.97 }}
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <Download size={14} />
                                <span>{state.downloading ? "מוריד תבנית..." : "הורד תבנית אקסל מוכנה"}</span>
                            </span>
                        </motion.button>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="form-group">
                            <label htmlFor="excelFile">בחר קובץ אקסל (.xlsx)</label>
                            <input
                                id="excelFile"
                                type="file"
                                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileChange}
                                required
                            />
                        </div>

                        {state.file && (
                            <div className="selected-file-info">
                                <span>
                                    קובץ שנבחר: <strong><bdi dir="ltr">{state.file.name}</bdi></strong>
                                </span>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleClose}
                            >
                                ביטול
                            </button>
                            <motion.button
                                type="submit"
                                disabled={state.loading || !state.file}
                                className="btn-submit"
                                whileTap={{ scale: 0.98 }}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <Upload size={15} />
                                    <span>
                                        {state.loading
                                            ? "מעלה ומאמת נתונים..."
                                            : "העלה לוח משמרות"}
                                    </span>
                                </span>
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ExcelImportModal;
