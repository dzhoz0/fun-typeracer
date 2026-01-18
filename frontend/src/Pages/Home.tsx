import React from 'react';
import api from '../lib/api.js';
import {Box, Button, Card, Heading, Text, Callout} from "@radix-ui/themes";
import {CrossCircledIcon, InfoCircledIcon} from "@radix-ui/react-icons";

type HomeState = {
    nameInput: string;
    roomIdInput: string;
    roomIdError: string;
    nameSaved: boolean;
}

class Home extends React.Component<object, HomeState> {
    constructor(props: object) {
        super(props);
        this.state = {
            nameInput: localStorage.getItem('playerName') ?? '',
            roomIdInput: '',
            roomIdError: '',
            nameSaved: false,
        }
    }

    createAndRedirectToRoom = () => {
        const storedName = localStorage.getItem('playerName') ?? '';
        if (!storedName.trim()) {
            alert('Please set your name before creating a room.');
            return;
        }

        api.post('/createRoom', storedName, {
            headers: {
                "Content-Type": "text/plain"
            }
        }).then((data) => {
            const roomId = data.data;
            window.location.href = `/room/${roomId}`;
        }).catch((err) => {
            console.error('Error creating room:', err);
            alert('Error creating room. Please try again.');
        });
    }

    joinRoom = () => {
        // Needs a name first
        const storedName = localStorage.getItem('playerName') ?? '';
        if (!storedName.trim()) {
            this.setState({roomIdError: 'Please set your name before joining a room.'});
            return;
        }
        const { roomIdInput } = this.state;
        const roomId = roomIdInput.trim();
        if (!roomId) {
            this.setState({roomIdError: 'Please enter a room ID.'});
            return;
        }

        // Check if room exists
        api.get(`/getRoom/${roomId}`).then((data) => {
            if (data.status == 200) {
                window.location.href = `/room/${roomId}`;
                return;
            }
            this.setState({roomIdError: 'Room not found. Please check the Room ID and try again.'});
        }).catch((err) => {
            console.error('Error checking room:', err);
            this.setState({roomIdError: 'Room not found. Please check the Room ID and try again.'});
        })
    }

    saveName = () => {
        const { nameInput } = this.state;
        if (!nameInput.trim()) {
            alert('Please enter a name to save.');
            return;
        }
        localStorage.setItem('playerName', nameInput.trim());
        this.setState({ nameSaved: true, nameInput: '' });
    }

    render() {
        const { nameInput, roomIdInput, nameSaved } = this.state;

        return (
            <div className="min-h-screen flex items-center page-bg justify-center p-6">
                <Box className="bg-white p-6 rounded-2xl max-w-md w-full shadow-sm border border-gray-200">
                    <Heading as="h1" className="text-2xl font-semibold text-gray-900 mb-1">Welcome</Heading>
                    <Text className="text-gray-600 mb-6">Set your name and join or create a room</Text>

                    <Card className="p-4 mb-4">
                        <div className="mb-3">
                            <Text className="font-medium text-sm">Your Name</Text>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                value={nameInput}
                                onChange={(e) => this.setState({ nameInput: e.target.value })}
                                className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="text"
                                placeholder="Enter your name"
                            />
                            <Button color="gray" onClick={this.saveName}>Save</Button>
                        </div>

                        {nameSaved && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200">
                                    <InfoCircledIcon className="text-green-700" />
                                    <span className="text-sm text-green-800">Name saved! You can now create or join a room.</span>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="mb-4 flex">
                        <Button
                            style={{ width: '100%' }}
                            onClick={this.createAndRedirectToRoom}
                            color="gray"
                        >
                            Create New Room
                        </Button>
                    </div>


                    <div className="flex items-center my-4">
                        <hr className="flex-1 border-t border-gray-300" />
                        <span className="px-3 text-gray-400 text-sm">OR</span>
                        <hr className="flex-1 border-t border-gray-300" />
                    </div>

                    <div className="mb-3">
                        <Text className="font-medium text-sm">Room ID</Text>
                    </div>

                    <div className="flex flex-col gap-3">
                        <input
                            value={roomIdInput}
                            onChange={(e) => this.setState({ roomIdInput: e.target.value })}
                            className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="text"
                            placeholder="Enter room ID"
                        />
                        {this.state.roomIdError && (
                            <>
                                <Callout.Root color="red">
                                    <Callout.Icon>
                                        <CrossCircledIcon />
                                    </Callout.Icon>
                                    <Callout.Text>
                                        {this.state.roomIdError}
                                    </Callout.Text>
                                </Callout.Root>
                            </>
                        )}
                        <Button color="gray" className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg" onClick={this.joinRoom}>Join Room</Button>
                    </div>
                </Box>
            </div>
        );
    }
}

export default Home;
