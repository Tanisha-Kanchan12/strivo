"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RequestsNavLinkProps {
  active: boolean;
}

export function RequestsNavLink({ active }: RequestsNavLinkProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/pair-requests/count")
      .then((r) => r.json())
      .then((data) => setCount(data.pendingReceived ?? 0))
      .catch(() => setCount(0));
  }, []);

  return (
    <Link
      href="/requests"
      className={cn(
        "relative flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-[13px] font-medium transition-all lg:px-2.5",
        active
          ? "nav-link-active"
          : "text-strivo-secondary hover:bg-strivo-muted hover:text-strivo-text"
      )}
    >
      <UserPlus className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden lg:inline">Requests</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-strivo-coral px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
