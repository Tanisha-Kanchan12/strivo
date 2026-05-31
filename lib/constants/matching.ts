import type { StudyGoal } from "@prisma/client";

export type FilterChipId =
  | "ALL"
  | "JEE"
  | "GATE"
  | "PLACEMENT_PREP"
  | "DATA_SCIENCE"
  | "CONSULTING"
  | "CAT"
  | "UPSC"
  | "SSC"
  | "BANK_EXAMS"
  | "RRB_NTPC"
  | "MBA_ENTRANCE"
  | "PRODUCT_MANAGEMENT"
  | "CASE_PREP"
  | "NEET"
  | "CUET"
  | "BOARD_EXAMS"
  | "COLLEGE_EXAMS"
  | "CLASS_12"
  | "CLASS_11"
  | "CLASS_10"
  | "PHYSICS"
  | "MATHS"
  | "CHEMISTRY"
  | "BIOLOGY"
  | "IELTS"
  | "CFA"
  | "CA_FOUNDATION"
  | "HACKATHON"
  | "MENTORS";

export interface FilterChip {
  id: FilterChipId;
  label: string;
  goals: StudyGoal[];
  searchTerms?: string[];
}

const ENGINEERING_GOALS: StudyGoal[] = [
  "JEE",
  "GATE",
  "PLACEMENT_PREP",
  "DATA_SCIENCE",
  "CONSULTING",
];

const COMMERCE_GOALS: StudyGoal[] = [
  "CAT",
  "UPSC",
  "SSC_CGL",
  "SSC_CHSL",
  "BANK_PO_CLERK",
  "MBA_ENTRANCE",
];

const PM_MBA_GOALS: StudyGoal[] = [
  "PRODUCT_MANAGEMENT",
  "CONSULTING",
  "CAT",
  "MBA_ENTRANCE",
];

const MEDICAL_GOALS: StudyGoal[] = ["NEET", "CUET", "BOARD_EXAMS"];

const HACKATHON_GOALS: StudyGoal[] = [
  "PLACEMENT_PREP",
  "DATA_SCIENCE",
  "PRODUCT_MANAGEMENT",
  "GATE",
  "CONSULTING",
];

const ALL_FILTER_CHIPS: Record<FilterChipId, FilterChip> = {
  ALL: { id: "ALL", label: "All", goals: [] },
  JEE: { id: "JEE", label: "JEE", goals: ["JEE"] },
  GATE: { id: "GATE", label: "GATE", goals: ["GATE"] },
  PLACEMENT_PREP: {
    id: "PLACEMENT_PREP",
    label: "Placement Prep",
    goals: ["PLACEMENT_PREP"],
  },
  DATA_SCIENCE: {
    id: "DATA_SCIENCE",
    label: "Data Science",
    goals: ["DATA_SCIENCE"],
  },
  CONSULTING: { id: "CONSULTING", label: "Consulting", goals: ["CONSULTING"] },
  CAT: { id: "CAT", label: "CAT", goals: ["CAT"] },
  UPSC: { id: "UPSC", label: "UPSC", goals: ["UPSC"] },
  SSC: {
    id: "SSC",
    label: "SSC",
    goals: ["SSC_CGL", "SSC_CHSL"],
  },
  BANK_EXAMS: {
    id: "BANK_EXAMS",
    label: "Bank Exams",
    goals: ["BANK_PO_CLERK", "RRB_NTPC"],
  },
  RRB_NTPC: {
    id: "RRB_NTPC",
    label: "RRB NTPC",
    goals: ["RRB_NTPC"],
  },
  MBA_ENTRANCE: {
    id: "MBA_ENTRANCE",
    label: "MBA",
    goals: ["MBA_ENTRANCE", "CAT"],
  },
  PRODUCT_MANAGEMENT: {
    id: "PRODUCT_MANAGEMENT",
    label: "PM",
    goals: ["PRODUCT_MANAGEMENT"],
  },
  CASE_PREP: {
    id: "CASE_PREP",
    label: "Case Prep",
    goals: ["PRODUCT_MANAGEMENT", "CONSULTING", "CAT"],
  },
  NEET: { id: "NEET", label: "NEET", goals: ["NEET"] },
  CUET: { id: "CUET", label: "CUET", goals: ["CUET"] },
  BOARD_EXAMS: {
    id: "BOARD_EXAMS",
    label: "Board Exams",
    goals: ["BOARD_EXAMS"],
  },
  COLLEGE_EXAMS: {
    id: "COLLEGE_EXAMS",
    label: "College Exams",
    goals: ["COLLEGE_EXAMS"],
  },
  PHYSICS: {
    id: "PHYSICS",
    label: "Physics",
    goals: [],
    searchTerms: ["physics"],
  },
  MATHS: {
    id: "MATHS",
    label: "Maths",
    goals: [],
    searchTerms: ["math", "maths", "mathematics"],
  },
  CHEMISTRY: {
    id: "CHEMISTRY",
    label: "Chemistry",
    goals: [],
    searchTerms: ["chemistry", "organic", "inorganic"],
  },
  BIOLOGY: {
    id: "BIOLOGY",
    label: "Biology",
    goals: [],
    searchTerms: ["biology", "botany", "zoology"],
  },
  CLASS_12: {
    id: "CLASS_12",
    label: "Class 12",
    goals: ["BOARD_EXAMS", "COLLEGE_EXAMS"],
    searchTerms: ["class 12", "12th"],
  },
  CLASS_11: {
    id: "CLASS_11",
    label: "Class 11",
    goals: ["BOARD_EXAMS", "COLLEGE_EXAMS"],
    searchTerms: ["class 11", "11th"],
  },
  CLASS_10: {
    id: "CLASS_10",
    label: "Class 10",
    goals: ["BOARD_EXAMS"],
    searchTerms: ["class 10", "10th"],
  },
  IELTS: {
    id: "IELTS",
    label: "IELTS",
    goals: ["OTHER"],
    searchTerms: ["ielts"],
  },
  CFA: {
    id: "CFA",
    label: "CFA",
    goals: ["OTHER"],
    searchTerms: ["cfa"],
  },
  CA_FOUNDATION: {
    id: "CA_FOUNDATION",
    label: "CA Foundation",
    goals: ["OTHER"],
    searchTerms: ["ca foundation", "ca"],
  },
  HACKATHON: { id: "HACKATHON", label: "Hackathon", goals: HACKATHON_GOALS },
  MENTORS: { id: "MENTORS", label: "Mentors", goals: [] },
};

/** Six recommended discover filters per onboarding goal */
const GOAL_RECOMMENDED_FILTER_IDS: Record<StudyGoal, FilterChipId[]> = {
  JEE: ["JEE", "PHYSICS", "MATHS", "CHEMISTRY", "BOARD_EXAMS", "PLACEMENT_PREP"],
  NEET: ["NEET", "BIOLOGY", "CHEMISTRY", "PHYSICS", "BOARD_EXAMS", "CUET"],
  CAT: ["CAT", "MBA_ENTRANCE", "CONSULTING", "CASE_PREP", "UPSC", "PLACEMENT_PREP"],
  PRODUCT_MANAGEMENT: [
    "PRODUCT_MANAGEMENT",
    "CONSULTING",
    "CASE_PREP",
    "MBA_ENTRANCE",
    "DATA_SCIENCE",
    "PLACEMENT_PREP",
  ],
  UPSC: ["UPSC", "SSC", "CAT", "MBA_ENTRANCE", "BANK_EXAMS", "CASE_PREP"],
  SSC_CGL: ["SSC", "BANK_EXAMS", "UPSC", "RRB_NTPC", "MBA_ENTRANCE", "CAT"],
  SSC_CHSL: ["SSC", "BANK_EXAMS", "UPSC", "RRB_NTPC", "MBA_ENTRANCE", "CAT"],
  BANK_PO_CLERK: ["BANK_EXAMS", "SSC", "RRB_NTPC", "UPSC", "MBA_ENTRANCE", "CAT"],
  RRB_NTPC: ["RRB_NTPC", "BANK_EXAMS", "SSC", "UPSC", "MBA_ENTRANCE", "CAT"],
  GATE: ["GATE", "JEE", "DATA_SCIENCE", "PLACEMENT_PREP", "CONSULTING", "MBA_ENTRANCE"],
  CUET: ["CUET", "NEET", "BOARD_EXAMS", "CLASS_12", "COLLEGE_EXAMS", "JEE"],
  BOARD_EXAMS: ["BOARD_EXAMS", "CLASS_12", "CLASS_11", "NEET", "JEE", "CUET"],
  COLLEGE_EXAMS: [
    "COLLEGE_EXAMS",
    "GATE",
    "BOARD_EXAMS",
    "PLACEMENT_PREP",
    "CLASS_12",
    "DATA_SCIENCE",
  ],
  MBA_ENTRANCE: [
    "MBA_ENTRANCE",
    "CAT",
    "CASE_PREP",
    "CONSULTING",
    "UPSC",
    "PRODUCT_MANAGEMENT",
  ],
  PLACEMENT_PREP: [
    "PLACEMENT_PREP",
    "DATA_SCIENCE",
    "CONSULTING",
    "GATE",
    "PRODUCT_MANAGEMENT",
    "MBA_ENTRANCE",
  ],
  DATA_SCIENCE: [
    "DATA_SCIENCE",
    "PLACEMENT_PREP",
    "GATE",
    "MBA_ENTRANCE",
    "CONSULTING",
    "PRODUCT_MANAGEMENT",
  ],
  CONSULTING: [
    "CONSULTING",
    "CASE_PREP",
    "CAT",
    "MBA_ENTRANCE",
    "UPSC",
    "PRODUCT_MANAGEMENT",
  ],
  OTHER: ["CAT", "JEE", "NEET", "PLACEMENT_PREP", "UPSC", "MBA_ENTRANCE"],
};

export function getFilterChip(chipId: FilterChipId): FilterChip | undefined {
  return ALL_FILTER_CHIPS[chipId];
}

export function getRecommendedDiscoverChips(
  goal: StudyGoal | null | undefined
): FilterChip[] {
  const ids = goal
    ? GOAL_RECOMMENDED_FILTER_IDS[goal]
    : GOAL_RECOMMENDED_FILTER_IDS.OTHER;
  return ids.map((id) => ALL_FILTER_CHIPS[id]);
}

export function getAllExploreFilters(): FilterChip[] {
  return (Object.keys(ALL_FILTER_CHIPS) as FilterChipId[])
    .filter((id) => id !== "ALL")
    .map((id) => ALL_FILTER_CHIPS[id])
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function chipMatchesCandidate(
  chipId: FilterChipId,
  candidate: {
    goal: StudyGoal | null;
    field: string | null;
    subjects: string[];
    name: string | null;
    college: string | null;
    stream: string | null;
  }
): boolean {
  if (chipId === "ALL") return true;
  const chip = ALL_FILTER_CHIPS[chipId];
  if (!chip) return true;

  const candidateProfile = {
    goal: candidate.goal,
    field: candidate.field,
    subjects: candidate.subjects,
    name: candidate.name,
    college: candidate.college,
    stream: candidate.stream,
  };

  const goalMatch =
    chip.goals.length > 0 &&
    candidate.goal !== null &&
    chip.goals.includes(candidate.goal);

  const searchMatch =
    chip.searchTerms !== undefined &&
    chip.searchTerms.length > 0 &&
    chip.searchTerms.some((term) => matchesSearchQuery(term, candidateProfile));

  if (chip.searchTerms?.length && chip.goals.length) {
    return goalMatch || searchMatch;
  }
  if (chip.searchTerms?.length) return searchMatch;
  if (chip.goals.length) return goalMatch;
  return true;
}

export function getFilterChipsForGoal(goal: StudyGoal | null | undefined): FilterChip[] {
  const chips: FilterChip[] = [ALL_FILTER_CHIPS.ALL];

  if (!goal) {
    chips.push(ALL_FILTER_CHIPS.HACKATHON);
    return chips;
  }

  if (ENGINEERING_GOALS.includes(goal)) {
    chips.push(
      ALL_FILTER_CHIPS.JEE,
      ALL_FILTER_CHIPS.GATE,
      ALL_FILTER_CHIPS.PLACEMENT_PREP,
      ALL_FILTER_CHIPS.DATA_SCIENCE,
      ALL_FILTER_CHIPS.CONSULTING
    );
  } else if (COMMERCE_GOALS.includes(goal)) {
    chips.push(
      ALL_FILTER_CHIPS.CAT,
      ALL_FILTER_CHIPS.UPSC,
      ALL_FILTER_CHIPS.SSC,
      ALL_FILTER_CHIPS.BANK_EXAMS,
      ALL_FILTER_CHIPS.MBA_ENTRANCE
    );
  } else if (PM_MBA_GOALS.includes(goal)) {
    chips.push(
      ALL_FILTER_CHIPS.PRODUCT_MANAGEMENT,
      ALL_FILTER_CHIPS.CONSULTING,
      ALL_FILTER_CHIPS.CAT,
      ALL_FILTER_CHIPS.CASE_PREP
    );
  } else if (MEDICAL_GOALS.includes(goal)) {
    chips.push(
      ALL_FILTER_CHIPS.NEET,
      ALL_FILTER_CHIPS.CUET,
      ALL_FILTER_CHIPS.BOARD_EXAMS
    );
  } else {
    chips.push(
      ALL_FILTER_CHIPS.CAT,
      ALL_FILTER_CHIPS.JEE,
      ALL_FILTER_CHIPS.NEET,
      ALL_FILTER_CHIPS.PLACEMENT_PREP
    );
  }

  chips.push(ALL_FILTER_CHIPS.HACKATHON);

  const seen = new Set<string>();
  return chips.filter((chip) => {
    if (seen.has(chip.id)) return false;
    seen.add(chip.id);
    return true;
  });
}

export function getGoalsForFilterChip(chipId: FilterChipId): StudyGoal[] {
  return ALL_FILTER_CHIPS[chipId]?.goals ?? [];
}

export function matchesSearchQuery(
  query: string,
  candidate: {
    goal: StudyGoal | null;
    field: string | null;
    subjects: string[];
    name: string | null;
    college: string | null;
    stream: string | null;
  }
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const parts = [
    candidate.field,
    candidate.name,
    candidate.college,
    candidate.stream,
    ...candidate.subjects,
    candidate.goal,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  return parts.some((p) => p.includes(q));
}

export function getGoalCategorySet(goal: StudyGoal): Set<StudyGoal> {
  if (ENGINEERING_GOALS.includes(goal)) return new Set(ENGINEERING_GOALS);
  if (COMMERCE_GOALS.includes(goal)) return new Set(COMMERCE_GOALS);
  if (PM_MBA_GOALS.includes(goal)) return new Set(PM_MBA_GOALS);
  if (MEDICAL_GOALS.includes(goal)) return new Set(MEDICAL_GOALS);
  return new Set([goal]);
}

export function computeGoalScore(
  userGoal: StudyGoal | null | undefined,
  candidateGoal: StudyGoal | null | undefined
): number {
  if (!userGoal || !candidateGoal) return 0;
  if (userGoal === candidateGoal) return 40;

  const userCategory = getGoalCategorySet(userGoal);
  if (userCategory.has(candidateGoal)) return 20;

  return 0;
}

export function computeAvailabilityScore(
  userTimes: string[],
  candidateTimes: string[]
): number {
  if (userTimes.length === 0 || candidateTimes.length === 0) return 0;

  const overlap = userTimes.filter((t) => candidateTimes.includes(t)).length;
  const maxPossible = Math.max(userTimes.length, candidateTimes.length, 1);

  return (overlap / maxPossible) * 30;
}

export function computeStyleScore(
  userStyle: string | null | undefined,
  candidateStyle: string | null | undefined
): number {
  if (!userStyle || !candidateStyle) return 0;
  if (userStyle === candidateStyle) return 30;
  if (userStyle === "EITHER" || candidateStyle === "EITHER") return 15;
  return 0;
}
