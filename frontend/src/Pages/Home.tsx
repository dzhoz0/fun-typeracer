import api from '../lib/api.js';
function Home() {

    function createAndRedirectToRoom() {
        // Get username from local storage, if not show error
        const playerName = localStorage.getItem('playerName');
        if(!playerName || playerName.trim() === '') {
            alert('Please set your name before creating a room.');
            return;
        }

        api.post('/createRoom', playerName).then((data) => {
            const roomId = data.data;
            // Redirect to room
            window.location.href = `/room/${roomId}`;
        }).catch((err) => {
            console.error('Error creating room:', err);
            alert('Error creating room. Please try again.');
        });
    }

    return (
        <div className="">
            <p>Set your name:</p>
            <input type="text" id="name_input" className="rounded border border-gray-400 px-2 py-1" />
            <button className="rounded bg-blue-500 px-4 py-2 text-white" onClick={()=>{
                const input = document.getElementById('name_input') as HTMLInputElement;
                if(input){
                    alert(`Name set to: ${input.value}`);
                }
                // Save name to local storage
                localStorage.setItem('playerName', input.value);
                // Clear input
                input.value = '';
            }}>Save!</button>
            <p />
            <button className="rounded bg-blue-500 px-4 py-2 text-white" onClick={createAndRedirectToRoom}>
                Create Room
            </button>

        </div>
    );
}

export default Home;
