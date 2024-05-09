"use server"

import { prisma } from "@/lib/db"

export const findUser= async(email : string)=>{
    const admin = await prisma.user.findUnique({
        where: {
            email : email
        }
    })
    return admin
}

export const checkUserAllowed = async(roomcode: string, userid: string)=>{
    let record= await prisma.userRoom.findFirst({
        where: {
            userId: userid,
            roomId: roomcode
        }
    })
    if(record){
        return true;
    }
    else{
        return false;
    }
}           

export const createUser= async(email : string, name: string)=>{
    const user = await prisma.user.create({
        data : {
            email : email,
            name : name,
            firstname : name.split(" ")[0],
            lastname : name.split(" ")[1],
        }
    })
    return user
}
export const updatUser = async(email: string ,name :string)=>{
    const updateduser = await prisma.user.update({
        where: {
            email: email
        }, 
        data:{
            name: name, 
            firstname : name.split(" ")[0],
            lastname : name.split(" ")[1],
        }
    })
    return updateduser
}

