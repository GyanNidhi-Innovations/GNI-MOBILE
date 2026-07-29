import crypto from "crypto";
import jwt from "jsonwebtoken";

import RefreshSession from "../models/RefreshSession.js";

const ACCESS_TOKEN_TTL =
  process.env.ACCESS_TOKEN_TTL ||
  "15m";

const REFRESH_TOKEN_DAYS =
  Number(
    process.env.REFRESH_TOKEN_DAYS ||
      180,
  );

function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing",
    );
  }

  return secret;
}

export function hashRefreshToken(
  token,
) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

export function createAccessToken(
  user,
) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      type: user.type,
      tokenType: "access",
    },
    getJwtSecret(),
    {
      expiresIn:
        ACCESS_TOKEN_TTL,

      issuer:
        process.env.JWT_ISSUER ||
        "gyannidhi-mobile-api",

      audience:
        process.env.JWT_AUDIENCE ||
        "gyannidhi-mobile-app",

      algorithm: "HS256",
    },
  );
}

function generateRefreshToken() {
  return crypto
    .randomBytes(64)
    .toString("base64url");
}

function refreshExpiryDate() {
  return new Date(
    Date.now() +
      REFRESH_TOKEN_DAYS *
        24 *
        60 *
        60 *
        1000,
  );
}

export async function createRefreshSession({
  user,
  req,
}) {
  const refreshToken =
    generateRefreshToken();

  const tokenHash =
    hashRefreshToken(
      refreshToken,
    );

  await RefreshSession.create({
    userId: user._id,
    tokenHash,
    expiresAt:
      refreshExpiryDate(),

    userAgent:
      String(
        req.get("user-agent") ||
          "",
      ).slice(0, 500),

    ipAddress:
      String(
        req.ip || "",
      ).slice(0, 100),
  });

  return refreshToken;
}

export async function issueTokenPair({
  user,
  req,
}) {
  const accessToken =
    createAccessToken(user);

  const refreshToken =
    await createRefreshSession({
      user,
      req,
    });

  return {
    accessToken,
    refreshToken,

    /*
     * Helpful for the mobile client.
     * This does not control expiry;
     * the JWT exp claim does.
     */
    accessTokenExpiresInSeconds:
      15 * 60,
  };
}

export async function rotateRefreshToken({
  currentRefreshToken,
  req,
}) {
  const currentHash =
    hashRefreshToken(
      currentRefreshToken,
    );

  const replacementToken =
    generateRefreshToken();

  const replacementHash =
    hashRefreshToken(
      replacementToken,
    );

  /*
   * Atomic update prevents the same refresh token
   * from being successfully used twice.
   */
  const currentSession =
    await RefreshSession
      .findOneAndUpdate(
        {
          tokenHash:
            currentHash,

          revokedAt: null,

          expiresAt: {
            $gt: new Date(),
          },
        },
        {
          $set: {
            revokedAt:
              new Date(),

            replacedByTokenHash:
              replacementHash,

            lastUsedAt:
              new Date(),
          },
        },
        {
          new: false,
        },
      );

  if (!currentSession) {
    return null;
  }

  return {
    currentSession,
    replacementToken,
    replacementHash,
  };
}

export async function revokeRefreshToken(
  refreshToken,
) {
  if (!refreshToken) {
    return;
  }

  const tokenHash =
    hashRefreshToken(
      refreshToken,
    );

  await RefreshSession.updateOne(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
}