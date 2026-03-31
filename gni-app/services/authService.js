import { apiClient } from "./apiClient";

export const loginUserApi = async (payload) => {
  return apiClient("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const signupUserApi = async (payload) => {
  return apiClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};