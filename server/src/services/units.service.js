import { throwHttpError } from "../utils/errors.js";

export const unitsService = {
    validateExistingUnit(name, existingUnit) {
        if (existingUnit) {
            throwHttpError(409, `Unit '${name}' already exists`);
        }
    },

    updateUnit(oldName, newName, existingTargetUnit) {
        if (newName === oldName) {
            return { name: newName };
        }

        if (existingTargetUnit) {
            throwHttpError(409, `Unit '${newName}' already exists`);
        }

        return { name: newName };
    },

    deleteUnit(unitRecord, userCountInUnit = 0) {
        if (!unitRecord) {
            throwHttpError(404, "Unit not found");
        }

        if (userCountInUnit > 0) {
            throwHttpError(400, "Cannot delete unit with active members");
        }

        return true;
    },
};
