import { Router } from "express";
import { swapController } from "../controllers/swap.controller.js";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createSwapRequestSchema } from "../models/swap.schema.js";

const router = Router();

router.use(authenticate);

router.get(
    "/board",
    authorizeRole("manager", "employee"),
    swapController.getBoard,
);

router.get(
    "/manager",
    authorizeRole("manager"),
    swapController.getManagerSwaps,
);

router.get("/mine", authorizeRole("employee"), swapController.getMySwaps);

router.post(
    "/",
    authorizeRole("employee"),
    validate(createSwapRequestSchema),
    swapController.createSwap,
);

router.patch(
    "/:id/publish",
    authorizeRole("manager"),
    swapController.publishSwap,
);

router.patch(
    "/:id/reject",
    authorizeRole("manager"),
    swapController.rejectSwap,
);

router.post("/:id/apply", authorizeRole("employee"), swapController.applySwap);

router.get(
    "/:id/compliance/:employeeCode",
    authorizeRole("manager"),
    swapController.getCompliance,
);

router.patch(
    "/:id/applicants/:employeeCode/approve",
    authorizeRole("manager"),
    swapController.approveApplicant,
);

router.patch(
    "/:id/applicants/:employeeCode/reject",
    authorizeRole("manager"),
    swapController.rejectApplicant,
);

export default router;
