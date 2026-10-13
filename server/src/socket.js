import { Server } from "socket.io";
import { socketAuth } from "./middlewares/auth.js";

let ioInstance = null;

export function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });

    ioInstance = io;
    io.use(socketAuth);

    // Rooms are derived strictly from the verified identity - clients cannot
    // join arbitrary rooms.
    io.on("connection", (socket) => {
        const { employeeCode, role, unitName } = socket.user;
        socket.join(`user:${employeeCode}`);
        if (unitName) socket.join(`unit:${unitName}`);
        if (unitName && role === "manager") socket.join(`managers:${unitName}`);
    });

    return io;
}

export function emitToUser(employeeCode, event, payload) {
    ioInstance?.to(`user:${employeeCode}`).emit(event, payload);
}
