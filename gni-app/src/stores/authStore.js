import { create } from "zustand";

export const useAuthStore = create((set) => ({
  notifications: [],
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

  registeredEvents: [],
  registerEvent: (eventId) =>
    set((state) => ({
      registeredEvents: [...state.registeredEvents, eventId],
    })),

  user: null,
  token: null,

  unreadNotificationCount: 0,
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

  setAuth: (payload) =>
    set({
      user: payload.user,
      token: payload.token,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      unreadNotificationCount: 0,
    }),
}));