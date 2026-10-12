import { getIO } from "../socket.js";

export function emitShiftCreated(unitName, data) {
    const io = getIO();
    if (io && unitName) {
        io.to(`unit:${unitName}`).emit("shifts:created", data);
    }
}

export function emitShiftUpdated(unitName, data) {
    const io = getIO();
    if (io && unitName) {
        io.to(`unit:${unitName}`).emit("shifts:updated", data);
    }
}

export function emitShiftDeleted(unitName, data) {
    const io = getIO();
    if (io && unitName) {
        io.to(`unit:${unitName}`).emit("shifts:deleted", data);
    }
}
