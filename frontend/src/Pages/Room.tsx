import React from 'react';
import {useParams} from "react-router";

function Room(props) {
    const { roomId } = useParams();
    return (
        <div>
            <p>Room ID: {roomId} </p>
        </div>
    );
}

export default Room;