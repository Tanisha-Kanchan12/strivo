import { ScoresPageClient } from "@/components/scores/scores-page-client";

export default function ScoresPage() {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-strivo-text">Mock Test Scores</h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Track mock performance and spot weak subjects
        </p>
      </div>
      <ScoresPageClient />
    </div>
  );
}
