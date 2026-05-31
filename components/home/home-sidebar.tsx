"use client";

import { useState } from "react";
import { AiBuddySidebarCard } from "@/components/home/ai-buddy-sidebar-card";
import { MyPairsWidget } from "@/components/home/my-pairs-widget";
import { QuickConnectPool } from "@/components/live-now/quick-connect-pool";
import type { LiveNowTopic } from "@prisma/client";

export function HomeSidebar() {
  const [topicFilter, setTopicFilter] = useState<LiveNowTopic | null>(null);

  return (
    <aside className="space-y-4 lg:block">
      <div className="lg:sticky lg:top-20 space-y-4">
        <MyPairsWidget />
        <QuickConnectPool
          topicFilter={topicFilter}
          onTopicFilterChange={setTopicFilter}
        />
        <AiBuddySidebarCard />
      </div>
    </aside>
  );
}
