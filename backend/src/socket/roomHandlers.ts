import type { Server, Socket } from "socket.io";
import { rooms } from "../state/rooms.js";
import { Player } from "../state/rooms.js";

export function registerRoomHandlers(io: Server, socket: Socket) {
    socket.on("room:join", (data: string) => {
        let { roomId, name } = JSON.parse(data) as { roomId: string; name: string };
        socket.join(roomId);

        const room = rooms.getRoom(roomId);
        room.addPlayer(name);

        console.log(`Player ${name} joined room ${roomId}`);

        // Also send the current room state to the player who just joined
        io.to(roomId).emit("room:update", JSON.stringify(room));
    });

    socket.on("room:start", (data: string) => {
        let { roomId, name } = JSON.parse(data) as { roomId: string; name: string };
        const room = rooms.getRoom(roomId);
        try {
            room.makeGameStart(name);
            console.log(`Game started in room ${roomId} by admin ${name}`);

            io.to(roomId).emit("room:update", JSON.stringify(room));
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("room:send", (data : string) => {
        // Only send your own current player update
        let { roomId, payload } = JSON.parse(data) as { roomId: string; payload: Player };
        if (!socket.rooms.has(roomId)) return;
        // Firstly, update our server state
        const room = rooms.getRoom(roomId);

        room.modifyTyped(payload.name, payload.typed);

        // Then, broadcast to other players in the room, send them the whole room state for simplicity
        io.to(roomId).emit("room:update", JSON.stringify(room));
    });

    socket.on("room:leave", (data: string) => {
        let { roomId, name } = JSON.parse(data) as { roomId: string; name: string };
        socket.leave(roomId);
        console.log(`Player ${name} left room ${roomId}`);
        // Find room
        const room = rooms.getRoom(roomId);
        room.deletePlayer(name);

        // Broadcast updated room state
        io.to(roomId).emit("room:update", JSON.stringify(room));
    });
}
