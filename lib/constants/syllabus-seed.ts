import type { StudyGoal } from "@prisma/client";

export interface SyllabusSeedSubject {
  subject: string;
  topics: string[];
}

/** Goals that ship with real topic names on first seed */
export const GOALS_WITH_PRESEEDED_TOPICS: StudyGoal[] = ["JEE", "CAT", "UPSC"];

const JEE_SYLLABUS: SyllabusSeedSubject[] = [
  {
    subject: "Physics",
    topics: [
      "Laws of Motion",
      "Thermodynamics",
      "Electrostatics",
      "Optics",
      "Modern Physics",
      "Wave Motion",
      "Gravitation",
      "Rotational Motion",
      "Kinematics",
      "Work Energy Power",
    ],
  },
  {
    subject: "Maths",
    topics: [
      "Limits",
      "Integration",
      "Differentiation",
      "Matrices",
      "Probability",
      "Vectors",
      "Complex Numbers",
      "Coordinate Geometry",
      "Trigonometry",
      "Sequences",
    ],
  },
  {
    subject: "Chemistry",
    topics: [
      "Mole Concept",
      "Chemical Bonding",
      "Electrochemistry",
      "Thermochemistry",
      "Organic basics",
      "Aldehydes",
      "Coordination Compounds",
      "p-block",
      "d-block",
    ],
  },
];

const CAT_SYLLABUS: SyllabusSeedSubject[] = [
  {
    subject: "Quant",
    topics: [
      "Number System",
      "Algebra",
      "Geometry",
      "Arithmetic",
      "Modern Maths",
      "Mensuration",
    ],
  },
  {
    subject: "VARC",
    topics: [
      "Reading Comprehension",
      "Para Jumbles",
      "Summary",
      "Odd Sentence",
    ],
  },
  {
    subject: "DILR",
    topics: [
      "Tables",
      "Graphs",
      "Games and Tournaments",
      "Arrangements",
      "Networks",
    ],
  },
];

const UPSC_SYLLABUS: SyllabusSeedSubject[] = [
  {
    subject: "UPSC",
    topics: [
      "Indian Polity",
      "Modern History",
      "Ancient History",
      "Geography",
      "Economy",
      "Environment",
      "Science and Tech",
      "Current Affairs",
      "Ethics",
      "Essay",
    ],
  },
];

/** Empty subject shells for goals without pre-seeded topics */
const DEFAULT_SUBJECT_SHELLS: SyllabusSeedSubject[] = [
  { subject: "Subject 1", topics: [] },
  { subject: "Subject 2", topics: [] },
  { subject: "Subject 3", topics: [] },
];

const GOAL_SUBJECT_SHELLS: Partial<Record<StudyGoal, string[]>> = {
  NEET: ["Physics", "Chemistry", "Biology"],
  GATE: ["Engineering Maths", "Core Subject", "Aptitude"],
  SSC_CGL: ["Reasoning", "Maths", "English", "GK"],
  BANK_PO_CLERK: ["Reasoning", "Quant", "English", "General Awareness"],
  PLACEMENT_PREP: ["DSA", "Aptitude", "Core CS", "System Design"],
};

export const SYLLABUS_SEED: Partial<Record<StudyGoal, SyllabusSeedSubject[]>> = {
  JEE: JEE_SYLLABUS,
  CAT: CAT_SYLLABUS,
  UPSC: UPSC_SYLLABUS,
};

export function getSyllabusForGoal(goal: StudyGoal): SyllabusSeedSubject[] {
  if (SYLLABUS_SEED[goal]) {
    return SYLLABUS_SEED[goal]!;
  }

  const shells = GOAL_SUBJECT_SHELLS[goal];
  if (shells) {
    return shells.map((subject) => ({ subject, topics: [] }));
  }

  return DEFAULT_SUBJECT_SHELLS;
}

export function isPlaceholderTopicName(name: string): boolean {
  return /\sTopic\s+\d+$/i.test(name) || /^Topic\s+\d+$/i.test(name);
}
