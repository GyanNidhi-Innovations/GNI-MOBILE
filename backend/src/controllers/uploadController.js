import multer from "multer";
import { uploadFileToSpaces } from "../services/uploadService.js";

// memory storage (no disk write)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await uploadFileToSpaces({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder: "event-posters",
    });

    return res.status(200).json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};