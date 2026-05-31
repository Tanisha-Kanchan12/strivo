import type { LiveNowTopic } from "@prisma/client";

export const LIVE_NOW_DURATION_MS = 30 * 60 * 1000;

export const LIVE_NOW_TOPICS: {
  value: LiveNowTopic;
  label: string;
}[] = [
  { value: "PM_CASE", label: "PM Case" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "MOCK_INTERVIEW", label: "Mock Interview" },
  { value: "GD_PRACTICE", label: "GD Practice" },
  { value: "HACKATHON", label: "Hackathon" },
];

export function formatLiveNowTopic(topic: LiveNowTopic): string {
  return LIVE_NOW_TOPICS.find((t) => t.value === topic)?.label ?? topic;
}
