import { throwHttpError } from "../utils/errors.js";

export const unitsService = {
    createUnit(name, existingUnit) {
        const trimmedName =
            typeof name === "string" ? name.trim() : name?.name?.trim() || "";

        if (existingUnit) {
            throwHttpError(409, `Unit '${trimmedName}' already exists`);
        }

        return { name: trimmedName };
    },

    updateUnit(oldName, newName, existingTargetUnit) {
        const trimmedName =
            typeof newName === "string"
                ? newName.trim()
                : newName?.name?.trim() || "";

        if (trimmedName === oldName) {
            return { name: trimmedName };
        }

        if (existingTargetUnit) {
            throwHttpError(409, `Unit '${trimmedName}' already exists`);
        }

        return { name: trimmedName };
    },

    deleteUnit(unitRecord, userCountInUnit = 0) {
        if (!unitRecord) {
            throwHttpError(404, "Unit not found");
        }

        if (userCountInUnit > 0) {
            throwHttpError(409, "Cannot delete unit with active members");
        }

        return true;
    },
};
