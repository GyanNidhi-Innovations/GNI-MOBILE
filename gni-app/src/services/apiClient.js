import Constants from "expo-constants";

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "https://gni-mobile.onrender.com/api";

export const apiClient = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;

  console.log("API URL:", `${BASE_URL}${endpoint}`);
  console.log("API options:", options);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
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
    throw new Error(data.message || "API Error");
  }

  return data;
};