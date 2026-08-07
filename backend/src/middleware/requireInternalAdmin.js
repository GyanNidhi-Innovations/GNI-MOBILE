import crypto from "crypto";

function digest(value) {
  return crypto
    .createHash("sha256")
    .update(String(value || ""))
    .digest();
}

export function requireInternalAdmin(
  req,
  res,
  next,
) {
  const expected =
    String(
      process.env
        .INTERNAL_ADMIN_API_KEY ||
        "",
    ).trim();

  const supplied =
    String(
      req.get(
        "x-admin-api-key",
      ) || "",
    ).trim();

  if (!expected) {
    console.error(
      "INTERNAL_ADMIN_API_KEY is not configured",
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal administrator access is not configured",
    });
  }

  const allowed =
    supplied &&
    crypto.timingSafeEqual(
      digest(expected),
      digest(supplied),
    );

  if (!allowed) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid internal administrator credentials",
    });
  }

  req.internalAdmin = {
    adminId:
      String(
        req.get("x-admin-id") ||
          "",
      ).slice(0, 200),

    email:
      String(
        req.get(
          "x-admin-email",
        ) || "",
      )
        .trim()
        .toLowerCase()
        .slice(0, 320),
  };

  next();
}
