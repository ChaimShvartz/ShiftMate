import { shiftWeeksRepo, usersRepo } from "../repositories/index.js";
import { usersService } from "../services/users.service.js";
import { publishUser } from "../utils/auth.js";
import { throwHttpError } from "../utils/errors.js";

export const userController = {
  async getAllUsers(req, res) {
    const { unitName, role } = req.query;
    const filter = {};
    if (unitName) filter.unit_name = unitName;
    if (role) filter.role = role;

    const users = await usersRepo.getAllDocs(filter);
    const safeUsers = users.map(publishUser);
    res.json({ success: true, data: safeUsers });
  },

  async createUser(req, res) {
    const { unitName, email, role } = req.body;

    if (role === "admin") throwHttpError(409, "Admin already exists");

    let existingManagerInUnit = null;
    if (role === "manager" && unitName) {
      const managers = await usersRepo.getAllDocs({
        unit_name: unitName,
        role: "manager",
      });
      existingManagerInUnit = managers.length > 0;
    }

    const existingEmailUser = await usersRepo.getDocByField("email", email);

    const userRecord = await usersService.createUser(req.body, {
      existingManagerInUnit,
      existingEmailUser,
    });

    const created = await usersRepo.createDoc(userRecord);
    const safeUser = publishUser(created);
    res.status(201).json({ success: true, data: safeUser });
  },

  async updateMe(req, res) {
    const employeeCode = req.user?.employeeCode;
    if (!employeeCode) throwHttpError(401, "Unauthorized");

    const currentUser = await usersRepo.getDocByField(
      "employee_code",
      employeeCode,
    );
    if (!currentUser) throwHttpError(404, "User not found");

    const updated = await usersRepo.updateDoc(
      "employee_code",
      employeeCode,
      req.body,
    );
    const safeUser = publishUser(updated);
    res.json({ success: true, data: safeUser });
  },

  async updateUser(req, res) {
    const { employeeCode } = req.params;
    const existingUser = await usersRepo.getDocByField(
      "employee_code",
      employeeCode,
    );

    const updates = await usersService.updateUser(existingUser, req.body);
    const updated = await usersRepo.updateDoc(
      "employee_code",
      employeeCode,
      updates,
    );
    const safeUser = publishUser(updated);
    res.json({ success: true, data: safeUser });
  },

  async deleteUser(req, res) {
    const { employeeCode } = req.params;
    const userRecord = await usersRepo.getDocByField(
      "employee_code",
      employeeCode,
    );
    const shiftWeek = await shiftWeeksRepo.findOne({
      "shifts.assignedEmployeeCode": employeeCode,
    });

    usersService.deleteUser(userRecord, {
      hasActiveShifts: Boolean(shiftWeek),
    });

    await usersRepo.deleteDoc("employee_code", employeeCode);
    const deleted = { employeeCode, name: userRecord.full_name };
    res.json({ success: true, deleted });
  },

  async replaceManager(req, res) {
    const { employeeCode } = req.params;
    const currentManager = await usersRepo.getDocByField(
      "employee_code",
      employeeCode,
    );

    const { oldEmployeeCode, newManagerDoc } =
      await usersService.replaceManager(currentManager, req.body);

    await usersRepo.deleteDoc("employee_code", oldEmployeeCode);
    const created = await usersRepo.createDoc(newManagerDoc);

    const safeManager = publishUser(created);
    const replacedManager = { employeeCode, name: currentManager.full_name };

    res.json({
      success: true,
      data: {
        replacedManager,
        newManager: safeManager,
      },
    });
  },
};
