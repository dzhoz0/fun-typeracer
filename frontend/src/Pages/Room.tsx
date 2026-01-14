import React from "react";
import type { Player, Room } from "../types/backend";
import { useParams } from "react-router";
import socket from "../lib/socket";

type RoomClassProps = {
    params: {
        roomId?: string;
    };
};

type RoomClassState = {
    roomState?: Room;
    player?: Player;
    isAdmin: boolean;
};

class RoomClass extends React.Component<
    RoomClassProps,
    RoomClassState
> {
    roomId?: string;

    constructor(props: RoomClassProps) {
        super(props);

        this.roomId = props.params.roomId;

        this.state = {
            roomState: undefined,
            player: undefined,
            isAdmin: false,
        };
    }

    componentDidMount() {
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
