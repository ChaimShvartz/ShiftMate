import { swapRequestsRepo, usersRepo } from "../repositories/index.js";
import { notify, unitMembers } from "./notifications.service.js";

// Closes every open swap tied to a shift that was deleted/reassigned by the
// manager (spec 8.2: closed_employee_removed) and tells the people involved.
export async function closeSwapsForShift({ unitName, weekNumber, shiftId }) {
    const open = await swapRequestsRepo.getAllDocs({
        unitName,
        weekNumber,
        shiftId: Number(shiftId),
        status: { $in: ["pending_manager_publish", "published_to_board"] },
    });
    if (!open.length) return;

    const members = await usersRepo.getAllDocs({ unit_name: unitName });
    const nameOf = (code) =>
        members.find((u) => u.employee_code === code)?.full_name || code;
    const everyone = await unitMembers(unitName, "employee");

    for (const swap of open) {
        await swapRequestsRepo.updateDoc(swap.id, {
            status: "closed_employee_removed",
        });

        const involved = [
            swap.requesterEmployeeCode,
            ...swap.applicants.map((a) => a.employeeCode),
        ];
        await notify({
            recipients: involved,
            unitName,
            type: "swap_cancelled",
            level: "warning",
            title: "בקשת החלפה בוטלה",
            message: `בקשת ההחלפה של ${nameOf(swap.requesterEmployeeCode)} בוטלה לאחר שהמשמרת עודכנה על ידי המנהל`,
            data: { swapId: swap.id },
        });
        if (swap.status === "published_to_board") {
            await notify({
                recipients: everyone.filter((c) => !involved.includes(c)),
                unitName,
                type: "board_request_closed",
                title: "הבקשה הוסרה מהבורסה",
                message: `בקשת ההחלפה של ${nameOf(swap.requesterEmployeeCode)} הוסרה מהבורסה`,
                data: { swapId: swap.id },
            });
        }
    }
}
