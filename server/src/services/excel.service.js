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

        const widths = [30, 18, 18, 18, 30];
        sheet.columns = HEADERS.map((header, i) => ({
            header,
            width: widths[i],
        }));
        sheet.getRow(1).font = { bold: true };

        const listSheet = workbook.addWorksheet(EMPLOYEES_SHEET, {
            state: "hidden",
        });
        employees.forEach((emp, i) => {
            listSheet.getCell(i + 1, 1).value =
                `${emp.full_name} – ${emp.employee_code}`;
        });
        const listRange = `${EMPLOYEES_SHEET}!$A$1:$A$${Math.max(employees.length, 1)}`;

        for (let r = 2; r <= MAX_ROWS + 1; r++) {
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
        }

        const thin = { style: "thin", color: { argb: "FF808080" } };
        for (let r = 1; r <= MAX_ROWS + 1; r++) {
            sheet.getRow(r).height = 24;
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
            rows.push({ rowNumber: r, employee, date, start, end, title });
        }

        if (!rows.length) throwHttpError(400, "File is empty");
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
