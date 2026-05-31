import { create } from "zustand";
import type { SessionUser } from "@/types";

interface UserState {
  user: SessionUser | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: SessionUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ user: null, isLoading: false, error: null }),
}));
