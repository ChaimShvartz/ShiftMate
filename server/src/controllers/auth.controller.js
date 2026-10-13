import { usersRepo } from "../repositories/index.js";
import { authService } from "../services/auth.service.js";

export const authController = {
    async login(req, res) {
        const { employeeCode: identifier, password } = req.body;

        let userRecord;
        if (identifier.includes("@")) {
            const byEmail = await usersRepo.getDocByField(
                "email",
                identifier.toLowerCase(),
            );
            // Employees must sign in with their code (spec 4.1).
            userRecord = byEmail?.role === "employee" ? null : byEmail;
        } else {
            userRecord = await usersRepo.getDocByField("employee_code", identifier);
        }

        const result = await authService.authenticateUser(userRecord, password);
        res.json({ success: true, data: result });
    },
};
