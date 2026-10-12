import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
    createUserSchema,
    updateMeSchema,
    updateUserSchema,
} from "../models/user.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRole("admin", "manager"), userController.getAllUsers);

router.post(
    "/",
    authorizeRole("admin"),
    validate(createUserSchema),
    userController.createUser,
);

router.put(
    "/:employeeCode/replace",
    authorizeRole("admin"),
    userController.replaceManager,
);

router.patch(
    "/me",
    authorizeRole("admin", "manager", "employee"),
    validate(updateMeSchema),
    userController.updateMe,
);

router.patch(
    "/:employeeCode",
    authorizeRole("admin"),
    validate(updateUserSchema),
    userController.updateUser,
);

router.delete(
    "/:employeeCode",
    authorizeRole("admin"),
    userController.deleteUser,
);

export default router;
