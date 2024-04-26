"use client"
import { Button } from '@/components/ui/button'
import React, { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { deleteRoom, findRoom } from '@/actions/room'
import { Socket, io } from "socket.io-client"
import { useUser } from '@clerk/nextjs'
import { useJoinContext } from '@/context/JoinContext'
import MessageContainer from '@/components/Chatting/MessageContainer'
import { gsap } from "gsap";
const SERVER = process.env.NEXT_PUBLIC_SERVER
const CallingPage = () => {
  
  const user = useUser()
  const lastMessageRef = useRef(null);

  

  const { isAdmin, currentuser, roomid, secure, setsecure, setisAdmin } = useJoinContext()
  const [socket_chat, setsocket_chat] = useState<Socket | null>(null)
  const [socket_join_admin, setsocket_join_admin] = useState<Socket | null>(null)
  const [loading, setloading] = useState<boolean>(false)
  const [mediastream, setmediastream] = useState<MediaStream | null>(null)
  const [message, setmessage] = useState<string>("")
  const [callmessages, setcallmessages] = useState<{ mode: "RECIEVING" | "SENDING", message: string, imgUrl?: string }[]>([])


  useEffect(() => {
    if (lastMessageRef.current) {
      // Animation logic using GSAP
      gsap.from(lastMessageRef.current, {ease:"power3.out",x:-20,   duration: 1, y: -20 });
      
    }
  }, [callmessages]);

  // VIDEO CALLING SERVICE 
  const videoref = React.useRef<HTMLVideoElement>(null)
  const incomingvideoref = React.useRef<HTMLVideoElement>(null)

  const startVideo = async () => {
    if (!videoref.current) return;

    // creating a stream
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    //showing it to user
    videoref.current.srcObject = stream

    setmediastream((value) => stream)



  }

  const stopVideo = async () => {
    if (!mediastream) return;
    mediastream.getTracks().forEach((track: any) => track.stop())
    setmediastream(null)

  }


  const router = useRouter()
  const pathname = usePathname()



  useEffect(() => {
    // If the use is not admin only then check the admin status

    if (!secure) {
      router.push("/" + pathname.split("/")[1] + "/join")
    }


    const _socket_chat = io(SERVER + "/chat")
    const _socket_join_admin = io(SERVER + "/join")

    _socket_chat.emit("JOIN", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })
    setsocket_join_admin(_socket_join_admin)


    // CHATTING ROOM SOCKETS FOR EVERYONE
    _socket_chat.on("JOINED", (data: any) => {
      if (data.email != user.user?.emailAddresses[0].emailAddress) {
        // alert("user joined the room")
      }
    })

    // END CALL FOR EVERYONE BY ADMIN
    _socket_chat.on("ENDCALL", () => {
      setsecure(false)
      if (isAdmin) {

      }
      else {
        alert("admin ended the call for everyone")
        router.push("join")
      }
      setisAdmin(false)
    })



    //JOINING CHAT ROOM - FOR ALL
    joinChatSocket()

    //RECIEVING MESSAGE
    _socket_chat.on("MESSAGE", (data) => updatechat(data))

    setsocket_chat(_socket_chat)



    // JOINING ROOM FOR ADMIN SOCKETS
    if (isAdmin) {

      // for admin only - to admit user
      _socket_join_admin.emit("JOINROOM", { room: pathname.split("/")[1] })
    }

    // admin actions - REQUEST
    _socket_join_admin.on("REQUEST", (data: { room: string, email: string }) => {

      alert("user want to join the room")

      let result = confirm("do you want to admit the user" + data.email + " ?")
      if (result) {
        admit(_socket_join_admin, data.email)
      }
      else {
        reject(_socket_join_admin, data.email)

      }
    }
    )


    return (() => {
      _socket_chat.disconnect()
      _socket_join_admin.disconnect()

    })
  }, [SERVER, user.user, currentuser, roomid, secure])

  // JOINING SOCKER CONNECTIONS
  // admin actions - admit
  const admit = (_socket_join_admin: Socket, useremail: string) => {
    console.log(useremail + " admitting")

    _socket_join_admin.emit("APPROVE", { room: pathname.split("/")[1], email: useremail, roomid: roomid })

  }
  // admin actions - reject
  const reject = (_socket_join_admin: Socket, useremail: string) => {
    _socket_join_admin.emit("REJECT", { room: pathname.split("/")[1], email: useremail })
  }


  //CHATTING SOCKET CONNECIONS

  // CHAT SOCKET JOINING 
  const joinChatSocket = async () => {
    if (!socket_chat) return;
    socket_chat.emit("JOIN", { room: pathname.split("/")[1] });
  }

  // CHATTING 
  const sendmessage = async (message: string) => {
    if (!socket_chat || message == "") return;

    socket_chat.emit("MESSAGE", { room: pathname.split("/")[1], id: user.user?.emailAddresses[0].emailAddress, message: message, imgUrl: user.user?.imageUrl })
    setcallmessages(value => [...value, { mode: "SENDING", message: message, imgUrl: user.user?.imageUrl }])
    setmessage("")

  }


  async function updatechat(data: { id: string, room: string, message: string, imgUrl?: string }) {

    if (data.id == user.user?.emailAddresses[0].emailAddress) return;


    setcallmessages(prevMessages => [
      ...prevMessages,
      { mode: "RECIEVING", message: data.message, imgUrl: data.imgUrl }
    ]);

  }

  // END CALL - ADMIN ONLY
  const endCall = async () => {
    if (!socket_chat) {
      alert("wait for 2-3 seconds , sockets are not initialised")
      return;
    }
    const roomcode = pathname.split("/")[1]

    let result = await deleteRoom(roomcode)
    if (result) {
      socket_chat?.emit("ENDCALL", { room: roomcode })
      setsecure(false)
      setisAdmin(false)
      router.push("/main")
    }
    else {
      alert("Error Deleting Room")
    }

  }

  // LEAVING CALL - ANYONE
  const leavecall = () => {
    //sockeet disconnect and redirect to main page
    socket_chat?.disconnect()
    socket_join_admin?.disconnect()
    router.push("/main")

  }
  return (
    <div className='flex h-full w-full '>
      CallingPage
      {/* only admin visible button */}
      {isAdmin &&
        <Button onClick={endCall} disabled={loading}>
          End Call
        </Button>
      }

      {/* leaving call button for users  */}
      <Button onClick={leavecall} disabled={loading}>
        Leave Call
      </Button>
      {
        isAdmin && <div>Admin</div>

      }
      <video ref={videoref} autoPlay className='h-40 w-40' ></video>
      <video ref={incomingvideoref} autoPlay className='h-40 w-40' ></video>
      <Button onClick={startVideo}>Start Video</Button>
      <Button onClick={stopVideo}>Stop Video</Button>


      <div className=" flex-1 p:2 sm:p-6 justify-between flex flex-col h-screen">
        <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
          <div className="relative flex items-center space-x-4">

            <div className="flex flex-col leading-tight">
              <div className="text-2xl mt-1 flex items-center">
                <span className="text-gray-700 mr-3">CallChat</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" className="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
            <button type="button" className="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </button>
            <button type="button" className="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </button>
          </div>
        </div>
        <div id="messages" className=" flex flex-col space-y-4 p-3 overflow-y-auto overflow-x-hidden scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
          {callmessages.length > 0 && callmessages.map((message, index) =>

            <MessageContainer key={index} reference={index === callmessages.length - 1 ? lastMessageRef : null} type={message.mode} title={message.message} imgUrl={message.imgUrl} />
          )}



        </div>
        <div className="border-t-2 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
          <form className="relative flex" onSubmit={(e) => { e.preventDefault(); sendmessage(message) }}>
            <span className="absolute inset-y-0 flex items-center">
              <button type="button" className="inline-flex items-center justify-center rounded-full h-12 w-12 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </button>
            </span>
            <input type="text" onChange={(e) => { console.log(callmessages); setmessage(e.target.value) }} value={message} placeholder="Write your message!" className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-12 bg-gray-200 rounded-md py-3" />
            <div className="absolute right-0 items-center inset-y-0 hidden sm:flex">
              <button type="button" className="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
              </button>
              <button type="button" className="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
              <button type="button" className="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-gray-600">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </button>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none">
                <span className="font-bold">Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 ml-2 transform rotate-90">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}

export default CallingPage