import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setAuth: (payload) =>
    set({
      user: payload.user,
      token: payload.token
    }),
  logout: () =>
    set({
      user: null,
      token: null
    })
}));