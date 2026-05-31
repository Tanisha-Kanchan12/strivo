"use client";

import { LayoutGrid, Loader2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExploreFiltersPanel } from "@/components/matches/explore-filters-panel";
import { FilterChips } from "@/components/matches/filter-chips";
import { HackathonBoard } from "@/components/hackathon/hackathon-board";
import { MatchCard } from "@/components/matches/match-card";
import { ProfilePreviewModal } from "@/components/matches/profile-preview-modal";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MatchCandidate } from "@/lib/matching";
import type { FilterChipData } from "@/types/matching";

interface MatchFeedProps {
  initialRecommendedChips: FilterChipData[];
  initialAllFilters: FilterChipData[];
  currentUserId: string;
}

export function MatchFeed({
  initialRecommendedChips,
  initialAllFilters,
  currentUserId,
}: MatchFeedProps) {
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [recommendedChips] = useState(initialRecommendedChips);
  const [allFilters] = useState(initialAllFilters);
  const [customFilters, setCustomFilters] = useState<FilterChipData[]>([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [exploreOpen, setExploreOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [previewMatch, setPreviewMatch] = useState<MatchCandidate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetch("/api/filters/custom")
      .then((r) => r.json())
      .then((d) => setCustomFilters(d.filters ?? []))
      .catch(() => setCustomFilters([]));
  }, []);

  const fetchMatches = useCallback(async (filter: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load matches");
      setMatches(data.matches);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load matches"
      );
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFilter === "HACKATHON") return;
    fetchMatches(activeFilter);
  }, [activeFilter, fetchMatches]);

  async function handleSkip(id: string) {
    setSkippingId(id);
    try {
      const res = await fetch("/api/matches/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchedUserId: id }),
      });
      if (!res.ok) throw new Error("Failed to skip");
      setTimeout(() => {
        setMatches((prev) => prev.filter((m) => m.id !== id));
        setSkippingId(null);
      }, 300);
    } catch {
      toast.error("Could not skip this match");
      setSkippingId(null);
    }
  }

  async function handleConnect(id: string) {
    setConnectingId(id);
    try {
      const res = await fetch("/api/matches/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchedUserId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to connect");

      setMatches((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, requestStatus: "sent" as const, pairRequestId: data.pairRequestId }
            : m
        )
      );
      if (previewMatch?.id === id) {
        setPreviewMatch((prev) =>
          prev ? { ...prev, requestStatus: "sent", pairRequestId: data.pairRequestId } : null
        );
      }
      toast.success("Connect request sent!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send request"
      );
    } finally {
      setConnectingId(null);
    }
  }

  function handleOpen(match: MatchCandidate) {
    setPreviewMatch(match);
    setPreviewOpen(true);
  }

  const showExploreActive =
    activeFilter !== "ALL" &&
    !recommendedChips.some((c) => c.id === activeFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveFilter("ALL");
            setExploreOpen(false);
          }}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            activeFilter === "ALL" ? "chip-active" : "chip-inactive"
          )}
        >
          All
        </button>
        <FilterChips
          chips={recommendedChips}
          activeFilter={activeFilter}
          onFilterChange={(id) => {
            setActiveFilter(id);
            setExploreOpen(false);
          }}
        />
        <button
          type="button"
          onClick={() => setExploreOpen((o) => !o)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-medium transition-all",
            exploreOpen || showExploreActive
              ? "border-[#3B82F6] bg-[#3B82F6] text-white"
              : "border-primary bg-white text-primary hover:bg-strivo-muted"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Explore All
        </button>
      </div>

      {exploreOpen && (
        <ExploreFiltersPanel
          allFilters={allFilters}
          customFilters={customFilters}
          activeFilter={activeFilter}
          onApplyFilter={setActiveFilter}
          onCustomFilterAdded={(f) =>
            setCustomFilters((prev) =>
              prev.some((p) => p.id === f.id) ? prev : [...prev, f]
            )
          }
          onClose={() => setExploreOpen(false)}
        />
      )}

      {activeFilter === "HACKATHON" ? (
        <HackathonBoard currentUserId={currentUserId} />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-strivo-secondary" />
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-strivo-secondary" />
            <div>
              <p className="font-medium">No matches right now</p>
              <p className="text-sm text-strivo-secondary">
                Check back soon. New students join every day.
              </p>
            </div>
            {activeFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onSkip={handleSkip}
              onConnect={handleConnect}
              onOpen={handleOpen}
              isSkipping={skippingId === match.id}
              isConnecting={connectingId === match.id}
            />
          ))}
        </div>
      )}

      <ProfilePreviewModal
        match={previewMatch}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onSkip={handleSkip}
        onConnect={handleConnect}
        isConnecting={connectingId === previewMatch?.id}
      />
    </div>
  );
}
