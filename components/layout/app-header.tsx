"use client";

import { UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAiStore } from "@/store/ai-store";

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const openAiBuddy = useAiStore((s) => s.open);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white shadow-nav",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-4">
        <Link
          href="/home"
          className="group flex shrink-0 items-center gap-2 pr-1"
        >
          <Image
            src="/strivo-logo.png"
            alt="Strivo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
            priority
          />
          <span className="hidden text-lg font-semibold tracking-tight text-strivo-text sm:inline">
            Strivo
          </span>
        </Link>

        <MainNav />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            aria-label="AI Study Buddy"
            onClick={openAiBuddy}
            className="hidden sm:inline-flex"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">AI Buddy</span>
          </Button>
          <Button
            size="icon"
            aria-label="AI Study Buddy"
            onClick={openAiBuddy}
            className="sm:hidden"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <NotificationBell />
          <UserButton
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
