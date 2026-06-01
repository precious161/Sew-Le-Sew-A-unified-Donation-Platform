import { StatusCodes } from "http-status-codes";

// File size limits (in bytes)
const MAX_SIZES = {
  medical_document: 10 * 1024 * 1024, // 10MB
  id_document: 5 * 1024 * 1024,       // 5MB
  receipt: 5 * 1024 * 1024,           // 5MB
};

// Allowed MIME types
const ALLOWED_MIMES = {
  medical_document: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  id_document: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  receipt: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
};

/**
 * Validate uploaded file
 * @param {string} type - Type of document (medical_document, id_document, receipt)
 * @returns {Function} Express middleware
 */
export const validateFileUpload = (type = 'medical_document') => {
  return (req, res, next) => {
    if (!req.file) {
      return next(); // No file to validate
    }

    // Check file size
    const maxSize = MAX_SIZES[type];
    if (req.file.size > maxSize) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
      });
    }

    // Check file type
    const allowedMimes = ALLOWED_MIMES[type];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedMimes.join(', ')}`,
      });
    }

    // Sanitize filename (remove potential malicious characters)
    if (req.file.originalname) {
      req.file.originalname = req.file.originalname
        .replace(/[^a-zA-Z0-9.\-_\s]/g, '')
        .substring(0, 100);
    }

    next();
  };
};

/**
 * Validate multiple files upload
 */
export const validateMultipleFiles = (type = 'medical_document', maxFiles = 5) => {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    if (req.files.length > maxFiles) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Too many files. Maximum ${maxFiles} files allowed.`,
      });
    }

    const maxSize = MAX_SIZES[type];
    const allowedMimes = ALLOWED_MIMES[type];

    for (const file of req.files) {
      if (file.size > maxSize) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `File "${file.originalname}" is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
        });
      }

      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `File "${file.originalname}" has invalid type. Allowed: ${allowedMimes.join(', ')}`,
        });
      }
    }

    next();
  };
};