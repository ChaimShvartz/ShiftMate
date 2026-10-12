interface SetupSuccessProps {
    adminCode: string;
    unitName: string;
    onLoginClick: () => void;
}

const SetupSuccess = ({
    adminCode,
    unitName,
    onLoginClick,
}: SetupSuccessProps) => {
    return (
        <div className="setup-success-container" dir="rtl">
            <header className="setup-header">
                <h2>המערכת הוקמה בהצלחה!</h2>
                <p>נוצר מנהל ראשי חדש ויחידה ראשונית ({unitName}).</p>
            </header>

            <section className="admin-code-card">
                <p className="code-label">קוד העובד הייחודי שלך להתחברות:</p>
                <div className="admin-code-display">{adminCode}</div>
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
