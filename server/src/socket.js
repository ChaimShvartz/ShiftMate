import { Server } from "socket.io";
import { socketAuth } from "./middlewares/auth.js";

let ioInstance = null;

export function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    ioInstance = io;

    io.use(socketAuth);

    io.on("connection", (socket) => {
        const user = socket.user;
        if (user?.unitName) {
            socket.join(`unit:${user.unitName}`);
        }
        if (user?.employeeCode) {
            socket.join(`user:${user.employeeCode}`);
        }

        socket.on("join_unit", (unitName) => {
            if (unitName) {
                socket.join(`unit:${unitName}`);
            }
        });

        socket.on("join_user", (employeeCode) => {
            if (employeeCode) {
                socket.join(`user:${employeeCode}`);
            }
        });

        socket.on("disconnect", () => {});
    });

    return io;
}

export function getIO() {
    return ioInstance;
}
