import { usersService } from "../services/users.service.js";
import { usersRepo } from "../repositories/index.js";
import { shiftWeeksCol, swapRequestsCol } from "../db/index.js";
import { throwHttpError } from "../utils/errors.js";

export const userController = {
  async getAllUsers(req, res, next) {
    try {
      const { unitName, role } = req.query;
      const filter = {};
      if (unitName) filter.unit_name = unitName;
      if (role) filter.role = role;

      const users = await usersRepo.getAllDocs(filter);
      const safeUsers = users.map(
        ({ password_hash, password, ...rest }) => rest,
      );
      res.json(safeUsers);
    } catch (err) {
      next(err);
    }
  },

  async createUser(req, res, next) {
    try {
      const { unitName, email, role } = req.body;

      let existingManagerInUnit = null;
      if (role === "manager" && unitName) {
        const managers = await usersRepo.getAllDocs({
          unit_name: unitName,
          role: "manager",
        });
        existingManagerInUnit = managers.length > 0;
      }

      let existingEmailUser = null;
      if (email) {
        existingEmailUser = await usersRepo.getDocByField(
          "email",
          email.toLowerCase(),
        );
      }

      const userRecord = await usersService.createUser(req.body, {
        existingManagerInUnit,
        existingEmailUser,
      });

      const created = await usersRepo.createDoc(userRecord);
      const { password_hash, password, ...safeUser } = created;
      res.status(201).json(safeUser);
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req, res, next) {
    try {
      const employeeCode = req.user?.employeeCode;
      if (!employeeCode) throwHttpError(401, "Unauthorized");

      const currentUser = await usersRepo.getDocByField(
        "employee_code",
        employeeCode,
      );
      if (!currentUser) throwHttpError(404, "User not found");

      const updates = await usersService.updateSelf(currentUser, req.body);
      const updated = await usersRepo.updateDoc(
        "employee_code",
        employeeCode,
        updates,
      );
      const { password_hash, password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { employeeCode } = req.params;
      const existingUser = await usersRepo.getDocByField(
        "employee_code",
        employeeCode,
      );
      if (!existingUser) throwHttpError(404, "User not found");

      const updates = await usersService.updateUser(existingUser, req.body);
      const updated = await usersRepo.updateDoc(
        "employee_code",
        employeeCode,
        updates,
      );
      const { password_hash, password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { employeeCode } = req.params;
      const userRecord = await usersRepo.getDocByField(
        "employee_code",
        employeeCode,
      );
      if (!userRecord) throwHttpError(404, "User not found");

      let hasActiveShifts = false;
      let hasActiveSwaps = false;

      try {
        const shiftWeek = await shiftWeeksCol().findOne({
          "shifts.assignedEmployeeCode": employeeCode,
        });
        hasActiveShifts = Boolean(shiftWeek);

        const activeSwap = await swapRequestsCol().findOne({
          requesterEmployeeCode: employeeCode,
          status: { $in: ["pending_manager_publish", "published_to_board"] },
        });
        hasActiveSwaps = Boolean(activeSwap);
      } catch {
        // Mongo query safety
      }

      usersService.deleteUser(userRecord, {
        hasActiveShifts,
        hasActiveSwaps,
      });

      await usersRepo.deleteDoc("employee_code", employeeCode);
      res.json({ success: true, deleted: employeeCode });
    } catch (err) {
      next(err);
    }
  },

  async replaceManager(req, res, next) {
    try {
      const { employeeCode } = req.params;
      const currentManager = await usersRepo.getDocByField(
        "employee_code",
        employeeCode,
      );
      if (!currentManager) throwHttpError(404, "Current manager not found");

      const { oldEmployeeCode, newManagerDoc } =
        await usersService.replaceManager(currentManager, req.body);

      await usersRepo.deleteDoc("employee_code", oldEmployeeCode);
      const created = await usersRepo.createDoc(newManagerDoc);

      const { password_hash, password, ...safeManager } = created;
      res.json({
        replacedEmployeeCode: oldEmployeeCode,
        newManager: safeManager,
      });
    } catch (err) {
      next(err);
    }
  },
};
