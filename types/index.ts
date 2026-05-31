import type {
  BadgeType,
  LiveNowTopic,
  NotificationType,
  PartnerType,
  ProfileVisibility,
  StudyGoal,
  StudyTime,
  UserStatus,
} from "@prisma/client";

export type {
  BadgeType,
  LiveNowTopic,
  NotificationType,
  PartnerType,
  ProfileVisibility,
  StudyGoal,
  StudyTime,
  UserStatus,
};

export interface SessionUser {
  id: string;
  clerkId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profile: {
    id: string;
    bio: string | null;
    city: string | null;
    college: string | null;
    stream: string | null;
    profilePicUrl: string | null;
    isVerified: boolean;
    visibility: ProfileVisibility;
  } | null;
  onboarding: {
    id: string;
    status: UserStatus | null;
    goal: StudyGoal | null;
    field: string | null;
    studyTimes: StudyTime[];
    partnerType: PartnerType | null;
    completedAt: Date | null;
  } | null;
  settings: {
    id: string;
    cityMode: boolean;
    locationAccess: boolean;
    girlsOnlyMode: boolean;
    language: string;
  } | null;
  individualStreak: {
    id: string;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
  } | null;
  onboardingComplete: boolean;
}

export interface ApiError {
  error: string;
}
