import { PlannerPageClient } from "@/components/planner/planner-page-client";

export default function PlannerPage() {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-strivo-text">Smart Study Planner</h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Auto-generate daily tasks from your syllabus and exam date
        </p>
      </div>
      <PlannerPageClient />
    </div>
  );
}
