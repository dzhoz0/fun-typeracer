import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import socket from "../lib/socket";

export default function Room() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const name = localStorage.getItem("playerName") ?? "";

    // Redirect if name is missing
    useEffect(() => {
        if (!name.trim()) {
            alert("Please set your name before joining a room.");
            navigate("/");
        }
    }, [name, navigate]);

    // Socket logic
    useEffect(() => {
        if (!roomId || !name.trim()) return;

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit("room:join", {
            roomId,
            name,
        });

        socket.disconnect();
        // return () => {
        //     socket.emit("room:leave", { roomId });
        //     socket.disconnect();
        // };
    }, [roomId, name]);

    if (!roomId) {
        return <p>Invalid room</p>;
    }

    return (
        <div>
            <p>Room ID: {roomId}</p>
        </div>
    );
}
