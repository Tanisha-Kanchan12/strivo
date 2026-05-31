import type { StudyGoal } from "@prisma/client";
import {
  getSyllabusForGoal,
  GOALS_WITH_PRESEEDED_TOPICS,
  isPlaceholderTopicName,
} from "@/lib/constants/syllabus-seed";
import prisma from "@/lib/prisma";

export async function purgePlaceholderTopics(userId: string) {
  const topics = await prisma.syllabusTopic.findMany({
    where: { userId },
    select: { id: true, topicName: true },
  });

  const placeholderIds = topics
    .filter((t) => isPlaceholderTopicName(t.topicName))
    .map((t) => t.id);

  if (placeholderIds.length > 0) {
    await prisma.syllabusTopic.deleteMany({
      where: { id: { in: placeholderIds } },
    });
  }
}

export async function seedSyllabusForUser(userId: string, goal: StudyGoal) {
  await purgePlaceholderTopics(userId);

  const syllabus = getSyllabusForGoal(goal);
  const existingCount = await prisma.syllabusTopic.count({ where: { userId } });

  if (existingCount > 0) return;

  const rows = syllabus.flatMap(({ subject, topics }) =>
    topics.map((topicName) => ({
      userId,
      goal,
      subject,
      topicName,
    }))
  );

  if (rows.length > 0 && GOALS_WITH_PRESEEDED_TOPICS.includes(goal)) {
    await prisma.syllabusTopic.createMany({ data: rows });
  }
}

export function getSubjectShellsForGoal(goal: StudyGoal): string[] {
  return getSyllabusForGoal(goal).map((s) => s.subject);
}

export function computeSyllabusProgress(
  topics: { subject: string; isComplete: boolean }[]
) {
  const bySubject = new Map<string, { total: number; complete: number }>();

  for (const t of topics) {
    const entry = bySubject.get(t.subject) ?? { total: 0, complete: 0 };
    entry.total += 1;
    if (t.isComplete) entry.complete += 1;
    bySubject.set(t.subject, entry);
  }

  const subjects = Array.from(bySubject.entries()).map(([subject, stats]) => ({
    subject,
    total: stats.total,
    complete: stats.complete,
    percent: stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0,
  }));

  const totalTopics = topics.length;
  const completeTopics = topics.filter((t) => t.isComplete).length;
  const overallPercent =
    totalTopics > 0 ? Math.round((completeTopics / totalTopics) * 100) : 0;

  return { subjects, overallPercent, totalTopics, completeTopics };
}

export function buildSubjectsWithShells(
  goal: StudyGoal,
  topics: { subject: string; isComplete: boolean }[]
) {
  const shells = getSubjectShellsForGoal(goal);
  const progress = computeSyllabusProgress(topics);
  const progressMap = new Map(progress.subjects.map((s) => [s.subject, s]));

  return shells.map((subject) => {
    const existing = progressMap.get(subject);
    return (
      existing ?? {
        subject,
        total: 0,
        complete: 0,
        percent: 0,
      }
    );
  });
}
