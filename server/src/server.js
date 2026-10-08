import { createServer } from "http";
import { createApp } from "./app.js";
import { PORT } from "./config.js";
import { connectDB } from "./db/index.js";
import { initializeSocket } from "./socket.js";

export async function startServer() {
    await connectDB();

    const app = createApp();
    const httpServer = createServer(app);

    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`Server on -> http://localhost:${PORT}`);
    });

    return httpServer;
}
