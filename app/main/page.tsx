"use client"
import { Button } from "@/components/ui/button";
import { z } from "zod"
const SERVER = process.env.NEXT_PUBLIC_SERVER!
import axios from "axios"
import { UserButton, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { gsap } from "gsap";
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
import Link from "next/link";





const joinSchema = z.object({
    code: z.string().min(9).max(9, {
        message: "Code must be 9 characters long"
    }),
})

/* eslint-disable @next/next/no-img-element */
export default function Home() {

    const user = useUser()
    const router = useRouter()
    const { setroomid, setisAdmin } = useJoinContext()
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

        try {
            axios.get(`${SERVER}/room/newroom`).then(async (res) => {

                if (res.status == 429) {
                    alert("Too many requests, please try again later")
                    return;
                }
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
        catch (err) {
            console.log(err)
            alert("some error occurred")
        }



    }
    return (
        <div className="w-full p-6 space-y-8">
    <UserButton />
    <Link href="/" className="text-black font-bold text-center w-full  hover:underline">
        Home
    </Link>
    <Button onClick={startcall} className="w-full">
        Start a call
    </Button>

    <Form {...form} >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="abcdefghi"
                                {...field}
                                className="w-full"
                            />
                        </FormControl>

                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" className="w-full">
                Submit
            </Button>
        </form>
    </Form>
</div>

    );
}
