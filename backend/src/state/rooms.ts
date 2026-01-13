import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { wordSet } from "../types/word_set.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wordSetsPath = path.join(__dirname, "../word_sets");
const numWords = 50;

export type Player = {
    id: string,
    name: string,
    typed: string,
};

class Rooms {
    id: string;
    players: Player[] = [];
    text: string = '';
    prankMode: number = 0;

    constructor(id: string) {
        this.id = id;

        // prankMode is a random number from 0 to 4
        this.prankMode = Math.floor(Math.random() * 5);

        // It is always ensured word_set exists (actually only in frontend)
        let word_set = 'english_5k';
        if(this.prankMode == 4) word_set = 'english_common_misspelled';

        const wordSetFile = path.join(wordSetsPath, `${word_set}.json`);


        // Generate random text for typing
        const wordSetData = fs.readFileSync(wordSetFile, 'utf-8');
        const wordSet : wordSet = JSON.parse(wordSetData);
        const words = wordSet.words;
        for (let i = 0; i < numWords; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            this.text += words[randomIndex];
            if(i < numWords - 1) this.text += ' ';
        }

    }

    addPlayer(id: string, name: string) {
        const newPlayer: Player = {
            id: id,
            name: name,
            typed: '',
        };
        this.players.push(newPlayer);
    }
};

class RoomStore {
    rooms: Map<String, Rooms>;

    constructor() {
        this.rooms = new Map<String, Rooms>();
    }

    newRoom(): string {
        // Generate a unique room ID (6 letter string)
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let roomId: string;
        do {
            roomId = '';
            for (let i = 0; i < 6; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                roomId += characters[randomIndex];
            }
        } while (this.rooms.has(roomId));
        this.rooms.set(roomId, new Rooms(roomId));
        return roomId;
    }

    getRoom(roomId: string): Rooms {
        if(!this.rooms.has(roomId)) {
            // This should never happen if frontend is implemented correctly
            throw new Error("Room does not exist");
        }
        return this.rooms.get(roomId)!;
    }

}

export const rooms = new RoomStore();