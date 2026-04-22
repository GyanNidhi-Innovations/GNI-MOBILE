const BASE_URL = "http://10.0.2.2:5000/api";
// const BASE_URL = "http://192.168.1.47:5000/api";

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