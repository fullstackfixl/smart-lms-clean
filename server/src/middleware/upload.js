const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const ensureUploadDir = (orgId) => {
  const uploadPath = path.join(__dirname, '../../uploads', orgId.toString());
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const orgId = req.user.organization_id;
    const uploadPath = ensureUploadDir(orgId);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Memory storage for Cloudinary
const memoryStorage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'application/pdf'
  ];

  // Allow all video types for video uploads
  if (file.mimetype.startsWith('video/') || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Upload configurations
const localUpload = multer({
  storage: localStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB
  },
  fileFilter
});

const cloudinaryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB
  },
  fileFilter
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.error('File too large', 'File size exceeds the limit', 400);
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.error('Too many files', 'File count exceeds the limit', 400);
    }
    return res.error(error.message, 'File upload error', 400);
  }
  
  if (error.message.includes('File type')) {
    return res.error(error.message, 'Invalid file type', 400);
  }
  
  next(error);
};

module.exports = {
  localUpload,
  cloudinaryUpload,
  handleUploadError,
  ensureUploadDir
};