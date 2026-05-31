import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const scores = await prisma.scoreLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    });

    const bySubject = new Map<string, { total: number; count: number }>();
    for (const s of scores) {
      const entry = bySubject.get(s.subject) ?? { total: 0, count: 0 };
      entry.total += (s.score / s.maxScore) * 100;
      entry.count += 1;
      bySubject.set(s.subject, entry);
    }

    const subjectAverages = Array.from(bySubject.entries()).map(
      ([subject, stats]) => ({
        subject,
        averagePercent:
          stats.count > 0 ? Math.round(stats.total / stats.count) : 0,
      })
    );

    let weakSubject: string | null = null;
    if (subjectAverages.length > 0) {
      weakSubject = subjectAverages.reduce((min, cur) =>
        cur.averagePercent < min.averagePercent ? cur : min
      ).subject;
    }

    return NextResponse.json({
      scores: scores.map((s) => ({
        id: s.id,
        testName: s.testName,
        date: s.date.toISOString(),
        score: s.score,
        maxScore: s.maxScore,
        subject: s.subject,
        notes: s.notes,
        sharedWithPair: s.sharedWithPair,
        percent: Math.round((s.score / s.maxScore) * 100),
      })),
      subjectAverages,
      weakSubject,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/scores error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();

    const testName = String(body.testName ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const score = Number(body.score);
    const maxScore = Number(body.maxScore);
    const notes = body.notes ? String(body.notes).trim() : null;
    const date = body.date ? new Date(body.date) : new Date();

    if (!testName) return badRequestResponse("Test name is required");
    if (!subject) return badRequestResponse("Subject is required");
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
      return badRequestResponse("Invalid score values");
    }

    const log = await prisma.scoreLog.create({
      data: {
        userId: user.id,
        testName,
        subject,
        score,
        maxScore,
        notes,
        date,
      },
    });

    return NextResponse.json({ score: { id: log.id } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/scores error:", error);
    return serverErrorResponse();
  }
}
