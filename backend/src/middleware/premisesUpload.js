import multer from "multer";

const storage = multer.memoryStorage();

export const premisesImageUpload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG and PNG images are allowed"));
    }

    cb(null, true);
  },
});

export const premisesVideoUpload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "video/mp4" ||
      file.mimetype === "video/webm" ||
      file.mimetype === "video/quicktime"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4, WEBM, and MOV videos are allowed"));
    }
  },
});