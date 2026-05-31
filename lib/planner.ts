import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import prisma from "@/lib/prisma";

const MAX_PLAN_DAYS = 90;

export function tasksPerDayFromHours(hours: number): number {
  if (hours <= 2) return 3;
  if (hours <= 4) return 4;
  return 5;
}

export async function generatePlanTasks(input: {
  planId: string;
  userId: string;
  examDate: Date;
  subjects: string[];
  dailyHoursTarget: number;
}) {
  const today = startOfDay(new Date());
  const examDay = startOfDay(input.examDate);
  const rawDays = differenceInCalendarDays(examDay, today);
  const daysRemaining = Math.max(1, Math.min(MAX_PLAN_DAYS, rawDays));
  const tasksPerDay = tasksPerDayFromHours(input.dailyHoursTarget);

  const topics = await prisma.syllabusTopic.findMany({
    where: {
      userId: input.userId,
      isComplete: false,
      ...(input.subjects.length > 0
        ? { subject: { in: input.subjects } }
        : {}),
    },
    orderBy: [{ subject: "asc" }, { topicName: "asc" }],
  });

  const subjects =
    input.subjects.length > 0
      ? input.subjects
      : topics.length > 0
        ? [...new Set(topics.map((t) => t.subject))]
        : ["General"];

  const taskPool: { taskText: string; subject: string }[] = [];

  if (topics.length > 0) {
    for (const t of topics) {
      taskPool.push({
        taskText: `Study: ${t.topicName}`,
        subject: t.subject,
      });
    }
  }

  const genericTemplates = [
    "Concept revision",
    "Practice problems",
    "Mock questions",
    "Formula drill",
    "Previous year questions",
    "Doubt clearing session",
    "Quick recap notes",
  ];

  while (taskPool.length < daysRemaining * tasksPerDay) {
    for (const subject of subjects) {
      for (const template of genericTemplates) {
        taskPool.push({
          taskText: `${subject}: ${template}`,
          subject,
        });
        if (taskPool.length >= daysRemaining * tasksPerDay) break;
      }
      if (taskPool.length >= daysRemaining * tasksPerDay) break;
    }
    if (taskPool.length >= daysRemaining * tasksPerDay) break;
    taskPool.push({
      taskText: `${subjects[0]}: Mixed practice`,
      subject: subjects[0]!,
    });
  }

  const rows: {
    planId: string;
    userId: string;
    date: Date;
    taskText: string;
    subject: string;
  }[] = [];

  let idx = 0;
  for (let d = 0; d < daysRemaining; d++) {
    const date = addDays(today, d);
    for (let t = 0; t < tasksPerDay; t++) {
      const item = taskPool[idx % taskPool.length]!;
      rows.push({
        planId: input.planId,
        userId: input.userId,
        date,
        taskText: item.taskText,
        subject: item.subject,
      });
      idx++;
    }
  }

  if (rows.length > 0) {
    await prisma.planTask.createMany({ data: rows });
  }

  return rows.length;
}

export async function moveTaskToNextDay(taskId: string, userId: string) {
  const task = await prisma.planTask.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) return;

  const nextDay = addDays(startOfDay(task.date), 1);

  await prisma.planTask.update({
    where: { id: taskId },
    data: {
      date: nextDay,
      isComplete: false,
      skippedAt: null,
    },
  });
}
