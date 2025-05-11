// src/stores/apiSettingsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 1. Define the shape of the data for this specific store
interface ApiSettingsData {
  progressApiGateway: string;
}

// 2. Define the full state of the store, including actions
interface ApiSettingsState extends ApiSettingsData {
  setProgressApiGateway: (url: string) => void;
  resetProgressApiGateway: () => void; // Renamed actions to be specific
}

// 3. Define the initial values for ONLY the data fields
const initialApiSettingsData: ApiSettingsData = {
  progressApiGateway: "",
};

// 4. Create the store with persistence
export const useApiSettingsStore = create<ApiSettingsState>()(
  persist(
    (set) => ({
      // Initial data fields
      ...initialApiSettingsData,

      // Actions
      setProgressApiGateway: (url) => set({ progressApiGateway: url }),
      resetProgressApiGateway: () => set({ ...initialApiSettingsData }), // Resets only data in this store
    }),
    {
      name: "api-gateway-settings-storage", // New, unique name for localStorage
      storage: createJSONStorage(() => localStorage),
      // Partialize is simple here as we persist all data fields of ApiSettingsData
      // If ApiSettingsState had non-data fields (like a separate 'actions' object),
      // you'd use partialize like before. For this simple case, it's optional
      // but good practice if you might add non-persisted fields to ApiSettingsState later.
      partialize: (state) => ({
        progressApiGateway: state.progressApiGateway,
      }),
    }
  )
);

// 5. Optional: Hook to conveniently access actions (though less needed for one action)
// export const useApiSettingsActions = () => useApiSettingsStore((state) => ({
//   setProgressApiGateway: state.setProgressApiGateway,
//   resetProgressApiGateway: state.resetProgressApiGateway,
// }));
