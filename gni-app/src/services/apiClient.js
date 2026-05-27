import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "https://demos.gyannidhi.in/api";

export const apiClient = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const token = await SecureStore.getItemAsync("authToken");

  console.log("API URL:", `${BASE_URL}${endpoint}`);
  console.log("API options:", options);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  console.log("Raw API response text:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text}`);
  }

  if (!response.ok) {
    throw new Error(data.detail || data.message || "API Error");
  }

  return data;
};