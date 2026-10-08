import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/errors.js";

export function createApp() {
    const app = express();

    app.use(cors(), express.json());

    app.get("/api/health", (req, res) => {
        res.json({ ok: true });
    });

    app.use(errorHandler);

    return app;
}

export default createApp;
