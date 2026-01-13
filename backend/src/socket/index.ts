import type {Server, Socket} from "socket.io";
import {registerRoomHandlers} from "./roomHandlers.js";
export function setupSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);
        registerRoomHandlers(io, socket);
    });
}