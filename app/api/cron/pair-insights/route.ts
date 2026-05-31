import { NextResponse } from "next/server";
import { runPairInsightsCron } from "@/lib/ai/pair-insights";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const generated = await runPairInsightsCron();
    return NextResponse.json({ generated });
  } catch (error) {
    console.error("Cron pair-insights error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
