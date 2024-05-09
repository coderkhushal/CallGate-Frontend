import { Webhook, WebhookRequiredHeaders } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from "@/lib/db"
import { NextResponse } from 'next/server';
import { IncomingHttpHeaders } from 'http';
import { createUser, updatUser } from '@/actions/user';

const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_WEBHOOK_SECRET || ""

type EventType = "user.created" | "user.updated" | "user.deleted";
type Event = {
  data: Record<string, string | number | any>;
  object: "event";
  type: EventType;
};
async function handler(request: Request) {
  const payload = await request.json();
  const headersList = headers();
  const heads = {
    "svix-id": headersList.get("svix-id"),
    "svix-timestamp": headersList.get("svix-timestamp"),
    "svix-signature": headersList.get("svix-signature"),
  };
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: Event | null = null;

  try {
    evt = wh.verify(
      JSON.stringify(payload),
      heads as IncomingHttpHeaders & WebhookRequiredHeaders
    ) as Event;
  } catch (err) {
    console.error((err as Error).message);
    return NextResponse.json({}, { status: 400 });
  }

  const eventType: EventType = evt.type;
  if (eventType === "user.created" ) {
    
    const {profile_image_url, first_name, id, last_name, email_addresses} = evt.data
    const user = await createUser(email_addresses[0].email_address, first_name + " " + last_name)
    if(!user){
      alert("user could not be created , some error occured")
    }

  }
  if(eventType === "user.updated"){
    const {profile_image_url, first_name, id, last_name, email_addresses} = evt.data
    const updateduser = await updatUser(email_addresses[0].email_address, first_name + " " + last_name)
    if(!updateduser){
      alert("user could not be updated , some error occured")
    
    }
  }
    return new Response("", { status: 200 }) 
}




export const GET = handler;
export const POST = handler;
export const PUT = handler;