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



export const forgotPasswordApi = async ({ email }) => {
  return await apiClient("/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });
};

export const validateResetTokenApi = async (token) => {
  return await apiClient(
    `/reset-password/validate/${encodeURIComponent(token)}`,
  );
};

export const resetPasswordApi = async ({ token, password }) => {
  return await apiClient(
    `/reset-password/${encodeURIComponent(token)}`,
    {
      method: "POST",
      body: JSON.stringify({
        password,
      }),
    },
  );
};


export const requestResetOtpApi = async ({
  email,
}) => {
  return await apiClient(
    "/mobile/forgot-password/request-otp",
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    },
  );
};

export const verifyResetOtpApi = async ({
  email,
  otp,
}) => {
  return await apiClient(
    "/mobile/forgot-password/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: String(otp).trim(),
      }),
    },
  );
};