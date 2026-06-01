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

export const bootstrapHireAIPremises = async (candidateId) => {
  const response = await fetch(
    "https://demos.gyannidhi.in/hireai/api/candidate/bootstrap",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ candidate_id: candidateId }),
    }
  );

  const text = await response.text();
  console.log("HireAI bootstrap response:", response.status, text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Invalid HireAI bootstrap response");
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "HireAI bootstrap failed");
  }

  return data;
};

export const uploadHireAIPremisesChunk = async ({
  candidateId,
  attemptId,
  videoUri,
  chunkIndex,
}) => {
  const formData = new FormData();

  formData.append("file", {
    uri: videoUri,
    name: `chunk_${chunkIndex}.webm`,
    type: "video/webm",
  });

  formData.append("candidate_id", candidateId);
  formData.append("attempt_id", attemptId);
  formData.append("chunk_index", String(chunkIndex));

  const response = await fetch(
    "https://demos.gyannidhi.in/hireai/api/interview/upload_prem_chunk",
    {
      method: "POST",
      body: formData,
    }
  );

  const text = await response.text();
  console.log("HireAI upload chunk response:", response.status, text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Invalid HireAI upload response");
  }

  if (!response.ok) {
    throw new Error(data?.detail || "HireAI premises chunk upload failed");
  }

  return data;
};


export const finalizeHireAIPremisesRecording = async ({
  candidateId,
  attemptId,
}) => {
  const response = await fetch(
    "https://demos.gyannidhi.in/hireai/api/interview/finalize_prem_recording",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        attempt_id: attemptId,
      }),
    }
  );

  const text = await response.text();
  console.log("HireAI finalize response:", response.status, text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Invalid HireAI finalize response");
  }

  if (!response.ok) {
    throw new Error(data?.detail || "HireAI premises finalization failed");
  }

  return data;
};