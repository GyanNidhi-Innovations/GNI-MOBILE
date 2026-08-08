import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import {
  useAuthStore,
} from "../stores/authStore";

const BASE_URL =
  process.env
    .EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra
    ?.apiBaseUrl ||
  "https://demos.gyannidhi.in/gni-mobile-api/api";

const ACCESS_TOKEN_KEY =
  "authAccessToken";

const REFRESH_TOKEN_KEY =
  "authRefreshToken";

/*
 * Prevent multiple simultaneous API failures
 * from starting multiple refresh requests.
 */
let refreshPromise = null;

async function parseResponse(
  response,
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid server response (${response.status}): ${text.slice(
        0,
        200,
      )}`,
    );
  }
}

async function performRequest(
  endpoint,
  options,
  accessToken,
) {
  const isFormData =
    options.body instanceof
    FormData;

  const url =
    `${BASE_URL}${endpoint}`;

  return fetch(url, {
    ...options,

    headers: {
      ...(isFormData
        ? {}
        : {
            "Content-Type":
              "application/json",
          }),

      ...(accessToken
        ? {
            Authorization:
              `Bearer ${accessToken}`,
          }
        : {}),

      ...(options.headers ||
        {}),
    },
  });
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    (async () => {
      const refreshToken =
        await SecureStore
          .getItemAsync(
            REFRESH_TOKEN_KEY,
          );

      if (!refreshToken) {
        throw new Error(
          "Refresh token is missing",
        );
      }

      const response =
        await fetch(
          `${BASE_URL}/refresh-token`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              refreshToken,
            }),
          },
        );

      const data =
        await parseResponse(
          response,
        );

      if (
        !response.ok ||
        !data.accessToken ||
        !data.refreshToken
      ) {
        throw new Error(
          data.message ||
            "Session expired",
        );
      }

      await useAuthStore
        .getState()
        .updateTokens({
          accessToken:
            data.accessToken,

          refreshToken:
            data.refreshToken,
        });

      return data.accessToken;
    })()
      .catch(async (error) => {
        await useAuthStore
          .getState()
          .clearAuth();

        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });

  return refreshPromise;
}

export const apiClient =
  async (
    endpoint,
    options = {},
  ) => {
    const skipAuth =
      options.skipAuth === true;

    const requestOptions = {
      ...options,
    };

    delete requestOptions.skipAuth;

    let accessToken =
      skipAuth
        ? null
        : await SecureStore
            .getItemAsync(
              ACCESS_TOKEN_KEY,
            );

    let response;

try {
  response =
    await performRequest(
      endpoint,
      requestOptions,
      accessToken,
    );
} catch (error) {

  throw error;
}

let data =
  await parseResponse(
    response,
  );

const refreshAllowed =
  !skipAuth &&
  endpoint !==
    "/refresh-token";

const accessTokenExpired =
  response.status === 401 &&
  data?.code ===
    "ACCESS_TOKEN_EXPIRED";

if (
  refreshAllowed &&
  accessTokenExpired
) {
  accessToken =
    await refreshAccessToken();

  response =
    await performRequest(
      endpoint,
      requestOptions,
      accessToken,
    );

  data =
    await parseResponse(
      response,
    );
}



if (!response.ok) {
  const error =
    new Error(
      data.detail ||
        data.message ||
        "API Error",
    );

  error.status =
    response.status;

  error.code =
    data.code || "";

  throw error;
}

return data;
  };