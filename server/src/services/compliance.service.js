const HOUR = 1000 * 60 * 60;
const MIN_REST_HOURS = 8;
const MAX_MINOR_OVERTIME = 4;
const round = (n) => Number(n.toFixed(1));

// status: ok (green) | warning (yellow) | violation (red)
// reason: ok | overtime_minor | overlap | rest | overtime_major
export const complianceService = {
    checkLaborRules({
        targetShift,
        employeeExistingShifts = [],
        maxWeeklyHours,
    }) {
        const limit = maxWeeklyHours || 40;

        if (!targetShift) {
            return {
                status: "ok",
                reason: "ok",
                minRestHours: null,
                totalWeeklyHours: 0,
                overtime: 0,
                maxWeeklyHours: limit,
            };
        }

        const targetStart = new Date(targetShift.startTime).getTime();
        const targetEnd = new Date(targetShift.endTime).getTime();

        let minRestHours = Infinity;
        let hasOverlap = false;
        let existingHours = 0;

        for (const shift of employeeExistingShifts) {
            if (String(shift.id) === String(targetShift.id)) continue;

            const start = new Date(shift.startTime).getTime();
            const end = new Date(shift.endTime).getTime();
            existingHours += (end - start) / HOUR;

            if (targetStart < end && targetEnd > start) {
                hasOverlap = true;
                minRestHours = 0;
            } else if (end <= targetStart) {
                minRestHours = Math.min(minRestHours, (targetStart - end) / HOUR);
            } else if (start >= targetEnd) {
                minRestHours = Math.min(minRestHours, (start - targetEnd) / HOUR);
            }
        }

        const totalWeeklyHours = existingHours + (targetEnd - targetStart) / HOUR;
        const overtime = Math.max(0, totalWeeklyHours - limit);

        let status = "ok";
        let reason = "ok";
        if (hasOverlap) [status, reason] = ["violation", "overlap"];
        else if (minRestHours < MIN_REST_HOURS) [status, reason] = ["violation", "rest"];
        else if (overtime > MAX_MINOR_OVERTIME) [status, reason] = ["violation", "overtime_major"];
        else if (overtime > 0) [status, reason] = ["warning", "overtime_minor"];

        return {
            status,
            reason,
            minRestHours: minRestHours === Infinity ? null : round(minRestHours),
            totalWeeklyHours: round(totalWeeklyHours),
            overtime: round(overtime),
            maxWeeklyHours: limit,
        };
    },
};
