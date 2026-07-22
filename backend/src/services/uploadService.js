import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3Config.js";

function sanitizeFileName(fileName) {
  const original =
    String(fileName || "file").trim();

  const sanitized = original
    // Replace spaces with hyphens.
    .replace(/\s+/g, "-")

    // Remove characters unsafe for public URLs.
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-",
    )

    // Collapse repeated hyphens.
    .replace(/-+/g, "-")

    // Remove leading and trailing hyphens.
    .replace(/^-+|-+$/g, "");

  return sanitized || "file";
}

export const uploadFileToSpaces =
  async ({
    fileBuffer,
    fileName,
    mimeType,
    folder = "uploads",
  }) => {
    const safeFileName =
      sanitizeFileName(fileName);

    const key =
      `${folder}/${Date.now()}-${safeFileName}`;

    const command =
      new PutObjectCommand({
        Bucket:
          process.env.SPACES_BUCKET,

        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: "public-read",
      });

    await s3Client.send(command);

    const baseUrl =
      `https://${process.env.SPACES_BUCKET}` +
      `.${process.env.SPACES_REGION}` +
      `.digitaloceanspaces.com`;

    /*
     * Encode every key segment so the returned
     * value is always a valid public URL.
     */
    const encodedKey = key
      .split("/")
      .map((segment) =>
        encodeURIComponent(segment),
      )
      .join("/");

    const publicUrl =
      `${baseUrl}/${encodedKey}`;

    console.log(
      "[UPLOAD] Spaces upload completed",
      {
        originalFileName: fileName,
        safeFileName,
        key,
        publicUrl,
      },
    );

    return {
      url: publicUrl,
      key,
    };
  };