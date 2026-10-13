import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:2026";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
    if (socket) return socket;
    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnectionDelayMax: 5000,
    });
    return socket;
}

export function disconnectSocket(): void {
    socket?.disconnect();
    socket = null;
}
