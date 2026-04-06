// services/authService.js
import { apiClient } from "./apiClient";

export const signupUserApi = async (payload) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    if (
      payload[key] !== undefined &&
      payload[key] !== null &&
      payload[key] !== "" &&
      key !== "resume"
    ) {
      formData.append(key, payload[key]);
    }
  });

  if (payload.resume) {
    formData.append("resume", {
      uri: payload.resume.uri,
      name: payload.resume.name || "resume.pdf",
      type: payload.resume.mimeType || "application/pdf",
    });
  }

  return await apiClient("/signup", {
    method: "POST",
    body: formData,
  });
};

export const loginUserApi = async ({ email, password }) => {
  return await apiClient("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};