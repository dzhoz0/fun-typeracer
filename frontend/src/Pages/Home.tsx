import React, { useEffect, useState } from 'react';

function Home() {

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
            <button className="rounded bg-blue-500 px-4 py-2 text-white">
                Create Room
            </button>

        </div>
    );
}

export default Home;
