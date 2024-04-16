
"use client"
import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { deleteRoom, findRoom } from '@/actions/room'
import { Socket, io } from "socket.io-client"
import { useUser } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster"

import { useJoinContext } from '@/context/JoinContext'
import { toast } from '@/components/ui/use-toast'
import { ToastAction, ToastDescription } from '@radix-ui/react-toast'
import { checkUserAllowed } from '@/actions/user'
import { set } from 'zod'
const SERVER = process.env.NEXT_PUBLIC_SERVER
const CallingPage = () => {
  const user = useUser()

  const {  isAdmin , currentuser, roomid, secure, setsecure} = useJoinContext()
  const [socket_chat, setsocket_chat] = useState<Socket | null>(null)
  const [socket_join_admin, setsocket_join_admin] = useState<Socket | null>(null)
  const [loading, setloading] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // If the use is not admin only then check the admin status

      if(!secure){
        router.push("/"+ pathname.split("/")[1] + "/join")
      }
    
    
    const _socket_chat = io(SERVER + "/chat")
    const _socket_join_admin = io(SERVER + "/join")
    
    _socket_chat.emit("JOIN", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })
    setsocket_join_admin(_socket_join_admin)
    
    
      // CHATTING ROOM SOCKETS FOR EVERYONE
    _socket_chat.on("JOINED", (data: any) => {
      if(data.email != user.user?.emailAddresses[0].emailAddress){

        alert(data.email + " joined the chatting room")
      }
    })

    _socket_chat.on("ENDED", ()=>{
      setsecure(false)
    })


    // JOINING ROOM FOR ADMIN SOCKETS
    if(isAdmin){

      // for admin only - to admit user
      _socket_join_admin.emit("JOINROOM", { room: pathname.split("/")[1] })
    }

    // for chatting - can be listened by all
    _socket_chat.on("joined", (data: any) => {
      console.log(data)
      alert(data.email + " joined the room")
    })




    // admin actions
    _socket_join_admin.on("REQUEST", (data: { room: string, email: string }) => {

      alert("user want to join the room")

      let result =confirm("do you want to admit the user" + data.email + " ?")
      if(result){
        admit(_socket_join_admin, data.email)
      }
      else{
        reject(_socket_join_admin, data.email)
      
      }
    }
    )



    joinChatSocket()

    setsocket_chat(_socket_chat)

    return (() => {
      _socket_chat.disconnect()
      _socket_join_admin.disconnect()

    })
  }, [SERVER, user.user, currentuser, roomid,secure  ])

  // admin actions - admit
  const admit = (_socket_join_admin: Socket, useremail: string) => {
    console.log(useremail + " admitting")
    
    _socket_join_admin.emit("APPROVE", { room: pathname.split("/")[1], email: useremail,roomid: roomid })
    
  }
  // admin actions - reject
  const reject = (_socket_join_admin: Socket, useremail: string) => {
    _socket_join_admin.emit("REJECT", { room: pathname.split("/")[1], email: useremail })
  }


  // join chat socket
  const joinChatSocket = async () => {
    if (!socket_chat) return;
    socket_chat.emit("JOIN", { room: pathname.split("/")[1] });
  }

  // for admin to end the call
  const endCall = async () => {
    // End call logic here
    const roomcode = pathname.split("/")[1]

    let result = await deleteRoom(roomcode)
    if (result) {
      router.push("/main")
    }
    else {
      alert("Error Deleting Room")
    }

  }

  // for users to leave call
  const leavecall = () => {
    //sockeet disconnect and redirect to main page
    socket_chat?.disconnect()
    socket_join_admin?.disconnect()
    router.push("/main")

  }
  return (
    <div>CallingPage
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
    </div>
  )
}

export default CallingPage