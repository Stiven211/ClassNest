import type { StateCreator } from 'zustand';

export interface UISlice {
  theme: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
}

export const createUISlice: StateCreator<UISlice & Record<string, unknown>> = (set, get) => ({
  theme: 'light',
  toggleTheme: () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(get().theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    set({ theme: themes[nextIndex] });
  },
});
