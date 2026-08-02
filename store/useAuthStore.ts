import { create } from 'zustand';
import { User } from '../services/types';

interface AuthState {
  user: User | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setInitialized: (v: boolean) => void;
  /** Dana do isteka licence (samo owner), null ako nema licence. */
  daysUntilExpiry: () => number | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (v) => set({ initialized: v }),
  daysUntilExpiry: () => {
    const { user } = get();
    if (!user || user.role !== 'owner' || !user.licenseUntil) return null;
    const expiry = new Date(user.licenseUntil + 'T23:59:59');
    const diff = expiry.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },
}));
