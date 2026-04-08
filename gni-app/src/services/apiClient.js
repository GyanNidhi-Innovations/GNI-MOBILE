const BASE_URL = "http://192.168.1.39:5000/api";
//const BASE_URL = "http://127.0.0.1:5000/api";

export const apiClient = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();

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