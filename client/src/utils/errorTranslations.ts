// Every message the server (or the network layer) can produce is translated
// here. Nothing English is ever shown to the user: unknown messages fall back
// to a Hebrew message chosen by HTTP status.
const exact: Record<string, string> = {
    // Auth
    "Invalid credentials": "קוד העובד / האימייל או הסיסמה שגויים",
    "Authentication required": "נדרשת התחברות למערכת",
    "Authentication required - Missing token": "נדרשת התחברות למערכת",
    "Authentication required - Invalid or expired token":
        "פג תוקף ההתחברות, יש להתחבר מחדש",
    "Invalid or expired token": "פג תוקף ההתחברות, יש להתחבר מחדש",
    "Authorization required - Insufficient permissions":
        "אין לך הרשאה לבצע פעולה זו",
    Unauthorized: "אין לך הרשאה לבצע פעולה זו",
    Forbidden: "הגישה נדחתה עקב היעדר הרשאות",
    "Enter a 6-digit employee code or an email address":
        "יש להזין קוד עובד בן 6 ספרות או כתובת אימייל",
    "Password is required": "יש להזין סיסמה",

    // Users
    "User not found": "המשתמש לא נמצא",
    "Employee not found": "העובד לא נמצא",
    "Current manager not found": "המנהל הנוכחי לא נמצא",
    "The specified user to replace is not a manager":
        "המשתמש שנבחר להחלפה אינו מנהל יחידה",
    "Admin already exists": "מנהל ראשי כבר קיים במערכת",
    "System is already initialized": "המערכת כבר אותחלה בעבר",
    "Email address is already in use": "כתובת האימייל כבר קיימת במערכת",
    "Record already exists": "הרשומה כבר קיימת במערכת",
    "Cannot delete employee with active shifts":
        "לא ניתן למחוק עובד שעדיין משובץ למשמרות — על מנהל היחידה להסיר אותו מהשיבוץ תחילה",
    "Invalid email format": "כתובת האימייל אינה תקינה",
    "Admin cannot be assigned to a unit": "מנהל ראשי אינו משויך ליחידה",
    "Admin cannot have max weekly hours": "למנהל ראשי אין מגבלת שעות שבועית",
    "Manager cannot have max weekly hours": "למנהל יחידה אין מגבלת שעות שבועית",
    "Unit name is required for employee": "יש לבחור יחידה עבור העובד",
    "Unit name is required for manager": "יש לבחור יחידה עבור המנהל",
    "Max weekly hours must be positive": "מגבלת השעות חייבת להיות מספר חיובי",
    "Max weekly hours cannot exceed 100": "מגבלת השעות לא יכולה לעלות על 100",
    "Full name must be at least 2 characters": "השם המלא חייב להכיל לפחות 2 תווים",
    "Phone must be at least 6 characters": "מספר הטלפון קצר מדי",
    "Password must be at least 6 characters": "הסיסמה חייבת להכיל לפחות 6 תווים",

    // Units
    "Unit not found": "היחידה לא נמצאה",
    "Unit name is required": "יש להזין שם יחידה",
    "Cannot delete unit with active members":
        "לא ניתן למחוק יחידה שיש בה עובדים או מנהל — יש לפנות אותה תחילה",

    // Shifts & Excel
    "File is not a valid Excel (.xlsx) file": "הקובץ אינו קובץ אקסל (.xlsx) תקין",
    "File is empty": "קובץ האקסל ריק",
    "File is empty or contains only the example row":
        "הקובץ ריק או שמכיל רק את שורת הדוגמה",
    "Please upload a valid Excel file": "יש להעלות קובץ אקסל תקין",
    "Excel schedules can only be uploaded on Thursdays":
        "ניתן להעלות לוח משמרות ביום חמישי בלבד",
    "A schedule has already been uploaded for this week. Only one upload per Thursday is allowed.":
        "כבר הועלה לוח משמרות לשבוע זה — ניתן להעלות קובץ חדש רק שבוע לאחר ההעלאה האחרונה. לשינוי נקודתי השתמשו בעריכה הידנית",
    "Shift not found": "המשמרת לא נמצאה",
    "Week not found": "שבוע המשמרות לא נמצא",
    "Shift week not found": "שבוע המשמרות לא נמצא",
    "End time must be after start time": "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
    "Shift end time must be after start time":
        "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
    "Employee does not belong to this unit": "העובד אינו משויך ליחידה זו",
    "Shift overlap: Employee already has an assigned shift during these hours":
        "חפיפת משמרות: לעובד כבר יש משמרת בשעות אלה",

    // Swaps
    "Swap request not found": "בקשת ההחלפה לא נמצאה",
    "Shift is already in a swap process": "המשמרת כבר נמצאת בתהליך החלפה",
    "Shift has already started": "לא ניתן לבקש החלפה למשמרת שכבר התחילה",
    "You can only request a swap for your own assigned shift":
        "ניתן לבקש החלפה רק עבור משמרת שמשובצת אליך",
    "Reason is required": "יש לציין סיבה לבקשת ההחלפה",
    "Cannot apply for your own swap request":
        "לא ניתן להגיש מועמדות לבקשת ההחלפה של עצמך",
    "You have already applied for this swap request":
        "כבר הגשת מועמדות לבקשה זו",
    "This swap request is not open for applications":
        "הבקשה אינה פתוחה להגשת מועמדות",
    "You can only apply for swaps within your unit":
        "ניתן להגיש מועמדות רק לבקשות ביחידה שלך",
    "Only pending requests can be published to the board":
        "ניתן לפרסם לבורסה רק בקשה שממתינה לאישור",
    "Only pending requests can be rejected":
        "ניתן לדחות רק בקשה שממתינה לאישור",
    "Only published swap requests can be approved":
        "ניתן לאשר מועמד רק בבקשה שפורסמה בבורסה",
    "Only published swap requests can have applicants rejected":
        "ניתן לדחות מועמדים רק בבקשה שפורסמה בבורסה",
    "Applicant not found or already processed":
        "המועמד לא נמצא או שכבר טופל",
    "Applicant employee code is required": "נדרש קוד עובד של המועמד",
    "Shift is no longer assigned to the requester":
        "המשמרת כבר אינה משובצת לעובד שביקש החלפה",
    "Cannot approve applicant - labor rules violation":
        "לא ניתן לאשר את המועמד — קיימת חריגה מחוקי העבודה",
    "Not authorized to manage swap requests for another unit":
        "אין הרשאה לנהל בקשות של יחידה אחרת",
    "Not authorized to approve swaps for another unit":
        "אין הרשאה לאשר בקשות של יחידה אחרת",
    "Not authorized to reject applicants for another unit":
        "אין הרשאה לדחות מועמדים של יחידה אחרת",
    "Not authorized to view another unit": "אין הרשאה לצפות ביחידה אחרת",
    "Invalid ID format": "מזהה הבקשה אינו תקין",

    // Generic
    "Validation failed": "הנתונים שהוזנו אינם תקינים",
    "Path not found": "הכתובת המבוקשת לא נמצאה",
    "Internal Server Error": "אירעה שגיאה בשרת, נסו שוב מאוחר יותר",
    "Network Error": "אין חיבור לשרת — בדקו את החיבור לאינטרנט ונסו שוב",
};

const statusFallback: Record<number, string> = {
    400: "הנתונים שהוזנו אינם תקינים",
    401: "נדרשת התחברות מחדש",
    403: "אין לך הרשאה לבצע פעולה זו",
    404: "הפריט המבוקש לא נמצא",
    409: "הפעולה מתנגשת עם מצב קיים במערכת",
    413: "הקובץ גדול מדי",
    422: "לא ניתן לבצע את הפעולה",
    429: "יותר מדי ניסיונות, נסו שוב בעוד רגע",
};

const HAS_LATIN = /[A-Za-z]/;

// Patterns for dynamic messages (zod defaults, row errors, interpolated names).
const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^Unit '(.+)' already exists$/, (m) => `היחידה "${m[1]}" כבר קיימת במערכת`],
    [
        /^Unit '(.+)' already has an active manager$/,
        (m) => `ליחידה "${m[1]}" כבר יש מנהל פעיל — השתמשו ב"החלף מנהל"`,
    ],
    [/^File rejected, (\d+) invalid row\(s\)$/, (m) => `הקובץ נדחה — נמצאו ${m[1]} שורות שגויות`],
    [/^Missing or renamed columns: (.+)$/, (m) => `עמודות חסרות או ששמן שונה: ${m[1]}`],
    [/^Employee (.+) does not exist in this unit$/, (m) => `העובד "${m[1]}" אינו קיים ביחידה`],
    [/^Employee is missing or invalid$/, () => "עובד חסר או לא תקין"],
    [/^Date is missing or invalid.*$/, () => "תאריך חסר או לא תקין (נדרש yyyy-mm-dd)"],
    [/^Start time is missing or invalid.*$/, () => "שעת התחלה חסרה או לא תקינה (נדרש HH:mm)"],
    [/^End time is missing or invalid.*$/, () => "שעת סיום חסרה או לא תקינה (נדרש HH:mm)"],
    [/^Shift overlaps with row (\d+) \(employee (\d+)\)$/, (m) => `חפיפת משמרות עם שורה ${m[1]} (עובד ${m[2]})`],
    [/^Too small: expected string to have >=(\d+) characters?$/, (m) => `הערך קצר מדי (לפחות ${m[1]} תווים)`],
    [/^Too big: expected string to have <=(\d+) characters?$/, (m) => `הערך ארוך מדי (עד ${m[1]} תווים)`],
    [/^Too small: expected number to be >.*$/, () => "הערך קטן מדי"],
    [/^Too big: expected number to be <.*$/, () => "הערך גדול מדי"],
    [/^Invalid input.*$/, () => "הנתונים שהוזנו אינם תקינים"],
    [/^Invalid (string|number|enum value).*$/, () => "הנתונים שהוזנו אינם תקינים"],
    [/^.*(already exists)$/, () => "הרשומה כבר קיימת במערכת"],
    [/^.*not found$/, () => "הפריט המבוקש לא נמצא"],
];

export function translateServerError(message: string, status?: number): string {
    const text = (message ?? "").trim();
    if (!text) return (status && statusFallback[status]) || "";
    if (exact[text]) return exact[text];
    for (const [re, fn] of patterns) {
        const m = text.match(re);
        if (m) return fn(m);
    }
    if (!HAS_LATIN.test(text)) return text; // already Hebrew
    return (status && statusFallback[status]) || "אירעה שגיאה, נסו שוב";
}
