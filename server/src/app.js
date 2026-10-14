import cors from "cors";
import express from "express";
import { errorHandler, notFoundMiddleware } from "./middlewares/errors.js";
import apiRouter from "./routes/index.js";
import { loggerMiddleware } from "./middlewares/logger.js";

export function createApp() {
    const app = express();

    app.use(loggerMiddleware, cors(), express.json());

    app.get("/", (_req, res) => {
        res.json({ ok: true });
    });

    app.use("/api", apiRouter);

    app.use(notFoundMiddleware, errorHandler);

    return app;
}

export default createApp;
