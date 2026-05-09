
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { config } from "./env.js";

// Configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sew-le-sew/medical-documents",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
    resource_type: "auto",
  },
});

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, and PNG are allowed."), false);
    }
  },
});

export default cloudinary;