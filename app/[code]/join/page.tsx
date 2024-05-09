"use client"
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { prisma } from '@/lib/db'
import { Socket, io } from "socket.io-client"
import { findRoom, finduserinRoom, joinroom } from '@/actions/room'
import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@radix-ui/react-toast'
import { useJoinContext } from '@/context/JoinContext'
import { findUser } from '@/actions/user'
const SERVER = process.env.NEXT_PUBLIC_SERVER
const WaitingPage = ({ params }: { params: { code: string } }) => {
    const [loading, setloading] = useState<boolean>(true)
    const [socket_join, setsocket_join] = useState<Socket | null>(null)
    const { isAdmin, checkadmin, currentuser, ValidateJoiningScreen, roomid } = useJoinContext()
    const user = useUser()
    const pathname = usePathname()
    const router = useRouter()



    useEffect(() => {
        if (!SERVER) return
        console.log("connectig to server")

        // Check room exist, user exists, if user is admin ,update current user and roomid
        ValidateJoiningScreen(params.code).then(() => {

            setloading(false)

        })


        const _socket_join = io(SERVER + "/join")
        _socket_join.emit("JOINROOM", { room: pathname.split("/")[1] })
        _socket_join.on("APPROVE", async (data: { room: string, email: string, roomid: string }) => {

            // if the email is not the same as the user email, return
            if (user.user?.emailAddresses[0].emailAddress != data.email) { return; }

            //DATABASE UPDATION TO JOIN USER IN ROOM
            let result = false;
            // todo: minimise this database call using currentuser
            let cuser = await findUser(data.email)
            console.log(cuser)

            if (cuser && data.roomid) {
                result = await joinroom(data.roomid, cuser)
            }
            // if user joined in room updated in database then only user can join the room
            if (result) {
                // if the user is admitted, disconnect the socket and update the database
                socket_join?.disconnect()
                setsocket_join(null)
                router.push("/" + data.room)
            }
            else {
                alert("Error joining the room , because of database error , maybe you are not authenticated to database")
            }


        })

        _socket_join.on("REJECT", (data: { route: string, email: string }) => {
            // if the email is not the same as the user email, return
            if (user.user?.emailAddresses[0].emailAddress != data.email) { return; }
            toast({
                title: data.email + " was rejected",
                action: <ToastAction altText="Try again" onClick={requestjoin}>Try again</ToastAction>
            })
        })

        setsocket_join(_socket_join)
        return (() => {
            _socket_join.disconnect()
        })
    }, [SERVER, user.user])
    const requestjoin = async () => {
        if (!currentuser) { alert("current user not found "); return; }
        if (isAdmin) {
            router.push("/" + pathname.split("/")[1])
            return;
        }

        //MAYBE ADMIN HAS ALREADY ADMITTED THE USER
        if(roomid){

            let exisitingroom = await finduserinRoom(roomid, currentuser)
            if (exisitingroom) {
                router.push("/" + pathname.split("/")[1]);
                return;
            }
        }
        else{
            alert("roomid not found asking admin for permission")
        }
        socket_join?.emit("REQUEST", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })
    }
    return (
        <div>
            <Button onClick={requestjoin} disabled={loading}>
                Join
            </Button>
        </div>
    )
}

export default WaitingPage