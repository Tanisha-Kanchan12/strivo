import { NextResponse } from "next/server";
import {
  runWeeklyGoalsFridayCron,
  runWeeklyGoalsMondayCron,
  runWeeklyGoalsSundayCron,
} from "@/lib/weekly-goals";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phase = searchParams.get("phase") ?? "monday";

  try {
    if (phase === "friday") {
      const sent = await runWeeklyGoalsFridayCron();
      return NextResponse.json({ phase, sent });
    }
    if (phase === "sunday") {
      const sent = await runWeeklyGoalsSundayCron();
      return NextResponse.json({ phase, sent });
    }
    const sent = await runWeeklyGoalsMondayCron();
    return NextResponse.json({ phase: "monday", sent });
  } catch (error) {
    console.error("Cron weekly-goals error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
