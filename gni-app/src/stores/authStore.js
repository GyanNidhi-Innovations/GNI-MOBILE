import { create } from "zustand";
import * as SecureStore from "expo-secure-store";


const ACCESS_TOKEN_KEY =
  "authAccessToken";

const REFRESH_TOKEN_KEY =
  "authRefreshToken";

const USER_KEY =
  "authUser";

async function deleteStoredAuth() {
  await Promise.all([
    SecureStore.deleteItemAsync(
      ACCESS_TOKEN_KEY,
    ),

    SecureStore.deleteItemAsync(
      REFRESH_TOKEN_KEY,
    ),

    SecureStore.deleteItemAsync(
      USER_KEY,
    ),

    /*
     * Delete the token created by your
     * previous 30-day authentication system.
     */
    SecureStore.deleteItemAsync(
      "authToken",
    ),
  ]);
}

export const useAuthStore =
  create((set, get) => ({
    notifications: [],
    registeredEvents: [],

    user: null,

    /*
     * token is retained as a compatibility alias.
     * Existing code that reads state.token will
     * receive the current access token.
     */
    token: null,
    accessToken: null,
    refreshToken: null,

    authLoading: true,
    unreadNotificationCount: 0,

    addNotification: (message) =>
      set((state) => ({
        notifications: [
          {
            id: Date.now(),
            message,
            createdAt:
              new Date(),
          },
          ...state.notifications,
        ],
      })),

    registerEvent: (eventId) =>
      set((state) => ({
        registeredEvents: [
          ...state.registeredEvents,
          eventId,
        ],
      })),

    setUnreadNotificationCount:
      (count) =>
        set({
          unreadNotificationCount:
            count,
        }),

    decrementUnreadNotificationCount:
      () =>
        set((state) => ({
          unreadNotificationCount:
            state
              .unreadNotificationCount >
            0
              ? state
                  .unreadNotificationCount -
                1
              : 0,
        })),

    setAuth: async ({
      user,
      accessToken,
      refreshToken,
    }) => {
      if (
        !user ||
        !accessToken ||
        !refreshToken
      ) {
        throw new Error(
          "Incomplete authentication response",
        );
      }

      await Promise.all([
        SecureStore.setItemAsync(
          ACCESS_TOKEN_KEY,
          accessToken,
        ),

        SecureStore.setItemAsync(
          REFRESH_TOKEN_KEY,
          refreshToken,
        ),

        SecureStore.setItemAsync(
          USER_KEY,
          JSON.stringify(user),
        ),
      ]);

      set({
        user,

        token: accessToken,
        accessToken,
        refreshToken,

        authLoading: false,
      });
    },

    updateUser: async (user) => {
      if (!user) {
        return;
      }

      await SecureStore.setItemAsync(
        USER_KEY,
        JSON.stringify(user),
      );

      set({
        user,
      });
    },

    updateTokens: async ({
      accessToken,
      refreshToken,
    }) => {
      if (
        !accessToken ||
        !refreshToken
      ) {
        throw new Error(
          "Both access and refresh tokens are required",
        );
      }

      await Promise.all([
        SecureStore.setItemAsync(
          ACCESS_TOKEN_KEY,
          accessToken,
        ),

        SecureStore.setItemAsync(
          REFRESH_TOKEN_KEY,
          refreshToken,
        ),
      ]);

      set({
        token: accessToken,
        accessToken,
        refreshToken,
      });
    },

    loadAuth: async () => {
      try {
        const [
          accessToken,
          refreshToken,
          userString,
        ] = await Promise.all([
          SecureStore.getItemAsync(
            ACCESS_TOKEN_KEY,
          ),

          SecureStore.getItemAsync(
            REFRESH_TOKEN_KEY,
          ),

          SecureStore.getItemAsync(
            USER_KEY,
          ),
        ]);

        if (
          !accessToken ||
          !refreshToken ||
          !userString
        ) {
          await deleteStoredAuth();

          set({
            user: null,
            token: null,
            accessToken: null,
            refreshToken: null,
            authLoading: false,
          });

          return;
        }

        set({
          user:
            JSON.parse(userString),

          token: accessToken,
          accessToken,
          refreshToken,

          authLoading: false,
        });
      } catch (error) {
        console.log(
          "Load auth error:",
          error,
        );

        await deleteStoredAuth();

        set({
          user: null,
          token: null,
          accessToken: null,
          refreshToken: null,
          authLoading: false,
        });
      }
    },

    clearAuth: async () => {
      await deleteStoredAuth();

      set({
        user: null,
        token: null,
        accessToken: null,
        refreshToken: null,
        unreadNotificationCount: 0,
        authLoading: false,
      });
    },

    logout: async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(
      "authAccessToken",
    ),

    SecureStore.deleteItemAsync(
      "authRefreshToken",
    ),

    SecureStore.deleteItemAsync(
      "authUser",
    ),
  ]);

  set({
    user: null,
    token: null,
    accessToken: null,
    refreshToken: null,
    unreadNotificationCount: 0,
    authLoading: false,
  });
},
  }));