import { getIO } from "../socket.js";

export function emitSwapCreated(unitName, data) {
    const io = getIO();
    if (io && unitName) {
        io.to(`unit:${unitName}`).emit("swaps:created", data);
    }
}

export function emitSwapPublished(unitName, data) {
    const io = getIO();
    if (io && unitName) {
        io.to(`unit:${unitName}`).emit("swaps:published", data);
    }
}

export function emitSwapRejected(unitName, requesterEmployeeCode, data) {
    const io = getIO();
    if (!io) return;
    if (unitName) {
        io.to(`unit:${unitName}`).emit("swaps:rejected", data);
    }
    if (requesterEmployeeCode) {
        io.to(`user:${requesterEmployeeCode}`).emit("swaps:rejected", data);
    }
}

export function emitSwapApplied(unitName, data) {
    const io = getIO();
    if (io && unitName) {
        io.to(`unit:${unitName}`).emit("swaps:applied", data);
    }
}

export function emitSwapApproved({
    unitName,
    approvedEmployeeCode,
    requesterEmployeeCode,
    swapId,
}) {
    const io = getIO();
    if (!io) return;
    if (unitName) {
        io.to(`unit:${unitName}`).emit("swaps:approved", {
            swapId,
            approvedEmployeeCode,
        });
    }
    if (approvedEmployeeCode) {
        io.to(`user:${approvedEmployeeCode}`).emit("swaps:approved", {
            swapId,
        });
    }
    if (requesterEmployeeCode) {
        io.to(`user:${requesterEmployeeCode}`).emit("swaps:approved", {
            swapId,
            replacementEmployeeCode: approvedEmployeeCode,
        });
    }
}

export function emitSwapApplicantRejected(employeeCode, data) {
    const io = getIO();
    if (io && employeeCode) {
        io.to(`user:${employeeCode}`).emit("swaps:applicant_rejected", data);
    }
}
