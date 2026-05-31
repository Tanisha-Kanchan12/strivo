import type { PartnerType, StudyGoal, StudyTime, UserStatus } from "@prisma/client";

export const USER_STATUS_OPTIONS: {
  value: UserStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "SCHOOL",
    label: "School Student",
    description: "Class 10th–12th",
  },
  {
    value: "COLLEGE",
    label: "College Student",
    description: "UG or PG",
  },
  {
    value: "ASPIRANT",
    label: "Full-time Exam Aspirant",
    description: "JEE, NEET, UPSC, etc.",
  },
];

export const STUDY_GOAL_OPTIONS: { value: StudyGoal; label: string }[] = [
  { value: "JEE", label: "JEE" },
  { value: "NEET", label: "NEET" },
  { value: "SSC_CGL", label: "SSC CGL" },
  { value: "SSC_CHSL", label: "SSC CHSL" },
  { value: "UPSC", label: "UPSC" },
  { value: "CAT", label: "CAT" },
  { value: "CUET", label: "CUET" },
  { value: "GATE", label: "GATE" },
  { value: "BANK_PO_CLERK", label: "Bank PO / Clerk" },
  { value: "RRB_NTPC", label: "RRB NTPC" },
  { value: "BOARD_EXAMS", label: "Board Exams" },
  { value: "COLLEGE_EXAMS", label: "College Exams" },
  { value: "MBA_ENTRANCE", label: "MBA Entrance" },
  { value: "PLACEMENT_PREP", label: "Placement Prep" },
  { value: "PRODUCT_MANAGEMENT", label: "Product Management" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "OTHER", label: "Other" },
];

export const STUDY_TIME_OPTIONS: {
  value: StudyTime;
  label: string;
  hours: string;
}[] = [
  { value: "MORNING", label: "Morning", hours: "6am – 12pm" },
  { value: "AFTERNOON", label: "Afternoon", hours: "12 – 5pm" },
  { value: "EVENING", label: "Evening", hours: "5 – 9pm" },
  { value: "NIGHT", label: "Night", hours: "9pm – 12am" },
];

export const PARTNER_TYPE_OPTIONS: {
  value: PartnerType;
  label: string;
  description: string;
}[] = [
  {
    value: "ACCOUNTABILITY",
    label: "Accountability partner",
    description: "Check in daily, keep each other honest",
  },
  {
    value: "ACTIVE_BUDDY",
    label: "Active study buddy",
    description: "Study together in real time",
  },
  {
    value: "EITHER",
    label: "Either works",
    description: "Flexible. Open to both styles",
  },
];

export const PROFILE_VISIBILITY_OPTIONS = [
  { value: "OPEN", label: "Open", description: "Visible to everyone" },
  {
    value: "MATCH_ONLY",
    label: "Match Only",
    description: "Only matched users see full profile",
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Profile hidden from discovery",
  },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "hinglish", label: "Hinglish" },
];

export const BADGE_INFO = {
  GOAL_SETTER: {
    label: "Goal Setter",
    description: "Set your first daily target",
    unlock: "Create a daily target in any pair",
  },
  CONSISTENT: {
    label: "Consistent",
    description: "7-day individual streak",
    unlock: "Maintain a 7-day study streak",
  },
  GOOD_PARTNER: {
    label: "Good Partner",
    description: "Rated 4+ stars by 3 partners",
    unlock: "Get 4+ star ratings from 3 different partners",
  },
  VETERAN: {
    label: "Veteran",
    description: "30-day individual streak",
    unlock: "Maintain a 30-day study streak",
  },
  PLANNER: {
    label: "Planner",
    description: "10 sessions scheduled",
    unlock: "Schedule 10 study sessions",
  },
  VERIFIED_STUDENT: {
    label: "Verified Student",
    description: "Student ID verified",
    unlock: "Upload and verify your student ID",
  },
  COMMUNITY_BUILDER: {
    label: "Community Builder",
    description: "Invited a friend who joined Strivo",
    unlock: "Refer a friend who completes onboarding",
  },
} as const;

export function formatStudyGoal(goal: StudyGoal | null | undefined): string {
  if (!goal) return "Not set";
  return STUDY_GOAL_OPTIONS.find((g) => g.value === goal)?.label ?? goal;
}

export function formatPartnerType(type: PartnerType | null | undefined): string {
  if (!type) return "Not set";
  return PARTNER_TYPE_OPTIONS.find((p) => p.value === type)?.label ?? type;
}

export function formatStudyTimes(times: StudyTime[]): string {
  if (times.length === 0) return "Not set";
  return times
    .map((t) => STUDY_TIME_OPTIONS.find((o) => o.value === t)?.label ?? t)
    .join(", ");
}
