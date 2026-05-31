import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in15 = new Date(now.getTime() + 15 * 60 * 1000);
    const in16 = new Date(now.getTime() + 16 * 60 * 1000);

    const sessions = await prisma.sessionSchedule.findMany({
      where: {
        scheduledAt: { gte: in15, lt: in16 },
      },
      include: {
        pair: {
          select: { user1Id: true, user2Id: true },
        },
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json({ reminded: 0 });
    }

    const notifications = sessions.flatMap((s) => {
      const when = s.scheduledAt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return [s.pair.user1Id, s.pair.user2Id].map((userId) => ({
        userId,
        type: "SESSION_REMINDER" as const,
        content: `Study session starts in 15 minutes (${when})`,
        data: {
          pairId: s.pairId,
          sessionId: s.id,
          meetLink: s.meetLink,
        },
      }));
    });

    await createNotifications(notifications);

    return NextResponse.json({ reminded: sessions.length });
  } catch (error) {
    console.error("Cron session-reminders error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
