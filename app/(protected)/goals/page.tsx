import { WeeklyGoalsPageClient } from "@/components/goals/weekly-goals-page-client";

export default function GoalsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-strivo-text">Weekly Goals</h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Set up to 5 goals each week. Your pairs can see them for accountability.
        </p>
      </div>
      <WeeklyGoalsPageClient />
    </div>
  );
}
