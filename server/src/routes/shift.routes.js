import express, { Router } from "express";
import { shiftController } from "../controllers/shift.controller.js";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createShiftSchema, updateShiftSchema } from "../models/shift.schema.js";

const router = Router();

router.use(authenticate);

router.get(
    "/import/template",
    authorizeRole("manager"),
    shiftController.getImportTemplate,
);

router.post(
    "/import",
    authorizeRole("manager"),
    express.raw({
        type: [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream",
            "*/*",
        ],
        limit: "10mb",
    }),
    shiftController.importShifts,
);

router.get(
    "/",
    authorizeRole("manager", "employee"),
    shiftController.getShifts,
);

router.post(
    "/:weekNumber",
    authorizeRole("manager"),
    validate(createShiftSchema),
    shiftController.createShift,
);

router.patch(
    "/:weekNumber/:shiftId",
    authorizeRole("manager"),
    validate(updateShiftSchema),
    shiftController.updateShift,
);

router.delete(
    "/:weekNumber/:shiftId",
    authorizeRole("manager"),
    shiftController.deleteShift,
);

export default router;
