import { NextResponse } from "next/server";
import { runProgressNudgeCron } from "@/lib/ai/nudge";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await runProgressNudgeCron();
    return NextResponse.json({ sent });
  } catch (error) {
    console.error("Cron ai-nudge error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
