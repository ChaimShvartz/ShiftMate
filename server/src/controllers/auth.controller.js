import { usersRepo } from "../repositories/index.js";
import { authService } from "../services/auth.service.js";

export const authController = {
    async login(req, res) {
        const { employeeCode, password } = req.body;

        const userRecord = await usersRepo.getDocByField(
            "employee_code",
            employeeCode,
        );

        const result = await authService.authenticateUser(userRecord, password);

        res.json({ success: true, data: result });
    },
};
