import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import { validatePremisesImage } from "../services/premisesOpenAIService.js";
import ExamPremisesValidation from "../models/ExamPremisesValidation.js";


export const premisesHealth = (req, res) => {
  res.json({
    ok: true,
    service: "premises",
  });
};
const examValidationStore = new Map();
const examPremisesSessions = new Map();

export const createPremisesSession = (req, res) => {
  const sessionId = uuidv4();
  const short = sessionId.split("-")[0];

  res.json({
    ok: true,
    session_id: sessionId,
    room_cam: `premises-${short}-cam`,
    room_prem: `premises-${short}-prem`,
  });
};

export const getHireAIActiveInterview = async (req, res) => {
  try {
    const candidateId = String(req.query.candidate_id || "").trim();

    if (!candidateId) {
      return res.status(400).json({
        ok: false,
        detail: "candidate_id is required",
      });
    }

    const baseUrl =
      process.env.INTERVIEWS_BASE_URL || "https://demos.gyannidhi.in/hireai";

    const response = await axios.get(`${baseUrl}/api/active-interview`, {
      params: { candidate_id: candidateId },
      timeout: 10000,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 502).json({
      ok: false,
      detail: error.response?.data || error.message,
    });
  }
};

export const validateHireAIPremises = async (req, res) => {
  try {
    const room = String(req.body.room || "").trim();

    if (!room) {
      return res.status(400).json({
        ok: false,
        detail: "room is required",
      });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({
        ok: false,
        detail: "file is required",
      });
    }

    const verdict = await validatePremisesImage(req.file.buffer);

    const eventPayload = {
      type: "premises_validation",
      room,
      validated: Boolean(verdict.ok),
      confidence: verdict.confidence || 0,
      checks: verdict.checks || {},
      notes: verdict.notes || "",
      fail_reason: verdict.fail_reason || "",
    };

    const baseUrl =
      process.env.INTERVIEWS_BASE_URL || "https://demos.gyannidhi.in/hireai";

    let persistedToInterviewBackend = false;

    try {
      const response = await axios.post(
        `${baseUrl}/api/validation-event`,
        eventPayload,
        { timeout: 10000 }
      );

      persistedToInterviewBackend =
        response.status >= 200 && response.status < 300;
    } catch {
      persistedToInterviewBackend = false;
    }

    return res.json({
      ok: true,
      room,
      validated: Boolean(verdict.ok),
      verdict,
      persisted_to_interview_backend: persistedToInterviewBackend,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message,
    });
  }
};

export const getHireAIValidationStatus = async (req, res) => {
  try {
    const room = String(req.query.room || "").trim();

    if (!room) {
      return res.status(400).json({
        ok: false,
        detail: "room is required",
      });
    }

    const baseUrl =
      process.env.INTERVIEWS_BASE_URL || "https://demos.gyannidhi.in/hireai";

    const response = await axios.get(`${baseUrl}/api/validation-status`, {
      params: { room },
      timeout: 10000,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 502).json({
      ok: false,
      detail: error.response?.data || error.message,
    });
  }
};

export const validateExamPremises = async (req, res) => {
  try {
    const attempt = String(req.body.attempt || "").trim();
    const room = String(req.body.room || "").trim();

    if (!attempt) {
      return res.status(400).json({ ok: false, detail: "attempt is required" });
    }

    if (!room) {
      return res.status(400).json({ ok: false, detail: "room is required" });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ ok: false, detail: "file is required" });
    }

    const verdict = await validatePremisesImage(req.file.buffer);
    const now = Math.floor(Date.now() / 1000);

    const record = {
      attempt,
      room,
      validated: Boolean(verdict.ok),
      confidence: verdict.confidence || 0,
      checks: verdict.checks || {},
      notes: verdict.notes || "",
      fail_reason: verdict.fail_reason || "",
      updated_at: now,
      verdict,
    };

    examValidationStore.set(attempt, record);

    await ExamPremisesValidation.findOneAndUpdate(
  { attempt },
  {
    $set: {
      attempt,
      room,
      validated: Boolean(verdict.ok),
      confidence: verdict.confidence || 0,
      checks: verdict.checks || {},
      notes: verdict.notes || "",
      fail_reason: verdict.fail_reason || "",
      verdict,
      validatedAt: new Date(),
    },
  },
  {
    upsert: true,
    new: true,
  }
);

    return res.json({
      ok: true,
      attempt,
      room,
      validated: record.validated,
      verdict,
      updated_at: now,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message,
    });
  }
};

export const getExamValidationStatus = (req, res) => {
  const attempt = String(req.query.attempt || "").trim();

  if (!attempt) {
    return res.status(400).json({
      ok: false,
      detail: "attempt is required",
    });
  }

  const record = examValidationStore.get(attempt);

  if (!record) {
    return res.json({
      ok: true,
      attempt,
      validated: false,
      updated_at: null,
    });
  }

  return res.json({
    ok: true,
    attempt,
    room: record.room,
    validated: record.validated,
    confidence: record.confidence,
    checks: record.checks,
    notes: record.notes,
    fail_reason: record.fail_reason,
    updated_at: record.updated_at,
  });
};


export const bootstrapExamPremises = async (req, res) => {
  try {
    const attempt = String(req.query.attempt || "").trim();

    if (!attempt) {
      return res.status(400).json({
        ok: false,
        detail: "attempt is required",
      });
    }

    const existing = examPremisesSessions.get(attempt);

    if (existing) {
      return res.json(existing);
    }

    const sessionId = uuidv4();
    const short = sessionId.split("-")[0];

    const payload = {
      ok: true,
      attempt,
      session_id: sessionId,
      room: `premises-${short}-prem`,
      room_prem: `premises-${short}-prem`,
      room_cam: `premises-${short}-cam`,
    };

    examPremisesSessions.set(attempt, payload);

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      detail: error.message,
    });
  }
};

export const uploadExamPremisesSegment = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        ok: false,
        detail: "file is required",
      });
    }

    if (!req.body.meta) {
      return res.status(400).json({
        ok: false,
        detail: "meta is required",
      });
    }

    const premisesBaseUrl =
      process.env.PREMISES_BACKEND_URL || "https://demos.gyannidhi.in/premises";

    const formData = new FormData();

    formData.append("meta", req.body.meta);

    formData.append("file", Buffer.from(req.file.buffer), {
      filename: req.file.originalname || "segment.mp4",
      contentType: req.file.mimetype || "video/mp4",
      knownLength: req.file.size,
    });

    const response = await axios.post(
      `${premisesBaseUrl}/api/exam/upload-segment`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 180000,
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(
      "Upload exam premises segment error:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 502).json({
      ok: false,
      detail: error.response?.data || error.message,
    });
  }
};



export const startExamPremisesMerge = async (req, res) => {
  try {
    const premisesBaseUrl =
      process.env.PREMISES_BACKEND_URL || "https://demos.gyannidhi.in";

    const response = await axios.post(
      `${premisesBaseUrl}/api/exam/start-merge`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 502).json({
      ok: false,
      detail: error.response?.data || error.message,
    });
  }
};