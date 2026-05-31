import { NextResponse } from "next/server";
import { createNotifications } from "@/lib/notifications";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const expiredRequests = await prisma.pairRequest.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      include: {
        sender: { select: { name: true } },
        receiver: { select: { name: true } },
      },
    });

    if (expiredRequests.length === 0) {
      return NextResponse.json({ expired: 0 });
    }

    await prisma.pairRequest.updateMany({
      where: {
        id: { in: expiredRequests.map((r) => r.id) },
      },
      data: { status: "EXPIRED" },
    });

    const notifications = expiredRequests.flatMap((req) => [
      {
        userId: req.senderId,
        type: "CONNECT_EXPIRED" as const,
        content: `Your connect request to ${req.receiver.name ?? "a student"} expired`,
        data: { pairRequestId: req.id },
      },
      {
        userId: req.receiverId,
        type: "CONNECT_EXPIRED" as const,
        content: `Connect request from ${req.sender.name ?? "a student"} expired`,
        data: { pairRequestId: req.id },
      },
    ]);

    await createNotifications(notifications);

    return NextResponse.json({ expired: expiredRequests.length });
  } catch (error) {
    console.error("Cron expire-requests error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
