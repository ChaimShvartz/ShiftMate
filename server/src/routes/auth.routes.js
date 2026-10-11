import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../models/user.schema.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);

export default router;
