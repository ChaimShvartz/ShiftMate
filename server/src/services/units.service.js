import { createUnitSchema, updateUnitSchema } from "../models/unit.schema.js";
import { throwHttpError } from "../utils/errors.js";

export const unitsService = {
    prepareCreate(inputData, existingUnit) {
        const payload =
            typeof inputData === "string" ? { name: inputData } : inputData;
        const parsed = createUnitSchema.parse(payload);

        if (existingUnit) {
            throwHttpError(409, `Unit '${parsed.name}' already exists`);
        }

        return { name: parsed.name };
    },

    prepareUpdate(oldName, inputData, existingTargetUnit) {
        const payload =
            typeof inputData === "string" ? { name: inputData } : inputData;
        const parsed = updateUnitSchema.parse(payload);

        if (parsed.name === oldName) {
            return { name: parsed.name };
        }

        if (existingTargetUnit) {
            throwHttpError(409, `Unit '${parsed.name}' already exists`);
        }

        return { name: parsed.name };
    },

    validateDelete(unitRecord, userCountInUnit = 0) {
        if (!unitRecord) {
            throwHttpError(404, "Unit not found");
        }

        if (userCountInUnit > 0) {
            throwHttpError(409, "Cannot delete unit with active members");
        }

        return true;
    },
};

unitsService.validateCreate = unitsService.prepareCreate;
unitsService.validateUpdate = unitsService.prepareUpdate;
