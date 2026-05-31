import { FeedPageClient } from "@/components/feed/feed-page-client";

export default function FeedPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-strivo-text">Feed</h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Share milestones, ask doubts, and learn from your goal community
        </p>
      </div>
      <FeedPageClient />
    </div>
  );
}
