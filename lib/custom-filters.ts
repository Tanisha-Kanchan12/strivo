export const CUSTOM_FILTER_PREFIX = "CUSTOM_";

export function customFilterId(dbId: string): string {
  return `${CUSTOM_FILTER_PREFIX}${dbId}`;
}

export function parseCustomFilterId(filter: string): string | null {
  if (!filter.startsWith(CUSTOM_FILTER_PREFIX)) return null;
  return filter.slice(CUSTOM_FILTER_PREFIX.length);
}

export function matchesCustomFilterLabel(
  label: string,
  candidate: {
    goal: string | null;
    field: string | null;
    subjects: string[];
    name: string | null;
    college: string | null;
    stream: string | null;
    bio: string | null;
  }
): boolean {
  const q = label.trim().toLowerCase();
  if (!q) return false;

  const haystack = [
    candidate.name,
    candidate.field,
    candidate.college,
    candidate.stream,
    candidate.bio,
    candidate.goal,
    ...candidate.subjects,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}
