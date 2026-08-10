import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  s3Client,
} from "../config/s3Config.js";

export const uploadFileToSpaces =
  async ({
    fileBuffer,
    fileName,
    mimeType,
    folder = "uploads",
  }) => {
    const key =
      `${folder}/${Date.now()}-${fileName}`;

    const bucket =
      process.env.EVENT_SPACES_BUCKET ||
      process.env.SPACES_BUCKET;

    const cdnBaseUrl = (
      process.env.EVENT_SPACES_CDN_URL ||
      `https://${bucket}.${process.env.SPACES_REGION}.cdn.digitaloceanspaces.com`
    ).replace(/\/+$/, "");

    const command =
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,

        ACL: "public-read",

        CacheControl:
          "public, max-age=86400",
      });

    await s3Client.send(
      command,
    );

    const publicUrl =
      `${cdnBaseUrl}/${key}`;

    return {
      url: publicUrl,
      key,
      bucket,
    };
  };