import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { customFilterId } from "@/lib/custom-filters";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const filters = await prisma.userCustomFilter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      filters: filters.map((f) => ({
        id: customFilterId(f.id),
        label: f.label,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/filters/custom error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const label = String(body.label ?? "").trim();

    if (label.length < 2) {
      return badRequestResponse("Filter name must be at least 2 characters");
    }
    if (label.length > 60) {
      return badRequestResponse("Filter name is too long");
    }

    const existing = await prisma.userCustomFilter.findUnique({
      where: { userId_label: { userId: user.id, label } },
    });
    if (existing) {
      return NextResponse.json({
        filter: { id: customFilterId(existing.id), label: existing.label },
      });
    }

    const created = await prisma.userCustomFilter.create({
      data: { userId: user.id, label },
    });

    return NextResponse.json({
      filter: { id: customFilterId(created.id), label: created.label },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/filters/custom error:", error);
    return serverErrorResponse();
  }
}
