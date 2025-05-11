// src/stores/settingsStore.ts (Dummy Version - For Testing)
import { create } from "zustand";

export interface UserSettings {
  profileImageUrl: string | null;
  progressApiGateway: string;
  chatBotApiKey: string;
  chatBotModelId: string;
}

interface SettingsState extends UserSettings {
  actions: {
    setProfileImageUrl: (url: string | null) => void;
    setProgressApiGateway: (url: string) => void;
    setChatBotApiKey: (key: string) => void;
    setChatBotModelId: (id: string) => void;
    updateSettings: (newSettings: Partial<UserSettings>) => void;
    resetSettings: () => void;
  };
}

const initialUserSettings: UserSettings = {
  profileImageUrl: null,
  progressApiGateway: "",
  chatBotApiKey: "",
  chatBotModelId: "",
};

// Create the store without persistence
export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial data fields
  profileImageUrl: initialUserSettings.profileImageUrl,
  progressApiGateway: initialUserSettings.progressApiGateway,
  chatBotApiKey: initialUserSettings.chatBotApiKey,
  chatBotModelId: initialUserSettings.chatBotModelId,

  actions: {
    setProfileImageUrl: (url) => set({ profileImageUrl: url }),
    setProgressApiGateway: (url) => set({ progressApiGateway: url }),
    setChatBotApiKey: (key) => set({ chatBotApiKey: key }),
    setChatBotModelId: (id) => set({ chatBotModelId: id }),
    updateSettings: (newSettings) =>
      set((state) => ({ ...state, ...newSettings })),
    resetSettings: () =>
      set({
        // Explicitly provide all fields of SettingsState
        ...initialUserSettings,
        actions: get().actions, // Get current actions object to avoid redefining
      }),
  },
}));

export const useSettingsActions = () =>
  useSettingsStore((state) => state.actions);
