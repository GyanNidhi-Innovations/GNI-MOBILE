const BASE_URL = "http://192.168.1.15:5000/api";

export const apiClient = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  console.log("API status:", response.status);
  console.log("API response text:", text);

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
  }
};