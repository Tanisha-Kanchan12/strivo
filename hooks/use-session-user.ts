"use client";

import { useUserStore } from "@/store/user-store";

export function useSessionUser() {
  const user = useUserStore((s) => s.user);
  const isLoading = useUserStore((s) => s.isLoading);
  const error = useUserStore((s) => s.error);

  return { user, isLoading, error };
}
