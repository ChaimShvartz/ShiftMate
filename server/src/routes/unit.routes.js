import { Router } from "express";
import { unitController } from "../controllers/unit.controller.js";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createUnitSchema, updateUnitSchema } from "../models/unit.schema.js";

const router = Router();

router.use(authenticate, authorizeRole("admin"));

router.get("/", unitController.getAllUnits);
router.post("/", validate(createUnitSchema), unitController.createUnit);
router.patch("/:name", validate(updateUnitSchema), unitController.updateUnit);
router.delete("/:name", unitController.deleteUnit);

export default router;
