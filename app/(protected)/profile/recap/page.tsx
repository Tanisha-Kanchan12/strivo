import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MonthlyRecapCard } from "@/components/ai/monthly-recap-card";
import { Button } from "@/components/ui/button";
import { requireDbUser } from "@/lib/auth";
import { getLatestMonthlyRecap } from "@/lib/ai/monthly-recap";

export default async function ProfileRecapPage() {
  const { user } = await requireDbUser();
  const recap = await getLatestMonthlyRecap(user.id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly Recap</h1>
          <p className="text-sm text-strivo-secondary">
            Private stats for you. Shareable card has no name.
          </p>
        </div>
      </div>

      {recap ? (
        <MonthlyRecapCard
          month={recap.month}
          year={recap.year}
          sessionsCount={recap.sessionsCount}
          longestStreak={recap.longestStreak}
          connectionsCount={recap.connectionsCount}
          topSubject={recap.topSubject}
          summaryText={recap.summaryText ?? ""}
        />
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-strivo-secondary">
          Your first monthly recap will appear at the end of the month once you&apos;ve logged
          focus sessions and study activity.
        </div>
      )}
    </div>
  );
}
