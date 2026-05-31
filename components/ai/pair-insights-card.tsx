"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PairInsightsCardProps {
  pairId: string;
}

interface InsightData {
  content: string;
  weekStart: string;
}

export function PairInsightsCard({ pairId }: PairInsightsCardProps) {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pairs/${pairId}/insights`)
      .then((res) => res.json())
      .then((data) => {
        if (data.insight) setInsight(data.insight);
      })
      .finally(() => setIsLoading(false));
  }, [pairId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-strivo-secondary" />
          AI Pair Insights
        </CardTitle>
        <p className="text-xs text-strivo-secondary">Private. Only you see this.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-strivo-secondary" />
        ) : insight ? (
          <p className="text-sm leading-relaxed">{insight.content}</p>
        ) : (
          <p className="text-sm text-strivo-secondary">
            Weekly insights appear after your first focus sessions together.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
