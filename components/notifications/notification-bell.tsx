"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useNotificationsStore } from "@/store/notifications-store";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  return (
    <Button variant="ghost" size="icon" aria-label="Notifications" asChild>
      <Link href="/notifications" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-strivo-coral px-1 text-[10px] font-bold text-white"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
