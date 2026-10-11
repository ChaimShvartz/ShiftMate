import { Router } from "express";
import setupRoutes from "./setup.routes.js";
import authRoutes from "./auth.routes.js";
import unitRoutes from "./unit.routes.js";
import userRoutes from "./user.routes.js";
import shiftRoutes from "./shift.routes.js";
import swapRoutes from "./swap.routes.js";

const apiRouter = Router();

apiRouter.use("/setup", setupRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/units", unitRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/shifts", shiftRoutes);
apiRouter.use("/swaps", swapRoutes);

export default apiRouter;
