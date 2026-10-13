import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.list);
router.patch("/read", notificationController.markAllRead);
router.delete("/", notificationController.clear);

export default router;
