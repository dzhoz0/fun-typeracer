import React from "react";
import type { Player, Room } from "../types/backend";
import { useParams } from "react-router";
import socket from "../lib/socket";
import OnScreenKeyboard from "../Components/Keyboard.tsx";
import {Box, Heading, Text, Badge, Button, Card, Progress, Callout} from "@radix-ui/themes";
import TypingBox from "../Components/TypingBox.tsx";
import {ExclamationTriangleIcon, LightningBoltIcon, StopwatchIcon} from "@radix-ui/react-icons";
/*
* Prank modes:
* 0. Remap keys aka shuffle layout
* 1. caps lock is on, other words, uppercase only, needs shift to type lowercase
* 2. double press to register a key
* 3. latency until shown
* 4. commonly misspelled words (no effect here, only on backend)
* */

const prankModesDescription = [
    "Keys are remapped to a random layout. See the on-screen keyboard for reference.",
    "Caps Lock is on. You need to hold Shift to type lowercase letters.",
    "You need to press each key twice quickly to register it.",
    "There is a noticeable lag between when you type and when the character appears.",
    "The text contains commonly misspelled words. Watch out for typos!",
];

function getPercentageDone(typed: string, fullText: string): number {
    if (fullText.length === 0) return 0;
    const len = Math.min(typed.length, fullText.length);
    let correctChars = 0;
    for (let i = 0; i < len; i++) {
        if (typed[i] === fullText[i]) {
            correctChars++;
        }
    }
    return Math.round((correctChars / fullText.length) * 100);
}

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
    activeKeys?: ReadonlySet<string>;
    inCountdown: number,
    keyCount: Map<string, number>
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
            keyState: {key: "", time: 0},
            doneTyping: false,
            activeKeys: new Set<string>(),
            inCountdown: -1,
            keyCount: new Map<string, number>(),
        };

    }

    handleKeyPress = async (event: KeyboardEvent) => {
        if (!this.state.roomState?.started || this.state.doneTyping) {
            return;
        }

        // Ignore typing into inputs / contenteditable and modifier combos
        const target = event.target as HTMLElement | null;
        if (
            target &&
            (target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.getAttribute?.("contenteditable") === "true")
        ) {
            return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        const name = localStorage.getItem("playerName") ?? "";
        const currentTyped = this.state.player?.typed ?? "";

        if (event.key === "Backspace" || event.key === "Delete") {
            if (currentTyped.length === 0) return;

            event.preventDefault();

            const newTyped = currentTyped.slice(0, -1);

            this.setState((prevState) => ({
                player: prevState.player
                    ? {...prevState.player, typed: newTyped}
                    : prevState.player,
            }));

            socket.emit(
                "room:send",
                JSON.stringify({
                    roomId: this.roomId,
                    payload: {name, typed: newTyped},
                })
            );

            return;
        }
        // Allows (upper/lower) letters, space.
        const validKeys = /^[a-zA-Z ]$/;
        let key = event.key;
        if (!validKeys.test(key)) return;

        // keep a lowercase version for keyState / activeKeys
        let keyLower = key.toLowerCase();

        if (this.state.roomState.prankMode == 0) {
            // Remap key according to layout
            const layout = this.state.roomState.layout;
            const standardLayout = 'qwertyuiopasdfghjklzxcvbnm';

            const isUpperCase = (char: string) => char === char.toUpperCase();
            const keyLowerForIndex = key.toLowerCase();

            const index = standardLayout.indexOf(keyLowerForIndex);
            if (index !== -1) {
                let mappedKey = layout[index];
                // Preserve case for typed character
                if (isUpperCase(key)) {
                    mappedKey = mappedKey.toUpperCase();
                }
                key = mappedKey;
                keyLower = mappedKey.toLowerCase();
            }
        }

        if (this.state.roomState.prankMode == 1) {
            // Make uppercase if lowercase, and vice versa (affects typed char)
            if (key === key.toLowerCase()) {
                key = key.toUpperCase();
            } else {
                key = key.toLowerCase();
            }
            keyLower = key.toLowerCase();
        }

        if (this.state.roomState.prankMode == 2) {
            const lastKeyState = this.state.keyState;
            // compare lowercase keys for double-press logic
            if (keyLower === lastKeyState.key) {
                const timeDiff = Date.now() - lastKeyState.time;

                // Double press must be within 500ms
                if (timeDiff > 500) {
                    // Ignore this key press, wait for next
                    this.setState({keyState: {key: keyLower, time: Date.now()}});
                    return;
                } else {
                    this.setState({keyState: {key: "", time: 0}});
                }
            } else {
                // Different key pressed, ignore this press
                this.setState({keyState: {key: keyLower, time: Date.now()}});
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
                ? {...prevState.player, typed: newTyped}
                : prevState.player,
        }));

        socket.emit(
            "room:send",
            JSON.stringify({
                roomId: this.roomId,
                payload: {name: this.state.player?.name, typed: newTyped},
            })
        );

        if (newTyped === this.state.roomState?.text) {
            this.setState({doneTyping: true});
        }

        // Use lowercase key for keyState and active key highlighting
        const activeKey = key.toLowerCase();

        // Set last key state


        // Activate key
        this.setState((prevState) => {
            const newActiveKeys = new Set(prevState.activeKeys);
            newActiveKeys.add(activeKey);
            return {activeKeys: newActiveKeys};
        });

        // Deactivate key after 100ms
        setTimeout(() => {
            this.setState((prevState) => {
                const newActiveKeys = new Set(prevState.activeKeys);
                newActiveKeys.delete(activeKey);
                return {activeKeys: newActiveKeys};
            });
        }, 100);
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

    onRoomUpdate = async (data: string) => {
        const room: Room = JSON.parse(data.trim());
        const oldRoom = this.state.roomState;
        const name = localStorage.getItem("playerName") ?? "";

        if (oldRoom?.started == false && room.started) {
            // Start countdown of 5 seconds
            for (let timer = 5; timer > 0; timer--) {
                this.setState({
                    inCountdown: timer
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            this.setState({
                inCountdown: 0
            })
        }

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
        const {roomState, player, isAdmin, activeKeys, inCountdown} = this.state;

        const playersInfo = [];
        for (const p of roomState?.players || []) {
            const rankIndex = roomState?.rankings?.indexOf(p.name);
            const ranking = (typeof rankIndex === 'number' && rankIndex >= 0) ? rankIndex + 1 : 0;
            playersInfo.push({
                name: p.name,
                ranking,
                percentage: getPercentageDone(p.typed, roomState?.text || ""),
            })
        }

        if (!this.roomId) {
            window.location.href = "/";
            return null;
        }

        return (
            <div className="min-h-screen flex justify-center bg-gray-100 p-6">
                <div className="absolute top-4 left-4">
                    <a href="/" className="text font-bold text-gray-700 hover:text-gray-900">
                        &larr; Home
                    </a>
                </div>

                {roomState && player &&
                    <Box className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-md">
                        <div className="flex justify-between">
                            <div>
                                <Heading as="h3"> Room ID: {this.roomId} </Heading>
                                <Text size="2" className="text-gray-600"> Welcome, {player?.name} </Text>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                {isAdmin && (
                                    <Badge variant="solid" color="green"> Admin </Badge>
                                )}
                                {roomState?.started ? (
                                    <Badge variant="solid" color="blue"> Game Started </Badge>
                                ) : (
                                    <Badge variant="solid" color="yellow"> Waiting to Start </Badge>
                                )}
                            </div>
                        </div>

                        <div>
                            {
                                roomState.prankMode != -1 && (
                                    <Callout.Root color="orange" className="mt-5">
                                        <Callout.Icon>
                                            <ExclamationTriangleIcon/>
                                        </Callout.Icon>
                                        <Callout.Text>
                                            Modification: {prankModesDescription[roomState.prankMode]}
                                        </Callout.Text>
                                    </Callout.Root>
                                )
                            }
                        </div>

                        <div className="pt-5">
                            {
                                inCountdown == 0 && (
                                    <Callout.Root color="green" className="flex-col items-center">
                                        <Callout.Icon>
                                            <LightningBoltIcon/>
                                        </Callout.Icon>
                                        <Callout.Text>
                                            Go!
                                        </Callout.Text>
                                    </Callout.Root>
                                )
                            }
                            {
                                inCountdown > 0 && (
                                    <Callout.Root color="yellow" className="flex-col items-center">
                                        <Callout.Icon>
                                            <StopwatchIcon/>
                                        </Callout.Icon>
                                        <Callout.Text>
                                            Starting in {inCountdown}...
                                        </Callout.Text>
                                    </Callout.Root>
                                )
                            }
                        </div>

                        {isAdmin && !roomState?.started ? (
                            <div className="pt-5">
                                <Button style={{
                                    width: "100%",
                                }} onClick={() => {
                                    socket.emit(
                                        "room:start",
                                        JSON.stringify({
                                            roomId: this.roomId,
                                            name: player?.name,
                                        })
                                    );
                                }}>
                                    Start Game
                                </Button>
                            </div>
                        ) : null}

                        <div className="flex-col mt-5">
                            <Heading as="h4">Players ({playersInfo.length})</Heading>
                            {playersInfo.map((p: { name: string, ranking: number, percentage: number }) => (
                                <Card className="flex-col mt-3">
                                    <div className="flex justify-between mb-2">
                                        <Text>{p.name} {p.ranking != 0 && "#" + p.ranking}</Text>
                                        <Text>{p.percentage}%</Text>
                                    </div>
                                    <Progress value={p.percentage} className="w-full"/>
                                </Card>
                            ))}
                        </div>

                        <div>
                            <TypingBox targetText={roomState.text} currentText={player.typed}/>
                        </div>

                        <div>
                            <OnScreenKeyboard layout={roomState.keyboardLayout} activeKeys={activeKeys}/>
                        </div>
                    </Box>
                }
            </div>

        )

    }
}

export default function Room() {
    const params = useParams<{ roomId: string }>();
    return <RoomClass params={params} />;
}
