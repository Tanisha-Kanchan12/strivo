import { NextResponse } from "next/server";
import { expireLiveNowSessions } from "@/lib/live-now";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await expireLiveNowSessions();
    return NextResponse.json({ expired });
  } catch (error) {
    console.error("Cron expire-live-now error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
