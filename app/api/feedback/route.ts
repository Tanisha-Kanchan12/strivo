import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { sendFeedbackNotificationEmail } from "@/lib/email";
import prisma from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validations/feedback";

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(parsed.error.errors[0]?.message ?? "Invalid feedback");
    }

    const { type, message, screenshotUrl } = parsed.data;

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        type,
        message,
        screenshotUrl: screenshotUrl ?? null,
      },
    });

    const timestamp = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    sendFeedbackNotificationEmail({
      userName: user.name ?? "Strivo user",
      userEmail: user.email ?? "no-email",
      feedbackType: type,
      message,
      timestamp,
      screenshotUrl,
    }).catch((err) => console.error("Feedback email error:", err));

    return NextResponse.json({
      success: true,
      id: feedback.id,
      message: "Thanks! We'll get back to you soon.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/feedback error:", error);
    return serverErrorResponse();
  }
}
