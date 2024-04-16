"use client"
import { Button } from "@/components/ui/button";
import { z } from "zod"
const SERVER = process.env.NEXT_PUBLIC_SERVER!
import axios from "axios"
import { UserButton, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation";
import { prisma } from "@/lib/db";
import { findUser } from "@/actions/user";
import { createroom } from "@/actions/room";
import { useJoinContext } from "@/context/JoinContext";





const joinSchema = z.object({
    code: z.string().min(9).max(9, {
        message: "Code must be 9 characters long"
    }),
})

/* eslint-disable @next/next/no-img-element */
export default function Home() {
    const user = useUser()
    const router = useRouter()
    const {setroomid, setisAdmin} = useJoinContext()
    // 1. Define your form.
    const form = useForm<z.infer<typeof joinSchema>>({
        resolver: zodResolver(joinSchema),
        defaultValues: {
            code: "",
        },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof joinSchema>) {
        router.push(values.code + "/join")
    }

    const startcall = async () => {
        if (!user.user) {
            alert("Please login first")
            return
        }
        axios.get(`${SERVER}/room/newroom`).then(async (res) => {
            const admin = await findUser(user.user?.emailAddresses[0].emailAddress)
            console.log(admin)
            if (!admin) {
                alert("user not found in database")
                return;
            }
            let roomid = await createroom({ code: res.data, admin: admin })
            setroomid(roomid)
            setisAdmin(true)
            router.push(res.data)
        })
    }
    return (
        <div >
            <UserButton />
            <Button onClick={startcall}>
                Start a call
            </Button>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="abcdefghi" {...field} />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>

        </div>
    );
}
