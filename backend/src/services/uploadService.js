import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3Config.js";

export const uploadFileToSpaces = async ({
  fileBuffer,
  fileName,
  mimeType,
  folder = "uploads",
}) => {
  const key = `${folder}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.SPACES_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: "public-read",
  });

  await s3Client.send(command);

  const publicUrl = `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${key}`;

  return {
    url: publicUrl,
    key,
  };
};