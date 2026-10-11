import { styleText } from "node:util";

export const loggerMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const timestamp = new Date().toLocaleString();
        const { method } = req;
        const url = req.originalUrl || req.url;
        const status = res.statusCode;
        const duration = `${Date.now() - start}ms`;
        const statusColor = status >= 500 ? "red" : status >= 400 ? "yellow" : "green";

        console.log(
            `${styleText(["bold", "cyan"], timestamp)} ${styleText(["bold", "white"], method)} ${styleText(["bold", "blue"], url)} - ${styleText(["bold", statusColor], status.toString())} (${styleText("gray", duration)})`
        );
    });

    next();
};

