import { authService } from "../services/auth.service.js";
import { usersRepo } from "../repositories/index.js";
import { throwHttpError } from "../utils/errors.js";

export const authController = {
  async login(req, res) {
    const { employeeCode, password } = req.body;

    if (!password || !employeeCode) {
      throwHttpError(400, "Invalid credentials");
    }

    const userRecord = await usersRepo.getDocByField(
      "employee_code",
      employeeCode,
    );

    const result = await authService.authenticateUser(userRecord, password);

    res.json({ success: true, data: result });
  },
};
