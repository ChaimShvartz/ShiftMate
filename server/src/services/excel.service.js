import ExcelJS from "exceljs";
import { shiftImportRowSchema } from "../models/shift.schema.js";
import { throwHttpError } from "../utils/errors.js";
import { cellDate, cellTime, plain } from "../utils/import.js";

const SHIFTS_SHEET = "משמרות";
const EMPLOYEES_SHEET = "Employees";
const MAX_ROWS = 200;
const HEADERS = ["עובד", "תאריך", "תחילת משמרת", "סיום משמרת", "תיאור משמרת"];

export const excelService = {
    async buildTemplate(employees) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(SHIFTS_SHEET, {
            views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
        });

        const widths = [30, 18, 18, 18, 32];
        sheet.columns = HEADERS.map((header, i) => ({
            header,
            width: widths[i],
        }));

        // Header Row (Row 1)
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2563EB" },
        };
        headerRow.height = 28;

        const listSheet = workbook.addWorksheet(EMPLOYEES_SHEET, {
            state: "hidden",
        });
        employees.forEach((emp, i) => {
            listSheet.getCell(i + 1, 1).value =
                `${emp.full_name} – ${emp.employee_code}`;
        });
        const listRange = `${EMPLOYEES_SHEET}!$A$1:$A$${Math.max(employees.length, 1)}`;

        // Example Row (Row 2) - Non-editable sample format
        const exampleEmp =
            employees.length > 0
                ? `${employees[0].full_name} – ${employees[0].employee_code}`
                : "ישראל ישראלי – 101002";

        const exampleRow = sheet.getRow(2);
        exampleRow.values = [
            exampleEmp,
            "2026-10-18",
            "08:00",
            "16:00",
            "משמרת בוקר (דוגמה - שורה נעולה)",
        ];
        exampleRow.font = { italic: true, color: { argb: "FF475569" } };
        exampleRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
        };
        exampleRow.height = 24;

        // Lock row 1 and row 2
        for (let c = 1; c <= HEADERS.length; c++) {
            sheet.getCell(1, c).protection = { locked: true };
            sheet.getCell(2, c).protection = { locked: true };
        }

        // Editable data rows (Row 3+)
        for (let r = 3; r <= MAX_ROWS + 2; r++) {
            sheet.getCell(r, 1).dataValidation = {
                type: "list",
                allowBlank: true,
                formulae: [listRange],
                showErrorMessage: true,
                errorTitle: "עובד לא תקין",
                error: "יש לבחור עובד מהרשימה",
            };
            sheet.getCell(r, 2).numFmt = "yyyy-mm-dd";
            sheet.getCell(r, 3).numFmt = "@";
            sheet.getCell(r, 4).numFmt = "@";

            for (let c = 1; c <= HEADERS.length; c++) {
                sheet.getCell(r, c).protection = { locked: false };
            }
        }

        const thin = { style: "thin", color: { argb: "FFCBD5E1" } };
        for (let r = 1; r <= MAX_ROWS + 2; r++) {
            const row = sheet.getRow(r);
            if (r > 2) row.height = 24;
            for (let c = 1; c <= sheet.columns.length; c++) {
                const cell = sheet.getCell(r, c);
                cell.border = {
                    top: thin,
                    bottom: thin,
                    left: thin,
                    right: thin,
                };
                cell.alignment = { vertical: "middle", horizontal: "center" };
            }
        }

        await sheet.protect("", {
            selectLockedCells: true,
            selectUnlockedCells: true,
        });

        return workbook.xlsx.writeBuffer();
    },

    async parseShiftsFile(buffer) {
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(buffer);
        } catch {
            throwHttpError(400, "File is not a valid Excel (.xlsx) file");
        }

        const sheet =
            workbook.getWorksheet(SHIFTS_SHEET) ?? workbook.worksheets[0];
        if (!sheet) throwHttpError(400, "File is empty");

        const missing = HEADERS.filter(
            (h, i) => String(plain(sheet.getCell(1, i + 1).value)) !== h,
        );
        if (missing.length) {
            throwHttpError(
                400,
                `Missing or renamed columns: ${missing.join(", ")}`,
            );
        }

        const rows = [];
        for (let r = 2; r <= sheet.rowCount; r++) {
            const values = HEADERS.map((_, i) =>
                plain(sheet.getCell(r, i + 1).value),
            );
            if (values.every((v) => v === "")) continue;
            const [employee, date, start, end, title] = values;

            // Skip example row if present
            const isExampleRow =
                r === 2 &&
                (String(title).includes("דוגמה") ||
                    String(title).includes("example") ||
                    String(title).includes("שורה נעולה"));

            if (isExampleRow) {
                continue;
            }

            rows.push({ rowNumber: r, employee, date, start, end, title });
        }

        if (!rows.length)
            throwHttpError(
                400,
                "File is empty or contains only the example row",
            );
        return rows;
    },

    validateShiftRows(rows, unitEmployees) {
        const schema = shiftImportRowSchema(
            new Set(unitEmployees.map((e) => e.employee_code)),
        );
        const errors = [];
        const shifts = [];
        const byEmployee = new Map();

        for (const row of rows) {
            const result = schema.safeParse({
                employee: String(row.employee),
                date: cellDate(row.date),
                start: cellTime(row.start),
                end: cellTime(row.end),
                title: String(row.title),
            });
            if (!result.success) {
                for (const issue of result.error.issues) {
                    errors.push({ row: row.rowNumber, message: issue.message });
                }
                continue;
            }

            const { employee, date, start, end, title } = result.data;
            const startTime = new Date(`${date}T${start}:00Z`);
            const endTime = new Date(`${date}T${end}:00Z`);

            const others = byEmployee.get(employee) ?? [];
            const clash = others.find(
                (o) => startTime < o.end && endTime > o.start,
            );
            if (clash) {
                errors.push({
                    row: row.rowNumber,
                    message: `Shift overlaps with row ${clash.row} (employee ${employee})`,
                });
                continue;
            }
            byEmployee.set(employee, [
                ...others,
                { start: startTime, end: endTime, row: row.rowNumber },
            ]);

            shifts.push({
                title,
                assignedEmployeeCode: employee,
                startTime,
                endTime,
            });
        }

        if (errors.length) {
            throwHttpError(
                400,
                `File rejected, ${errors.length} invalid row(s)`,
                errors,
            );
        }

        return shifts;
    },
};
