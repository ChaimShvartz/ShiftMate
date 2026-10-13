const exactTranslations: Record<string, string> = {
    // Auth & Users
    "Invalid credentials": "קוד עובד או סיסמה שגויים",
    "User not found": "משתמש לא נמצא",
    "Current manager not found": "מנהל נוכחי לא נמצא",
    "Employee not found": "עובד לא נמצא",
    "Admin already exists": "מנהל ראשי כבר קיים במערכת",
    "System is already initialized": "המערכת כבר אותחלה בעבר",
    "Email address is already in use": "כתובת האימייל כבר קיימת במערכת",
    "Email already in use": "כתובת האימייל כבר קיימת במערכת",
    "Manager already exists for this unit": "כבר קיים מנהל עבור יחידה זו",
    "Cannot delete employee with active shifts":
        "לא ניתן למחוק עובד שיש לו משמרות פעילות השבוע",
    "Cannot delete employee with active shifts this week":
        "לא ניתן למחוק עובד שיש לו משמרות פעילות השבוע",
    "Authentication required - Missing token": "נדרשת התחברות למערכת",
    "Authentication required": "נדרשת התחברות למערכת",
    "Invalid or expired token": "פג תוקף ההתחברות, אנא התחבר מחדש",
    Unauthorized: "אין לך הרשאה מתאימה לביצוע פעולה זו",
    Forbidden: "הגישה נדחתה עקב היעדר הרשאות מתאימות",

    // Units
    "Unit not found": "יחידה לא נמצאה",
    "Cannot delete unit with active members":
        "לא ניתן למחוק יחידה שיש בה עובדים פעילים",
    "Cannot delete unit with active users":
        "לא ניתן למחוק יחידה שיש בה עובדים פעילים",

    // Shifts & Excel
    "File is not a valid Excel (.xlsx) file":
        "הקובץ אינו קובץ אקסל (.xlsx) תקין",
    "File is empty": "קובץ האקסל שהועלה ריק מנתונים",
    "Please upload a valid Excel file": "יש להעלות קובץ אקסל תקין",
    "Schedules can only be imported on Thursdays":
        "ניתן להעלות לוח משמרות בימי חמישי בלבד",
    "A schedule for this week has already been published":
        "לוח המשמרות לשבוע זה כבר פורסם",
    "Shift not found": "משמרת לא נמצאה",
    "Week not found": "שבוע משמרות לא נמצא",
    "Shift week not found": "שבוע משמרות לא נמצא",
    "End time must be after start time": "שעת סיום חייבת להיות אחרי שעת התחלה",
    "Shift end time must be after start time":
        "שעת סיום חייבת להיות אחרי שעת התחלה",
    "Employee does not belong to this unit": "העובד אינו משויך ליחידה זו",

    // Swaps
    "Swap request not found": "בקשת החלפה לא נמצאה",
    "Shift is already in a swap process":
        "משמרת זו כבר נמצאת בתהליך החלפה פעיל",
    "You cannot swap shifts that start in less than 24 hours":
        "לא ניתן לבקש החלפה עבור משמרת שמתחילה בעוד פחות מ-24 שעות",
    "Cannot apply for your own swap request":
        "אינך יכול להגיש מועמדות לבקשת החלפה של עצמך",
    "Only published swap requests can be approved":
        "ניתן לאשר מועמד רק עבור בקשה שפורסמה לבורסה",
    "Applicant not found or already processed": "המועמד לא נמצא או שכבר טופל",
    "Applicant employee code is required": "נדרש קוד עובד עבור המועמד",
    "Invalid ID format": "מזהה בקשה אינו תקין",
};

export function translateServerError(errorMessage: string): string {
    if (!errorMessage) return "";

    const trimmed = errorMessage.trim();

    // Exact match
    if (exactTranslations[trimmed]) {
        return exactTranslations[trimmed];
    }

    // Dynamic pattern matches
    if (trimmed.startsWith("Unit '") && trimmed.endsWith("' already exists")) {
        return "כבר קיימת יחידה בשם זה במערכת";
    }

    if (trimmed.includes("already exists")) {
        return "רשומה זו כבר קיימת במערכת";
    }

    if (trimmed.includes("not found")) {
        return "הרשומה המבוקשת לא נמצאה";
    }

    return trimmed;
}
