import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as apiService from "../lib/apiService";
import { API_GATEWAY_BASE_URL } from "../config";
import type { UserId, AccessTokenId, RefreshTokenId } from "../types/data"; // Assuming these types exist

export interface UserProfile {
  userId: UserId;
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: AccessTokenId | null;
  refreshToken: RefreshTokenId | null;
  actions: {
    login: (googleIdToken: string) => Promise<void>;
    logout: () => Promise<void>;
    setTokens: (tokens: {
      accessToken: AccessTokenId;
      refreshToken: RefreshTokenId;
    }) => void;
    getAccessToken: () => AccessTokenId | null;
    getRefreshToken: () => RefreshTokenId | null;
  };
}

const initialAuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      actions: {
        login: async (googleIdToken: string) => {
          const apiGatewayUrl = API_GATEWAY_BASE_URL;
          if (!apiGatewayUrl)
            throw new Error("API Gateway URL is not configured.");

          const { accessToken, refreshToken } =
            await apiService.loginWithGoogle(apiGatewayUrl, googleIdToken);

          const decodedToken = JSON.parse(atob(accessToken.split(".")[1]));
          const userProfile: UserProfile = {
            userId: decodedToken.sub,
            // You might want to fetch more user details from a dedicated /me endpoint later
          };

          set({
            isAuthenticated: true,
            accessToken,
            refreshToken,
            user: userProfile,
          });
        },
        logout: async () => {
          const { refreshToken } = get();
          const apiGatewayUrl = API_GATEWAY_BASE_URL;
          if (refreshToken && apiGatewayUrl) {
            try {
              await apiService.logoutUser(apiGatewayUrl, refreshToken);
            } catch (error) {
              console.error(
                "Logout API call failed, proceeding with client-side logout.",
                error
              );
            }
          }
          set({ ...initialAuthState });
        },
        setTokens: ({ accessToken, refreshToken }) => {
          set({ accessToken, refreshToken });
        },
        getAccessToken: () => get().accessToken,
        getRefreshToken: () => get().refreshToken,
      },
    }),
    {
      name: "auth-storage-v2", // New name to avoid conflicts with old structure
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist the user and tokens
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export const useAuthActions = () => useAuthStore((state) => state.actions);
