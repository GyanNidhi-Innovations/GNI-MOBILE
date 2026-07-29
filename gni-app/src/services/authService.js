import {
  apiClient,
} from "./apiClient";

export const signupUserApi =
  async (payload) => {
    const formData =
      new FormData();

    Object.keys(
      payload,
    ).forEach((key) => {
      if (
        payload[key] !==
          undefined &&
        payload[key] !==
          null &&
        payload[key] !==
          "" &&
        key !== "resume"
      ) {
        formData.append(
          key,
          payload[key],
        );
      }
    });

    if (payload.resume) {
      formData.append(
        "resume",
        {
          uri:
            payload.resume.uri,

          name:
            payload.resume.name ||
            "resume.pdf",

          type:
            payload.resume
              .mimeType ||
            "application/pdf",
        },
      );
    }

    return apiClient(
      "/signup",
      {
        method: "POST",
        body: formData,
        skipAuth: true,
      },
    );
  };

export const loginUserApi =
  async ({
    email,
    password,
  }) => {
    return apiClient(
      "/login",
      {
        method: "POST",

        body:
          JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),

            password,
          }),

        skipAuth: true,
      },
    );
  };

export const logoutUserApi =
  async (
    refreshToken,
  ) => {
    return apiClient(
      "/logout",
      {
        method: "POST",

        body:
          JSON.stringify({
            refreshToken,
          }),

        skipAuth: true,
      },
    );
  };

export const forgotPasswordApi =
  async ({ email }) => {
    return apiClient(
      "/forgot-password",
      {
        method: "POST",

        body:
          JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),
          }),

        skipAuth: true,
      },
    );
  };

export const validateResetTokenApi =
  async (token) => {
    return apiClient(
      `/reset-password/validate/${encodeURIComponent(
        token,
      )}`,
      {
        skipAuth: true,
      },
    );
  };

export const resetPasswordApi =
  async ({
    token,
    password,
  }) => {
    return apiClient(
      `/reset-password/${encodeURIComponent(
        token,
      )}`,
      {
        method: "POST",

        body:
          JSON.stringify({
            password,
          }),

        skipAuth: true,
      },
    );
  };

export const requestResetOtpApi =
  async ({ email }) => {
    return apiClient(
      "/mobile/forgot-password/request-otp",
      {
        method: "POST",

        body:
          JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),
          }),

        skipAuth: true,
      },
    );
  };

export const verifyResetOtpApi =
  async ({
    email,
    otp,
  }) => {
    return apiClient(
      "/mobile/forgot-password/verify-otp",
      {
        method: "POST",

        body:
          JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),

            otp:
              String(
                otp,
              ).trim(),
          }),

        skipAuth: true,
      },
    );
  };