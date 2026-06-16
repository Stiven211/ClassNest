import type { StateCreator } from 'zustand';

export interface UserSlice {
  user: import('../../types').User | null;
  login: (email: string, _password: string, grades?: string[], subject?: string, name?: string) => void;
  logout: () => void;
}

export const createUserSlice: StateCreator<UserSlice & Record<string, unknown>> = (set) => ({
  user: null,
  login: (email, _password, grades = [], subject = '', name = '') => {
    set({ user: { id: '1', name: name || email.split('@')[0], email, grades, subject } });
  },
  logout: () => set({ user: null }),
});
