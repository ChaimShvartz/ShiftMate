import { usersRepo } from "../repositories/index.js";

export const setupController = {
  async getStatus(_req, res) {
    const admin = await usersRepo.getDocByField("role", "admin");
    res.json({ initialized: Boolean(admin) });
  },

  async init(req, res) {
    const existingAdmin = await usersRepo.getDocByField("role", "admin");

    const adminRecord = await usersService.createUser(req.body, {
      existingAdmin: Boolean(existingAdmin),
    });

    await usersRepo.createDoc(adminRecord);
    res
      .status(201)
      .json({ success: true, data: publishUser({ user: adminRecord }) });
  },
};
