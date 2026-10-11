import { createUnitSchema, updateUnitSchema } from "../models/unit.schema.js";

export const unitsService = {
    prepareCreate(inputData, existingUnit) {
        const payload =
            typeof inputData === "string" ? { name: inputData } : inputData;
        const parsed = createUnitSchema.parse(payload);

        if (existingUnit) {
            const err = new Error(`Unit '${parsed.name}' already exists`);
            err.status = 409;
            throw err;
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
            const err = new Error(`Unit '${parsed.name}' already exists`);
            err.status = 409;
            throw err;
        }

        return { name: parsed.name };
    },

    validateDelete(unitRecord, userCountInUnit = 0) {
        if (!unitRecord) {
            const err = new Error("Unit not found");
            err.status = 404;
            throw err;
        }

        if (userCountInUnit > 0) {
            const err = new Error("Cannot delete unit with active members");
            err.status = 409;
            throw err;
        }

        return true;
    },
};

unitsService.validateCreate = unitsService.prepareCreate;
unitsService.validateUpdate = unitsService.prepareUpdate;
