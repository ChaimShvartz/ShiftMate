import React, { useState } from "react";
import { downloadTemplate, importShifts } from "../../api/shifts";
import type { ShiftWeek } from "../../types";
import { getErrorMessage } from "../../utils/getErrorMessage";

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
        successMessage: null,
    });

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setState((prev) => ({
            ...prev,
            file: selectedFile,
            error: null,
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

        setState((prev) => ({ ...prev, loading: true, error: null }));

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
            }));
        }
    };

    const handleClose = () => {
        setState({
            file: null,
            loading: false,
            downloading: false,
            error: null,
            successMessage: null,
        });
        onClose();
    };

    return (
        <div className="modal-backdrop" dir="rtl">
            <div className="modal-content">
                <header className="modal-header">
                    <h3>העלאת לוח משמרות שבועי (Excel)</h3>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={handleClose}
                    >
                        ✕
                    </button>
                </header>

                <div className="rule-notice-box">
                    <strong>📅 שים לב לכלל העסקי:</strong>
                    <p>
                        העלאת לוח משמרות שבועי מתאפשרת{" "}
                        <strong>אך ורק בימי חמישי</strong> עבור השבוע הבא.
                    </p>
                </div>

                {state.error && (
                    <div className="error-message">{state.error}</div>
                )}
                {state.successMessage && (
                    <div className="success-message">
                        {state.successMessage}
                    </div>
                )}

                <div className="template-download-section">
                    <p>זקוק לתבנית הקובץ עם שמות העובדים של היחידה?</p>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleDownloadTemplate}
                        disabled={state.downloading}
                    >
                        {state.downloading
                            ? "מוריד תבנית..."
                            : "📥 הורד תבנית אקסל מוכנה"}
                    </button>
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
                                קובץ שנבחר: <strong>{state.file.name}</strong>
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
                        <button
                            type="submit"
                            disabled={state.loading || !state.file}
                            className="btn-submit"
                        >
                            {state.loading
                                ? "מעלה ומאמת נתונים..."
                                : "העלה לוח משמרות"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExcelImportModal;
