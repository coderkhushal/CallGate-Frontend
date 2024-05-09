"use client"
import { checkAdmin } from "@/actions/admin";
import { findRoom } from "@/actions/room";
import { findUser } from "@/actions/user";
import { useUser } from "@clerk/nextjs";
import { User } from "@prisma/client";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { promise } from "zod";

// Define the interface for the context
interface JoinContextInterface {
  isAdmin: boolean;
  secure: boolean;
  checkadmin: () => Promise<void>;
  currentuser: null | User;
  ValidateJoiningScreen: (roomcode: string) => Promise<void>;
  roomid: string | undefined | null;
  setroomid: (roomid: string | undefined) => void;
  setisAdmin: (isAdmin: boolean) => void;
  setsecure: (secure: boolean) => void;
}

// Create the context with the specified interface
export const JoinContext = createContext<JoinContextInterface>({
  isAdmin: false,
  secure: false,
  checkadmin: () => Promise.resolve(),
  currentuser: null,
  ValidateJoiningScreen: () => Promise.resolve(),
  roomid: null,
  setroomid: (roomid: string | undefined) => { },
  setisAdmin: (isAdmin: boolean) => { },
  setsecure: (secure: boolean) => { }
});

// The JoinState component
const JoinState = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const user = useUser()
  const pathname = usePathname()
  const [isAdmin, setisAdmin] = useState<boolean>(false)
  const [secure, setsecure] = useState<boolean>(false)
  const [currentuser, setcurrentuser] = useState<User | null>(null)
  const [roomid, setroomid] = useState<string | null | undefined>(null)

  const checkadmin = async () => {


  }


  const ValidateJoiningScreen = async (roomcode: string) => {
    // first check if room exists
    let room = await findRoom(roomcode)
    if (!room) {
      router.push("/notfound")
    }
    // if room exists

    // Update the state of current room
    setroomid((value) => room?.id)

    // ADMIN CHECKING

    // CHECK IF THE CLERK HAS AUTHENTICATED USER
    if (!user.user) { return; }

    // CHECK IF THE USER IS ADMIN

    // find the user in the database
    const tempcurrentuser = await findUser(user.user?.emailAddresses[0].emailAddress);

    setcurrentuser((value) => tempcurrentuser)

    // if the user is not found in the database
    if (!tempcurrentuser) {
      alert("you are not authenticated to databse");
      
      router.push("/main");
      return;
    }
    // check if the user is admin
    if(room?.adminId == tempcurrentuser.id){
      setisAdmin(true)
    }
    setsecure((val)=>true)
      
  





  }

  return (
    <JoinContext.Provider value={{ isAdmin, checkadmin,setsecure,  ValidateJoiningScreen,secure, setisAdmin,  setroomid, roomid, currentuser }}>
      {children}
    </JoinContext.Provider>
  );
};

export default JoinState;

// Custom hook to use the JoinContext
export const useJoinContext = () => useContext(JoinContext);
