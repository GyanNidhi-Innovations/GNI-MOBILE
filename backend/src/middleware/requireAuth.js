import jwt from "jsonwebtoken";

export function requireAuth(
  req,
  res,
  next,
) {
  const authorization =
    String(
      req.headers.authorization ||
        "",
    );

  const [scheme, token] =
    authorization.split(" ");

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    return res.status(401).json({
      success: false,
      code:
        "ACCESS_TOKEN_REQUIRED",
      message:
        "Authentication required",
    });
  }

  try {
    if (
      !process.env.JWT_SECRET
    ) {
      throw new Error(
        "JWT_SECRET is missing",
      );
    }

    const payload =
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        {
          algorithms: [
            "HS256",
          ],

          issuer:
            process.env.JWT_ISSUER ||
            "gyannidhi-mobile-api",

          audience:
            process.env.JWT_AUDIENCE ||
            "gyannidhi-mobile-app",
        },
      );

    if (
      payload.tokenType !==
      "access"
    ) {
      return res
        .status(401)
        .json({
          success: false,
          code:
            "INVALID_ACCESS_TOKEN",
          message:
            "Invalid access token",
        });
    }

    req.auth = {
      userId: payload.sub,
      email: payload.email,
      type: payload.type,
    };

    next();
  } catch (error) {
    const expired =
      error?.name ===
      "TokenExpiredError";

    return res
      .status(401)
      .json({
        success: false,

        code: expired
          ? "ACCESS_TOKEN_EXPIRED"
          : "INVALID_ACCESS_TOKEN",

        message: expired
          ? "Access token expired"
          : "Invalid access token",
      });
  }
}

export function requireAdmin(
  req,
  res,
  next,
) {
  const allowedRoles = [
    "admin",
    "system_admin",
  ];

  if (
    !allowedRoles.includes(
      req.auth?.type,
    )
  ) {
    return res
      .status(403)
      .json({
        success: false,
        message:
          "Administrator access required",
      });
  }

  next();
}