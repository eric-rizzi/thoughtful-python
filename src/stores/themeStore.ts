import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system", // Default to system preference
      setTheme: (newTheme) => set({ theme: newTheme }),
    }),
    {
      name: "thoughtful-python-theme-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
