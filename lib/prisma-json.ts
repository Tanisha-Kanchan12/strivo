import type { HackathonRole, StudyTime } from "@prisma/client";

export function asStudyTimes(value: unknown): StudyTime[] {
  return Array.isArray(value) ? (value as StudyTime[]) : [];
}

export function asHackathonRoles(value: unknown): HackathonRole[] {
  return Array.isArray(value) ? (value as HackathonRole[]) : [];
}
