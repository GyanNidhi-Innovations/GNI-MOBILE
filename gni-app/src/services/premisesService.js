import { apiClient } from "./apiClient";

export const createPremisesSession = async () => {
  return await apiClient("/premises/session", {
    method: "POST",
  });
};

export const getHireAIActiveInterview = async (candidateId) => {
  return await apiClient(
    `/premises/hireai/active-interview?candidate_id=${encodeURIComponent(
      candidateId
    )}`
  );
};

export const validateHireAIPremises = async ({ room, imageUri }) => {
  const formData = new FormData();

  formData.append("room", room);
  formData.append("file", {
    uri: imageUri,
    name: "premises.jpg",
    type: "image/jpeg",
  });

  return await apiClient("/premises/hireai/validate", {
    method: "POST",
    body: formData,
  });
};

export const validateExamPremises = async ({ attempt, room, imageUri }) => {
  const formData = new FormData();

  formData.append("attempt", attempt);
  formData.append("room", room);
  formData.append("file", {
    uri: imageUri,
    name: "premises.jpg",
    type: "image/jpeg",
  });

  return await apiClient("/premises/exam/validate", {
    method: "POST",
    body: formData,
  });
};

export const getExamPremisesStatus = async (attempt) => {
  return await apiClient(
    `/premises/exam/status?attempt=${encodeURIComponent(attempt)}`
  );
};