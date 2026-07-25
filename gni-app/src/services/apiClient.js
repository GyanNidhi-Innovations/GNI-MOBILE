import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "https://demos.gyannidhi.in/api";

export const apiClient = async (
  endpoint,
  options = {},
) => {
  const isFormData =
    options.body instanceof FormData;

  const token =
    await SecureStore.getItemAsync(
      "authToken",
    );

  const url = `${BASE_URL}${endpoint}`;

  const isPushRegistration =
    endpoint ===
    "/notifications/register-token";

  if (isPushRegistration) {
    console.log(
      "[PUSH-DEBUG][API] Registration request",
      {
        url,
        method: options.method || "GET",
        hasAuthToken: Boolean(token),
      },
    );
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,

      headers: {
        ...(isFormData
          ? {}
          : {
              "Content-Type":
                "application/json",
            }),

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (isPushRegistration) {
      console.log(
        "[PUSH-DEBUG][API] Network failure",
        {
          url,
          message:
            error?.message ||
            String(error),
        },
      );
    }

    throw error;
  }

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid JSON: ${text}`,
    );
  }

  if (isPushRegistration) {
    console.log(
      "[PUSH-DEBUG][API] Registration response",
      {
        url,
        status: response.status,
        ok: response.ok,
        success: data?.success,
        message: data?.message,
        deviceId: data?.device?._id,
        isActive:
          data?.device?.isActive,
      },
    );
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      "API Error",
    );
  }

  return data;
};