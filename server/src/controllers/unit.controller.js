import { unitsRepo, usersRepo } from "../repositories/index.js";
import { unitsService } from "../services/units.service.js";
import { throwHttpError } from "../utils/errors.js";

export const unitController = {
    async getAllUnits(_req, res) {
        const units = await unitsRepo.getAllDocs();
        res.json({ success: true, data: units });
    },

    async createUnit(req, res) {
        const { name } = req.body;
        const existing = await unitsRepo.getDocByField("name", name);
        unitsService.validateExistingUnit(name, existing);
        const unit = await unitsRepo.createDoc({ name });
        res.status(201).json({ success: true, data: { unit } });
    },

    async updateUnit(req, res) {
        const { name } = req.params;
        const currentUnit = await unitsRepo.getDocByField("name", name);
        if (!currentUnit) throwHttpError(404, "Unit not found");

        const newName = req.body.name;
        const existingTarget = await unitsRepo.getDocByField("name", newName);

        const updateData = unitsService.updateUnit(
            name,
            newName,
            existingTarget,
        );
        const updated = await unitsRepo.updateDoc("name", name, updateData);
        res.json({ success: true, data: { unit: updated } });
    },

    async deleteUnit(req, res) {
        const { name } = req.params;
        const unit = await unitsRepo.getDocByField("name", name);
        const userCount = await usersRepo.countDocs({ unit_name: name });

        unitsService.deleteUnit(unit, userCount);
        await unitsRepo.deleteDoc("name", name);
        res.json({ success: true, deleted: name });
    },
};
