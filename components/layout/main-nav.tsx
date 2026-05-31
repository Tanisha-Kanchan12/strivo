"use client";

import { BookOpen, Calendar, Focus, Home, LineChart, Newspaper, Settings, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequestsNavLink } from "@/components/layout/requests-nav-link";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Discover", icon: Home },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/pairs", label: "Pairs", icon: Users },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/scores", label: "Scores", icon: LineChart },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/focus", label: "Focus", icon: Focus },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5 md:flex lg:gap-1">
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/home" && pathname.startsWith(item.href));

        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-[13px] font-medium transition-all lg:px-2.5",
              active
                ? "nav-link-active"
                : "text-strivo-secondary hover:bg-strivo-muted hover:text-strivo-text"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
      <RequestsNavLink
        active={pathname === "/requests" || pathname.startsWith("/requests/")}
      />
    </nav>
  );
}
