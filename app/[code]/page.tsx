"use client"
import React, { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { deleteRoom, findRoom } from '@/actions/room'
import { Socket, io } from "socket.io-client"
import { UserButton, useUser } from '@clerk/nextjs'
import { useJoinContext } from '@/context/JoinContext'
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import MessageMain from '@/components/Chatting/MessageMain'

const SERVER = process.env.NEXT_PUBLIC_SERVER
const CallingPage = () => {


  const user = useUser()



  const { isAdmin, currentuser, roomid, secure, setsecure, setisAdmin } = useJoinContext()
  const [socket_chat, setsocket_chat] = useState<Socket | null>(null)
  const [socket_video, setsocket_video] = useState<Socket | null>(null)
  const [socket_join_admin, setsocket_join_admin] = useState<Socket | null>(null)
  const [loading, setloading] = useState<boolean>(false)
  const [mediastream, setmediastream] = useState<MediaStream | null>(null)
  const [callmessages, setcallmessages] = useState<{ mode: "RECIEVING" | "SENDING", message: string, imgUrl?: string }[]>([])
  const [mediarec, setmediarec] = useState<MediaRecorder | null>(null)
  const [mymediasource, setmymediasource] = useState<MediaSource>(new MediaSource())
  const [videosource, setvideosource] = useState<SourceBuffer>()
  // VIDEO CALLING SERVICE 
  const videoref = React.useRef<HTMLVideoElement>(null)
  const incomingvideoref = React.useRef<HTMLVideoElement>(null)


  const togglevideo = async () => {
    if (mediastream) {

      mediastream.getTracks().forEach((track: any) => track.stop())
      if (videoref.current) {
        videoref.current.srcObject = null
      }
      setmediastream(null)

      setmediarec(null)
    }
    else {
      if (!videoref.current) return;

      // creating a stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setmediastream(value => stream)
      //showing it to user
      videoref.current.srcObject = stream
      // recording media
      const mediarectemp = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000

      })

      mediarectemp.ondataavailable = (e) => {
        socket_video?.emit("STREAM", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress, stream: e.data })

      }
      mediarectemp.start(2000)
      setmediarec(value => mediarectemp)
    }
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
    const _socket_video = io(SERVER + "/video")

    if (!incomingvideoref.current) {
      return;
    }
    incomingvideoref.current.src = URL.createObjectURL(mymediasource);

    mymediasource.onsourceopen = () => {

      let videosourcetemp = mymediasource.addSourceBuffer("video/mp4; codecs=avc1.42E01E, mp4a.40.2")
      setvideosource((value) => videosourcetemp)
      
         // VIDEO ROOM SOCKETS FOR EVERYONE 
    _socket_video.on("STREAM", (data: {stream : ArrayBuffer})=>{
      if(mymediasource.readyState=="closed" || mymediasource.readyState=="ended") return;
      console.log("streaming recieving", data.stream)
      // videosource?.appendBuffer(data.stream)
      mymediasource.addSourceBuffer('video/webm; codecs="vorbis,vp8"')
      
       
    })



    }

 

    _socket_chat.emit("JOIN", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })
    setsocket_join_admin(_socket_join_admin)
    _socket_video.emit("JOIN", { email: user.user?.emailAddresses[0].emailAddress, room: pathname.split("/")[1] })
    setsocket_video(value => _socket_video)



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

      _socket_video.disconnect()

    })
  }, [SERVER, user.user, currentuser,incomingvideoref, roomid, secure])

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
    setsecure(false)
    socket_chat?.disconnect()
    socket_join_admin?.disconnect()
    router.push("/main")

  }
  return (
    <div className='flex flex-col   h-screen'>
      <div className="flex justify-between items-center p-4 bg-gray-100">
        <h1 className="text-3xl font-semibold text-gray-800">CallChat</h1>
        <div className="flex space-x-4">
          <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none">
            <UserButton />
          </button>
          {/* Add other buttons */}
        </div>
      </div>

      <div className='flex h-4/5'>


        {/* messages section  */}

        <div className='hidden lg:block'>
          <MessageMain sendmessage={sendmessage} callmessages={callmessages} />

        </div>
        <div className="w-full h-4/6 sm:space-y-4 md:space-y-4 md:grid lg:grid lg:grid-cols-3 md:grid-cols-2 sm:flex justify-center items-center p-5 overflow-y-auto ">

          <video ref={incomingvideoref} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-black"></video>
          <video ref={videoref} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-black"></video>


        </div>
      </div>






      {/* controls  */}
      <div className='flex absolute bottom-0 justify-between p-5 w-full bg-gray-200  mt-2 space-x-4'>

        {/* Video controls */}

        <button onClick={togglevideo} className="w-full py-2 px-4 bg-green-500 hover:bg-green-400 text-white  flex justify-center font-semibold rounded-md focus:outline-none">
          {mediastream ? <VideoOff /> : <Video />}
        </button>

        {/* audio controls  */}
        <button onClick={togglevideo} className="w-full py-2 px-4 bg-green-500 hover:bg-green-400 text-white  flex justify-center font-semibold rounded-md focus:outline-none">
          {mediastream ? <Mic /> : <MicOff />}
        </button>




        {/* User controls */}

        <button onClick={leavecall} disabled={loading} className="w-full py-2 px-4 bg-red-500 hover:bg-red-400 flex justify-center text-white font-semibold rounded-md focus:outline-none">
          <PhoneOff />
        </button>




        {/* Admin controls */}
        {isAdmin && (

          <button onClick={endCall} disabled={loading} className="w-full py-2 px-4 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-md focus:outline-none text-center">
            End Call
          </button>
        )}


      </div>



    </div>
  )
}

export default CallingPage