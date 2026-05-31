"use client";

import {
  BookOpen,
  Calendar,
  Home,
  LineChart,
  MoreHorizontal,
  Newspaper,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const primaryItems = [
  { href: "/home", label: "Discover", icon: Home },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/pairs", label: "Pairs", icon: Users },
  { href: "/planner", label: "Plan", icon: Calendar },
];

const moreItems = [
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/scores", label: "Scores", icon: LineChart },
  { href: "/goals", label: "Weekly Goals", icon: Calendar },
  { href: "/focus", label: "Focus", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const moreActive = moreItems.some(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-strivo-border bg-white px-2 pb-3 md:hidden">
      <div className="flex items-center justify-around py-2">
        {primaryItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                active ? "text-primary" : "text-strivo-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                moreActive ? "text-primary" : "text-strivo-secondary"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>More</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-strivo-border p-4 text-sm font-medium text-strivo-text"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}
