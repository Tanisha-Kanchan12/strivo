import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

const userSelect = {
  id: true,
  name: true,
  profile: {
    select: { city: true, college: true, profilePicUrl: true },
  },
  onboarding: { select: { goal: true, field: true } },
} as const;

export async function GET(request: Request) {
  try {
    const { user } = await requireDbUser();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab");

    if (tab === "sent") {
      const sent = await prisma.pairRequest.findMany({
        where: { senderId: user.id },
        include: { receiver: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ sent });
    }

    if (tab === "received") {
      const received = await prisma.pairRequest.findMany({
        where: { receiverId: user.id },
        include: { sender: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ received });
    }

    const [incoming, outgoing] = await Promise.all([
      prisma.pairRequest.findMany({
        where: { receiverId: user.id, status: "PENDING" },
        include: { sender: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pairRequest.findMany({
        where: { senderId: user.id, status: "PENDING" },
        include: { receiver: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ incoming, outgoing });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/pair-requests error:", error);
    return serverErrorResponse();
  }
}
