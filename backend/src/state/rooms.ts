import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { wordSet } from "../types/word_set.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wordSetsPath = path.join(__dirname, "../word_sets");
const numWords = 20;

export type Player = {
    name: string,
    typed: string,
};

function shuffleString(str: string) {
    const arr = [...str]; // handles Unicode properly
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
}


class Rooms {
    id: string;
    players: Player[] = [];
    text: string = '';
    prankMode: number = 0;
    started: boolean = false;
    adminName: string = '';

    layout: string = 'qwertyuiopasdfghjklzxcvbnm';
    keyboardLayout: string[][] = [];
    rankings: string[] = [];

    constructor(id: string, adminId: string) {
        this.id = id;
        this.adminName = adminId;
        // prankMode is a random number from 0 to 4
        this.prankMode = Math.floor(Math.random() * 5);
        // this.prankMode = 4;
        if(this.prankMode == 0) {
            this.layout = shuffleString(this.layout);
        }

        this.keyboardLayout = [
            this.layout.slice(0,10).split(''),
            this.layout.slice(10,19).split(''),
            this.layout.slice(19,26).split(''),
            [" "]
        ];

        // It is always ensured word_set exists (actually only in frontend)
        let word_set = 'english_1k';
        if(this.prankMode == 4) word_set = 'english_commonly_misspelled';

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

    modifyTyped(playerName: string, newTyped: string) {
        const player = this.players.find((p) => p.name === playerName);
        if (player) {
            player.typed = newTyped;
            console.log(player);
            if(player.typed == this.text && !this.rankings.includes(player.name)) {
                console.log(`Player ${player.name} finished typing!`);
                this.rankings.push(player.name);
            }
        }
    }

    makeGameStart(adminName: string) {
        if(this.adminName !== adminName) {
            // Should not happen if frontend is implemented correctly
            throw new Error("Only admin can start the game");
        }
        this.started = true;
    }

    addPlayer(name: string) {
        // Only add if not already present
        if(this.players.find((p) => p.name === name)) {
            return;
        }
        const newPlayer: Player = {
            name: name,
            typed: '',
        };
        this.players.push(newPlayer);
    }

    deletePlayer(name: string) {
        this.players = this.players.filter((p) => p.name !== name);
    }
};

class RoomStore {
    rooms: Map<String, Rooms>;

    constructor() {
        this.rooms = new Map<String, Rooms>();
    }

    newRoom(adminName: string): string {
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
        this.rooms.set(roomId, new Rooms(roomId, adminName));
        console.log("New room created with ID:", roomId, "by admin:", adminName);
        return roomId;
    }

    getRoom(roomId: string): Rooms {
        console.log("Finding room:", roomId);
        if(!this.rooms.has(roomId)) {
            // This should never happen if frontend is implemented correctly
            throw new Error("Room does not exist");
        }
        return this.rooms.get(roomId)!;
    }

}

export const rooms = new RoomStore();