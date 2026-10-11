import { usersRepo } from "../repositories/index.js";
import { usersService } from "../services/users.service.js";
import { throwHttpError } from "../utils/errors.js";

export const userController = {
    async getAllUsers(req, res) {
        const { unitName, role } = req.query;
        const filter = {};
        if (unitName) filter.unit_name = unitName;
        if (role) filter.role = role;

        const users = await usersRepo.getAllDocs(filter);
        const safeUsers = users.map(
            ({ password_hash, password, ...rest }) => rest,
        );
        res.json({ success: true, data: safeUsers });
    },

    async createUser(req, res) {
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

        const updates = await usersService.updateSelf(currentUser, req.body);
        const updated = await usersRepo.updateDoc(
            "employee_code",
            employeeCode,
            updates,
        );
        const { password_hash, password, ...safeUser } = updated;
        res.json({ success: true, data: safeUser });
    },

    async updateUser(req, res) {
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
        res.json({ success: true, data: safeUser });
    },

    async deleteUser(req, res) {
        const { employeeCode } = req.params;
        const userRecord = await usersRepo.getDocByField(
            "employee_code",
            employeeCode,
        );
        if (!userRecord) throwHttpError(404, "User not found");

        const shiftWeek = await shiftWeeksRepo.findOne({
            "shifts.assignedEmployeeCode": employeeCode,
        });

        const activeSwap = await swapRequestsRepo.findOne({
            requesterEmployeeCode: employeeCode,
            status: {
                $in: ["pending_manager_publish", "published_to_board"],
            },
        });

        usersService.deleteUser(userRecord, {
            hasActiveShifts: Boolean(shiftWeek),
            hasActiveSwaps: Boolean(activeSwap),
        });

        await usersRepo.deleteDoc("employee_code", employeeCode);
        res.json({ success: true, deleted: employeeCode });
    },

    async replaceManager(req, res) {
        const { employeeCode } = req.params;
        const currentManager = await usersRepo.getDocByField(
            "employee_code",
            employeeCode,
        );
        if (!currentManager) {
            throwHttpError(404, "Current manager not found");
        }

        const { oldEmployeeCode, newManagerDoc } =
            await usersService.replaceManager(currentManager, req.body);

        await usersRepo.deleteDoc("employee_code", oldEmployeeCode);
        const created = await usersRepo.createDoc(newManagerDoc);

        const { password_hash, password, ...safeManager } = created;
        res.json({
            success: true,
            data: {
                replacedEmployeeCode: oldEmployeeCode,
                newManager: safeManager,
            },
        });
    },
};
