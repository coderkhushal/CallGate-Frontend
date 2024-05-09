"use client"

import React, { useEffect, useRef, useState } from 'react'
import MessageContainer from './MessageContainer';
import {gsap } from 'gsap'

const MessageMain = ({ callmessages, sendmessage }: { callmessages: { mode: "RECIEVING" | "SENDING", message: string, imgUrl?: string }[], sendmessage: (message: string) => void }) => {
    const [message, setmessage] = useState<string>("")
    const lastMessageRef = useRef(null);
    useEffect(() => {
        if (lastMessageRef.current) {
          // Animation logic using GSAP
          gsap.from(lastMessageRef.current, { ease: "power3.out", x: -20, duration: 1, y: -20 });
    
        }
      }, [callmessages]);
    return (
        <div className='justify-end overflow-y-hidden h-full  bg-blue-200 w-full'>

            <div id="messages" className="h-5/6 p-4 overflow-y-auto space-y-2  scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch w-full">
                {callmessages.map((message, index) => (
                    <MessageContainer
                        key={index}
                        reference={index === callmessages.length - 1 ? lastMessageRef : null}
                        type={message.mode}
                        title={message.message}
                        imgUrl={message.imgUrl}
                    />
                ))}
            </div >

            <div className="border-t border-gray-300 w-full">
                <form onSubmit={(e) => { e.preventDefault(); sendmessage(message); setmessage("") }} className="flex items-center space-x-2 p-4">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setmessage(e.target.value)}
                        placeholder="Write your message!"
                        className="flex-1 py-2 px-4 focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 bg-gray-200 rounded-md"
                    />
                    <button type="submit" className="py-2 px-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-md focus:outline-none">
                        Send
                    </button>
                </form>
            </div>
        </div>
    )
}

export default MessageMain