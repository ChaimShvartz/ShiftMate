import { Router } from "express";
import { setupController } from "../controllers/setup.controller.js";
import { validate } from "../middlewares/validate.js";
import { initAdminSchema } from "../models/user.schema.js";

const router = Router();

router.get("/status", setupController.getStatus);
router.post("/init", validate(initAdminSchema), setupController.init);

export default router;
