import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import config from "../config/index.js";

// ─── Configure Cloudinary ──────────────────────────────────────────────────
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// ─── Cloudinary Storage Engines ───────────────────────────────────────────

// For images (thumbnails, profile photos, community posts)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "revibefit/images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    resource_type: "image",
  },
});

// For PDF documents (certifications, government IDs, accreditation docs, reports)
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "revibefit/documents",
    allowed_formats: ["pdf"],
    resource_type: "raw",
  },
});

// For mixed uploads (trainer & lab partner signup — PDFs + images)
const mixedStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.mimetype === "application/pdf") {
      return {
        folder: "revibefit/documents",
        resource_type: "raw",
        allowed_formats: ["pdf"],
      };
    }
    return {
      folder: "revibefit/images",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    };
  },
});

// ─── File Filters ──────────────────────────────────────────────────────────

const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"), false);
  }
};

const mixedFileFilter = (req, file, cb) => {
  const pdfMime = "application/pdf";
  const imageMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (file.mimetype === pdfMime || imageMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or image files are allowed"), false);
  }
};

// ─── Multer Upload Middlewares ─────────────────────────────────────────────

// Upload middleware for PDF files (certifications, lab reports)
export const upload = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

// Upload middleware for image files (thumbnails, profile photos)
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

// Signup upload middleware — handles all file fields for all user types:
//   Trainer:     certifications (PDF, required), governmentId (PDF/image, optional)
//   Lab Partner: accreditationDocs (PDF, optional), labImages (images, optional, up to 5)
export const uploadSignup = multer({
  storage: mixedStorage,
  fileFilter: mixedFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
}).fields([
  { name: "certifications", maxCount: 1 },
  { name: "governmentId", maxCount: 1 },
  { name: "accreditationDocs", maxCount: 1 },
  { name: "labImages", maxCount: 5 },
]);

// Export cloudinary instance for direct use in controllers (e.g. deleting old files)
export { cloudinary };
