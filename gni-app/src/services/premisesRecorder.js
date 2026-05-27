import { Platform } from "react-native";

const PREMISES_API_BASE_URL =
  process.env.EXPO_PUBLIC_PREMISES_API_BASE_URL || "https://your-domain.com";

let recorder = null;
let streamRef = null;
let segmentIndex = 0;
let recordingState = {
  attempt: null,
  room: null,
  session_id: null,
};

export async function startPremisesRecording({ stream, attempt, room, session_id }) {
  if (!stream) throw new Error("Camera stream is required");
  if (!attempt || !room || !session_id) {
    throw new Error("attempt, room, and session_id are required");
  }

  streamRef = stream;
  segmentIndex = 0;

  recordingState = {
    attempt,
    room,
    session_id,
  };

  const MediaRecorderClass = global.MediaRecorder || window?.MediaRecorder;

  if (!MediaRecorderClass) {
    throw new Error("MediaRecorder is not available in this environment");
  }

  recorder = new MediaRecorderClass(stream, {
    mimeType: "video/webm",
  });

  recorder.ondataavailable = async (event) => {
    if (!event?.data || event.data.size <= 0) return;

    segmentIndex += 1;

    await uploadPremisesSegment(event.data, {
      ...recordingState,
      segment_index: segmentIndex,
    });
  };

  recorder.start(5000); // upload every 5 seconds
}

export async function stopPremisesRecordingAndMerge() {
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
  }

  if (streamRef) {
    streamRef.getTracks?.().forEach((track) => track.stop());
  }

  const mergeResult = await fetch(`${PREMISES_API_BASE_URL}/api/exam/start-merge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recordingState),
  });

  const data = await mergeResult.json();

  if (!mergeResult.ok || !data?.ok) {
    throw new Error(data?.detail || data?.message || "Failed to start premises merge");
  }

  recorder = null;
  streamRef = null;

  return data;
}

async function uploadPremisesSegment(blob, meta) {
  const formData = new FormData();

  formData.append("file", {
    uri: blob,
    name: `segment_${meta.segment_index}.webm`,
    type: "video/webm",
  });

  formData.append("meta", JSON.stringify(meta));

  const response = await fetch(`${PREMISES_API_BASE_URL}/api/exam/upload-segment`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(data?.detail || data?.message || "Segment upload failed");
  }

  return data;
}