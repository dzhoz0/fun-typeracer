export type Player =  {
    name: string,
    typed: string
};

export type Room = {
    id: string;
    players: Player[];
    text: string;
    prankMode: number;
    started: boolean;
    adminName: string;

    layout: string;
    keyboardLayout: string[][];
    rankings: string[];

};

