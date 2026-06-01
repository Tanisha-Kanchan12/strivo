"use client";

import { memo, useEffect } from "react";
import { AiStudyBuddyModal } from "@/components/ai/ai-study-buddy-modal";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FeedbackWidget } from "@/components/support/feedback-widget";
import { useNotificationsSubscription } from "@/hooks/use-notifications";
import { useUserStore } from "@/store/user-store";

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setError } = useUserStore();

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      setLoading(true);
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) {
          throw new Error("Failed to sync user");
        }
        const data = await res.json();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Sync failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    syncUser();
    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading, setError]);

  return <>{children}</>;
}

function NotificationsProvider() {
  const userId = useUserStore((s) => s.user?.id);
  useNotificationsSubscription(userId);
  return null;
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <UserSyncProvider>
      <NotificationsProvider />
      <div className="app-shell-bg">
        <AppHeader />
        <main className="relative mx-auto max-w-7xl animate-fade-in px-4 py-8 pb-24 sm:px-6 md:pb-8">
          {children}
        </main>
        <MobileBottomNav />
        <AiStudyBuddyModal />
        <FeedbackWidget />
      </div>
    </UserSyncProvider>
  );
}
