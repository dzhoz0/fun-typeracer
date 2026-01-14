import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { setupSocket } from "./socket/index.js";
import { rooms } from './state/rooms.js';

const app = express();
app.use(cors({
    origin: "*"
}));
app.options('/', cors());
app.use(express.text());

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

    console.log("Creating room with admin name:", req.body);
    let roomId = rooms.newRoom(req.body);
    res.send(roomId);
    // res.send(req.body);
})

httpServer.listen(PORT, () => {
    console.log("Server is running at :3000");
})