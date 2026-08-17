/**
 * File Upload Middleware using Multer
 * Handles Profile Pictures, Gallery Images, and KYC Document Uploads
 * Agrawal Matrimony Platform
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { badRequest } = require('../utils/apiResponse');

// Ensure upload directories exist
const PROFILES_DIR = path.resolve(__dirname, '../uploads/profiles');
const DOCUMENTS_DIR = path.resolve(__dirname, '../uploads/documents');

[PROFILES_DIR, DOCUMENTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage engine for candidate profile photos and gallery
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PROFILES_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// Storage engine for verification documents
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, DOCUMENTS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

// Allowed MIME types for images
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Allowed MIME types for KYC documents
const DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  if (DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document type. Only PDF, JPEG, PNG, and WebP files are allowed.'), false);
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Multer instances
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: documentFileFilter
});

/**
 * Higher-order middleware wrapper to catch Multer errors and respond cleanly with 400
 */
const handleUpload = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return badRequest(res, 'File too large. Maximum allowed size is 5MB.');
          }
          return badRequest(res, `Upload error: ${err.message}`);
        }
        return badRequest(res, err.message || 'File upload failed.');
      }
      next();
    });
  };
};

module.exports = {
  uploadProfilePhoto: handleUpload(profileUpload.single('photo')),
  uploadGalleryPhoto: handleUpload(profileUpload.single('photo')),
  uploadDocument: handleUpload(documentUpload.single('document')),
  uploadVerificationDocs: handleUpload(documentUpload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'professionProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ])),
  profileUpload,
  documentUpload,
  handleUpload
};
