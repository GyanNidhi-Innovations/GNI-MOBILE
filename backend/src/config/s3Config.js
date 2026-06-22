// server/config/s3Config.js
import { S3Client } from "@aws-sdk/client-s3";

// DigitalOcean Spaces Configuration
export const s3Client = new S3Client({
  region: process.env.SPACES_REGION || "nyc3",
  endpoint: `https://${process.env.SPACES_REGION || "nyc3"}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY,
    secretAccessKey: process.env.SPACES_SECRET_KEY,
  },
  forcePathStyle: false, // Required for DigitalOcean Spaces
});