export const complianceService = {
    checkLaborRules({
        targetShift,
        employeeExistingShifts = [],
        maxWeeklyHours = 40,
    }) {
        if (!targetShift) {
            return {
                status: "ok",
                details: "No target shift specified",
                minRestHours: 24,
                totalWeeklyHours: 0,
                overtime: 0,
            };
        }

        const targetStart = new Date(targetShift.startTime).getTime();
        const targetEnd = new Date(targetShift.endTime).getTime();
        const targetDurationHours =
            (targetEnd - targetStart) / (1000 * 60 * 60);

        let minRestHours = Infinity;
        let hasOverlap = false;
        let existingHours = 0;

        for (const shift of employeeExistingShifts) {
            if (String(shift.id) === String(targetShift.id)) continue;

            const shiftStart = new Date(shift.startTime).getTime();
            const shiftEnd = new Date(shift.endTime).getTime();
            const duration = (shiftEnd - shiftStart) / (1000 * 60 * 60);
            existingHours += duration;

            if (targetStart < shiftEnd && targetEnd > shiftStart) {
                hasOverlap = true;
                minRestHours = 0;
                continue;
            }

            if (shiftEnd <= targetStart) {
                const rest = (targetStart - shiftEnd) / (1000 * 60 * 60);
                if (rest < minRestHours) minRestHours = rest;
            }

            if (shiftStart >= targetEnd) {
                const rest = (shiftStart - targetEnd) / (1000 * 60 * 60);
                if (rest < minRestHours) minRestHours = rest;
            }
        }

        const totalWeeklyHours = existingHours + targetDurationHours;
        const overtime = Math.max(0, totalWeeklyHours - maxWeeklyHours);

        if (hasOverlap) {
            return {
                status: "violation",
                details:
                    "Shift overlap: employee already has an assigned shift during these hours",
                minRestHours: 0,
                totalWeeklyHours,
                overtime,
            };
        }

        if (minRestHours < 8) {
            return {
                status: "violation",
                details: `Less than 8 hours rest between shifts (${minRestHours.toFixed(1)} hours rest)`,
                minRestHours: Number(minRestHours.toFixed(1)),
                totalWeeklyHours: Number(totalWeeklyHours.toFixed(1)),
                overtime: Number(overtime.toFixed(1)),
            };
        }

        if (overtime > 4) {
            return {
                status: "violation",
                details: `Weekly hours exceeded by more than 4 hours (${totalWeeklyHours.toFixed(1)} / ${maxWeeklyHours} hours)`,
                minRestHours: Number(minRestHours.toFixed(1)),
                totalWeeklyHours: Number(totalWeeklyHours.toFixed(1)),
                overtime: Number(overtime.toFixed(1)),
            };
        }

        if (overtime > 0 && overtime <= 4) {
            return {
                status: "warning",
                details: `Minor weekly hours overtime (${totalWeeklyHours.toFixed(1)} / ${maxWeeklyHours} hours)`,
                minRestHours:
                    minRestHours === Infinity
                        ? 24
                        : Number(minRestHours.toFixed(1)),
                totalWeeklyHours: Number(totalWeeklyHours.toFixed(1)),
                overtime: Number(overtime.toFixed(1)),
            };
        }

        return {
            status: "ok",
            details:
                "Compliant with labor rules (8+ hours rest, within weekly limit)",
            minRestHours:
                minRestHours === Infinity
                    ? 24
                    : Number(minRestHours.toFixed(1)),
            totalWeeklyHours: Number(totalWeeklyHours.toFixed(1)),
            overtime: 0,
        };
    },
};
