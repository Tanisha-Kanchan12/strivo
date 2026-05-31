import { IncomingRequestsBanner } from "@/components/matches/incoming-requests-banner";
import { PairLeaderboard } from "@/components/pairs/pair-leaderboard";
import { PairsList } from "@/components/pairs/pairs-list";

export default function PairsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strivo-text">
          My Pairs
        </h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Your connected study partners
        </p>
      </div>

      <IncomingRequestsBanner />
      <PairLeaderboard />
      <PairsList />
    </div>
  );
}
