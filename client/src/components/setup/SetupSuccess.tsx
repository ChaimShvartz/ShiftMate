import { useState } from "react";

interface SetupSuccessProps {
    adminCode: string;
    onLoginClick: () => void;
}

const SetupSuccess = ({ adminCode, onLoginClick }: SetupSuccessProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(adminCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="setup-success-container" dir="rtl">
            <header className="setup-header">
                <img
                    src="/logo-icon.png"
                    alt="ShiftMate"
                    className="setup-success-logo-icon"
                />
                <h2>המערכת הוקמה בהצלחה!</h2>
                <p>נוצר מנהל ראשי חדש למערכת.</p>
            </header>

            <section className="admin-code-card">
                <p className="code-label">קוד העובד הייחודי שלך להתחברות:</p>
                <div className="admin-code-display">{adminCode}</div>
                <button
                    type="button"
                    className="btn-copy-code"
                    onClick={handleCopy}
                >
                    {copied ? "✓ הועתק בהצלחה!" : "📋 העתק קוד"}
                </button>
                <p className="code-warning">
                    ⚠️ שמור קוד זה! הוא נדרש לצורך כל התחברות למערכת.
                </p>
            </section>

            <button type="button" onClick={onLoginClick} className="btn-submit">
                מעבר למסך ההתחברות
            </button>
        </div>
    );
};

export default SetupSuccess;
