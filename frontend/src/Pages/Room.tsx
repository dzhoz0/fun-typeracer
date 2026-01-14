import React from "react";
import type { Player, Room } from "../types/backend";
import { useParams } from "react-router";
import socket from "../lib/socket";

/*
* Prank modes:
* 0. Remap keys aka shuffle layout
* 1. caps lock is on, other words, uppercase only, needs shift to type lowercase
* 2. double press to register a key
* 3. latency until shown
* 4. commonly misspelled words (no effect here, only on backend)
* */

type RoomClassProps = {
    params: {
        roomId?: string;
    };
};

type KeyState = {
    key: string;
    time: number;
};

type RoomClassState = {
    roomState?: Room;
    player?: Player;
    isAdmin: boolean;
    doneTyping: boolean;
    keyState: KeyState;
};

class RoomClass extends React.Component<
    RoomClassProps,
    RoomClassState
> {

    private lagBuffer: string[] = [];
    private lagTimer: number | null = null;

    roomId?: string;
    constructor(props: RoomClassProps) {
        super(props);

        this.roomId = props.params.roomId;

        this.state = {
            roomState: undefined,
            player: undefined,
            isAdmin: false,
            keyState: { key: "", time: 0 },
            doneTyping: false,
        };
    }

    handleKeyPress = async (event: KeyboardEvent) => {
        if (!this.state.roomState?.started || this.state.doneTyping) {
            return;
        }

        const name = localStorage.getItem("playerName") ?? "";
        const currentTyped = this.state.player?.typed ?? "";

        if (event.key === "Backspace") {
            if (currentTyped.length === 0) return;

            event.preventDefault();

            const newTyped = currentTyped.slice(0, -1);

            this.setState((prevState) => ({
                player: prevState.player
                    ? { ...prevState.player, typed: newTyped }
                    : prevState.player,
            }));

            socket.emit(
                "room:send",
                JSON.stringify({
                    roomId: this.roomId,
                    payload: { name, typed: newTyped },
                })
            );

            return;
        }
        // Allows (upper/lower) letters, space.
        const validKeys = /^[a-zA-Z ]$/;
        let key = event.key;
        if (!validKeys.test(key)) return;


        if(this.state.roomState.prankMode == 1) {
            // Make uppercase if lowercase, and vice versa
            if(key === key.toLowerCase()) {
                key = key.toUpperCase();
            } else {
                key = key.toLowerCase();
            }
        }

        if(this.state.roomState.prankMode == 2) {
            const lastKeyState = this.state.keyState;
            if(key === lastKeyState.key) {
                const timeDiff = Date.now() - lastKeyState.time;
                // Double press must be within 500ms
                if(timeDiff > 500) {
                    // Ignore this key press, wait for next
                    this.setState({ keyState: { key: key, time: Date.now() } });
                    return;
                }
            } else {
                // Different key pressed, ignore this press
                this.setState({ keyState: { key: key, time: Date.now() } });
                return;
            }
        }

        if (this.state.roomState.prankMode === 3) {
            this.lagBuffer.push(key);

            if (this.lagTimer === null) {
                this.lagTimer = window.setTimeout(this.flushLagBuffer, 300);
            }
            return;
        }

        this.commitKey(key);
    };


    flushLagBuffer = () => {
        if (!this.state.player) return;

        const keyString = this.lagBuffer.join("");
        this.lagBuffer = [];
        this.lagTimer = null;

        this.commitKey(keyString);
    };
    commitKey = (key: string) => {
        const newTyped = this.state.player?.typed + key;

        this.setState((prevState) => ({
            player: prevState.player
                ? { ...prevState.player, typed: newTyped }
                : prevState.player,
        }));

        socket.emit(
            "room:send",
            JSON.stringify({
                roomId: this.roomId,
                payload: { name: this.state.player?.name, typed: newTyped },
            })
        );

        if (newTyped === this.state.roomState?.text) {
            this.setState({ doneTyping: true });
        }

        // Set last key state
        this.setState({ keyState: { key: key, time: Date.now() } });
    }


    componentDidMount() {
        window.addEventListener("keydown", this.handleKeyPress);

        const name = localStorage.getItem("playerName") ?? "";

        if (!this.roomId || !name.trim()) return;

        if (!socket.connected) {
            socket.connect();
        }

        socket.on("room:update", this.onRoomUpdate);

        socket.emit(
            "room:join",
            JSON.stringify({
                roomId: this.roomId,
                name,
            })
        );
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyPress);

        socket.off("room:update", this.onRoomUpdate);
        socket.emit(
            "room:leave",
            JSON.stringify({
                roomId: this.roomId,
            })
        );
    }

    onRoomUpdate = (data: string) => {
        const room: Room = JSON.parse(data.trim());
        const name = localStorage.getItem("playerName") ?? "";

        const player = room.players.find(
            (p) => p.name === name
        );

        this.setState({
            roomState: room,
            player,
            isAdmin: room.adminName === name,
        });
    };

    render() {
        const { roomState, player, isAdmin } = this.state;

        if (!this.roomId) {
            return <p>Invalid room</p>;
        }

        return (
            <div>
                <p>Room ID: {this.roomId}</p>
                {isAdmin ? (
                    <>
                        <p>You are admin</p>
                        <button onClick={()=>{
                            socket.emit("room:start", JSON.stringify({
                                roomId: this.roomId,
                                name: player?.name
                            }));
                        }}>Start game</button>
                    </>
                ) : (
                    <p>You are a player</p>
                )}

                {roomState && (
                    <>
                        <p>Started: {roomState.started ? "Yes" : "No"}</p>
                        <p>Text: {roomState.text}</p>

                        <h3>Players</h3>
                        <ul>
                            {roomState.players.map((p) => (
                                <li key={p.name}>
                                    {p.name}: {p.typed}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {player && (
                    <>
                        <h3>You</h3>
                        <p>Name: {player.name}</p>
                        <p>Typed: {player.typed}</p>
                    </>
                )}
            </div>
        );
    }
}


export default function Room() {
    const params = useParams<{ roomId: string }>();
    return <RoomClass params={params} />;
}
