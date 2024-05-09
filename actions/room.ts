"use server"

import { prisma } from '@/lib/db'
import { Room, User } from '@prisma/client'

export const createroom = async ({ code, admin }: { code: string, admin: User }) => {
    let room = await prisma.room.create({
        data: {
            code: code,
            adminId: admin.id
        }
    })

    // associate room with user
    await joinroom(room.id , admin)
    return room.id
}
export const joinroom= async(roomid: string , user: User)=>{
    try{
        
        let updatedroom = await prisma.userRoom.create({
            data: {
                userId: user.id,
                roomId: roomid
            }
        })
        if(updatedroom){
            return true;
        }
        else{
            return false;
        }
    }
    catch(err){
        console.error('Error creating user-room association:', err);
        return false;
    }
}

export const finduserinRoom = async(room: string , user: User)=>{
    return await prisma.userRoom.findFirst({
        where: {
            roomId: room,
            userId: user.id
        }
    })
}
export const findRoom = async (code: string) => {
    return await prisma.room.findFirst({
        where: {
            code: code
        }
    })
    
}

export const deleteRoom = async (roomCode: string) => {
    try {

        let room = await findRoom(roomCode)

        if (!room) {
            throw new Error('Room not found');
            return false;
        }


        // Remove associations between the deleted room and users
        await prisma.userRoom.deleteMany({
            where: {
                roomId: room.id,
            },
        });

        // Delete the room
        await prisma.room.delete({
            where: {
                id: room.id,
            },
        });


        return true;
    }
    catch (error) {
        console.error('Error deleting room and updating users:', error);
        return false;// Rethrow the error for handling in the caller
    }
}