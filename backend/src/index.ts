import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { setupSocket } from "./socket/index.js";
import { rooms } from './state/rooms.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

setupSocket(io);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("Hi cutie:3");
});

app.post('/createRoom', (req, res) => {
    // Create a room and return id
    let roomId = rooms.newRoom();
    res.send(roomId);
})

httpServer.listen(PORT, () => {
    console.log("Server is running at :3000");
})