import { apiClient } from "./apiClient";

export const createPremisesSession = async () => {
  return apiClient("/premises/session", {
    method: "POST",
  });
};

export const getHireAIActiveInterview = async (candidateId) => {
  return apiClient(
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

  return apiClient("/premises/hireai/validate", {
    method: "POST",
    body: formData,
  });
};

export const bootstrapExamPremises = async (attempt) => {
  return apiClient(
    `/premises/exam/bootstrap?attempt=${encodeURIComponent(attempt)}`
  );
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

  return apiClient("/premises/exam/validate", {
    method: "POST",
    body: formData,
  });
};

export const getExamPremisesStatus = async (attempt) => {
  return apiClient(
    `/premises/exam/status?attempt=${encodeURIComponent(attempt)}`
  );
};

export const uploadExamPremisesSegment = async ({
  attempt,
  room,
  sessionId,
  videoUri,
  segmentIndex,
}) => {
  const formData = new FormData();

  formData.append("meta", JSON.stringify({
    attempt,
    room,
    session_id: sessionId,
    segment_index: segmentIndex,
  }));

  formData.append("file", {
    uri: videoUri,
    name: `segment_${segmentIndex}.mp4`,
    type: "video/mp4",
  });

  return apiClient("/premises/exam/upload-segment", {
    method: "POST",
    body: formData,
  });
};

export const startExamPremisesMerge = async ({
  attempt,
  room,
  sessionId,
}) => {
  return apiClient("/premises/exam/start-merge", {
    method: "POST",
    body: JSON.stringify({
      attempt,
      room,
      session_id: sessionId,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getExamPremisesLiveStatus = async ({ examId, email }) => {
  return apiClient(
    `/premises/exam/live-status?examId=${encodeURIComponent(
      examId
    )}&email=${encodeURIComponent(email)}`
  );
};