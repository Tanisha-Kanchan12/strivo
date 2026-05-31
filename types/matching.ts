import type { MatchCandidate } from "@/lib/matching";

export interface MatchFeedState {
  matches: MatchCandidate[];
  skippedIds: Set<string>;
  sentIds: Set<string>;
  activeFilter: string;
  isLoading: boolean;
  error: string | null;
}

export interface FilterChipData {
  id: string;
  label: string;
}
