import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  updateMeSchema,
} from "../models/user.schema.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizeRole("admin", "superadmin"),
  userController.getAllUsers,
);

router.post(
  "/",
  authorizeRole("admin", "superadmin"),
  validate(createUserSchema),
  userController.createUser,
);

router.put(
  "/:employeeCode/replace",
  authorizeRole("admin", "superadmin"),
  userController.replaceManager,
);

router.patch(
  "/me",
  authorizeRole("manager", "employee", "admin", "superadmin"),
  validate(updateMeSchema),
  userController.updateMe,
);

router.patch(
  "/:employeeCode",
  authorizeRole("admin", "superadmin"),
  validate(updateUserSchema),
  userController.updateUser,
);

router.delete(
  "/:employeeCode",
  authorizeRole("admin", "superadmin"),
  userController.deleteUser,
);

export default router;
