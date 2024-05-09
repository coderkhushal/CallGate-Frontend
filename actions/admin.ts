"use server"

import { prisma } from "@/lib/db"

export const checkAdmin= async(roomcode: string, adminId :string)=>{
    const adminid = await prisma.room.findFirst({
        where: {
            code: roomcode
        }
    })
    if(!adminid) return false
    return adminid?.adminId === adminId
}

