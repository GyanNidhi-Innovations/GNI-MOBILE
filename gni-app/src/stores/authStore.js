import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export const useAuthStore = create((set, get) => ({
  notifications: [],
  registeredEvents: [],

  user: null,
  token: null,
  authLoading: true,

  unreadNotificationCount: 0,

  addNotification: (message) =>
    set((state) => ({
      notifications: [
        {
          id: Date.now(),
          message,
          createdAt: new Date(),
        },
        ...state.notifications,
      ],
    })),

  registerEvent: (eventId) =>
    set((state) => ({
      registeredEvents: [...state.registeredEvents, eventId],
    })),

  setUnreadNotificationCount: (count) =>
    set({
      unreadNotificationCount: count,
    }),

  decrementUnreadNotificationCount: () =>
    set((state) => ({
      unreadNotificationCount:
        state.unreadNotificationCount > 0
          ? state.unreadNotificationCount - 1
          : 0,
    })),

  setAuth: async (payload) => {
    const token = payload.token || null;
    const user = payload.user || null;

    if (token) {
      await SecureStore.setItemAsync("authToken", token);
    }

    if (user) {
      await SecureStore.setItemAsync("authUser", JSON.stringify(user));
    }

    set({
      user,
      token,
      authLoading: false,
    });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const userString = await SecureStore.getItemAsync("authUser");

      set({
        token: token || null,
        user: userString ? JSON.parse(userString) : null,
        authLoading: false,
      });
    } catch (error) {
      console.log("Load auth error:", error);
      set({
        user: null,
        token: null,
        authLoading: false,
      });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("authUser");

    set({
      user: null,
      token: null,
      unreadNotificationCount: 0,
      authLoading: false,
    });
  },
}));