import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher-server";

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await clerkAuth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json(
        { error: "Pusher not configured" },
        { status: 503 }
      );
    }

    if (channelName.startsWith("private-notifications-")) {
      const channelUserId = channelName.replace("private-notifications-", "");
      if (channelUserId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (channelName.startsWith("private-focus-")) {
      const pairId = channelName.replace("private-focus-", "");
      const pair = await prisma.connectedPair.findUnique({
        where: { id: pairId },
        select: { user1Id: true, user2Id: true },
      });

      if (!pair || (pair.user1Id !== user.id && pair.user2Id !== user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (channelName.startsWith("private-chat-")) {
      const pairId = channelName.replace("private-chat-", "");
      const pair = await prisma.connectedPair.findUnique({
        where: { id: pairId },
        select: { user1Id: true, user2Id: true },
      });

      if (!pair || (pair.user1Id !== user.id && pair.user2Id !== user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const channelAuth = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(channelAuth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
