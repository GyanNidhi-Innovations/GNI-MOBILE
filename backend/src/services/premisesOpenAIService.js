import axios from "axios";

function safeJsonParse(text) {
  const raw = String(text || "").trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI did not return JSON");
    return JSON.parse(match[0]);
  }
}

export async function validatePremisesImage(imageBuffer) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  if (!imageBuffer || imageBuffer.length < 5000) {
    throw new Error("Invalid image");
  }

  const base64Image = imageBuffer.toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const payload = {
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are a strict proctoring camera-position validator for a premises camera. Return ONLY valid JSON.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Validate this premises-camera snapshot.\n" +
              "PASS only if ALL are true:\n" +
              "1) A person is visible. Candidate can be front-facing or back-facing.\n" +
              "2) The interview/exam screen or device is visible.\n" +
              "3) Person and screen/device are in the same frame.\n" +
              "4) Image quality is usable, not too dark and not extremely blurry.\n\n" +
              "Return JSON with this exact shape:\n" +
              "{\n" +
              '  "ok": boolean,\n' +
              '  "confidence": number,\n' +
              '  "checks": {\n' +
              '    "person_present": boolean,\n' +
              '    "screen_present": boolean,\n' +
              '    "together_in_frame": boolean,\n' +
              '    "image_quality_ok": boolean\n' +
              "  },\n" +
              '  "notes": string,\n' +
              '  "fail_reason": string\n' +
              "}\n" +
              "If unsure, set ok=false and explain how to adjust the camera.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
          },
        ],
      },
    ],
    max_output_tokens: 400,
  };

  const response = await axios.post("https://api.openai.com/v1/responses", payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  const textParts = [];

  for (const output of response.data?.output || []) {
    for (const content of output?.content || []) {
      if (typeof content?.text === "string" && content.text.trim()) {
        textParts.push(content.text.trim());
      }
    }
  }

  const rawText = textParts.join("\n").trim();
  const verdict = safeJsonParse(rawText);

  return {
    ok: Boolean(verdict.ok),
    confidence: Number(verdict.confidence || 0),
    checks: verdict.checks || {},
    notes: verdict.notes || "",
    fail_reason: verdict.fail_reason || "",
  };
}