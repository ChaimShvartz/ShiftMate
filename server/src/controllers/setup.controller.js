import { usersRepo } from "../repositories/index.js";
import { usersService } from "../services/users.service.js";

export const setupController = {
    async getStatus(_req, res) {
        const admin = await usersRepo.getDocByField("role", "admin");
        res.json({ success: true, data: { initialized: Boolean(admin) } });
    },

    async init(req, res) {
        const existingAdmin = await usersRepo.getDocByField("role", "admin");

        const adminRecord = await usersService.createUser(
            { ...req.body, role: "admin" },
            {
                existingAdmin: Boolean(existingAdmin),
            },
        );

        const created = await usersRepo.createDoc(adminRecord);
        const { password_hash, password, ...safeAdmin } =
            created || adminRecord;

        res.status(201).json({
            success: true,
            data: safeAdmin,
        });
    },
};
