import type { Server, Socket } from "socket.io";
import { rooms } from "../state/rooms.js";
import { Player } from "../state/rooms.js";

export function registerRoomHandlers(io: Server, socket: Socket) {
    socket.on("room:join", ({ roomId, name }) => {
        socket.join(roomId);

        const room = rooms.getRoom(roomId);
        room.addPlayer(socket.id, name);

        socket.emit("room:state", room);
        socket.to(roomId).emit("room:playerJoined", { id: socket.id, name });
    });

    socket.on("room:send", ({ roomId, payload } : {roomId : string; payload: Player}) => {
        if (!socket.rooms.has(roomId)) return;
        // Firstly, update our server state
        const room = rooms.getRoom(roomId);
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
            player.typed = payload.typed;
        }
        // Then, broadcast to other players in the room, send them the whole room state for simplicity
        socket.to(roomId).emit("room:update", room);
    });

}
