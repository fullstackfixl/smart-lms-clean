const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { localUpload, cloudinaryUpload, handleUploadError } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary, cloudinary } = require('../config/cloudinary');

const router = express.Router();

// Generate Cloudinary signature for direct upload from frontend
router.get('/signature', authMiddleware, async (req, res) => {
  try {
    const { type = 'image' } = req.query;
    const orgId = req.user.organization_id?._id?.toString() || req.user.organization_id?.toString() || req.user.organization_id;
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `smart-lms/${orgId}/${type}s`;
    
    // Generate signature
    const signature = cloudinary.utils.api_sign_request({
      timestamp,
      folder
    }, process.env.CLOUDINARY_API_SECRET);
    
    res.success({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      type
    }, 'Signature generated successfully');
    
  } catch (error) {
    console.error('Signature generation error:', error);
    res.error(error.message, 'Failed to generate upload signature', 500);
  }
});

// Local file upload
router.post('/local', authMiddleware, localUpload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.error('No file provided', 'Please select a file to upload', 400);
    }

    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/api/upload/files/${orgId}/${req.file.filename}`,
      uploadedBy: req.user._id,
      organization_id: orgId
    };

    res.success(fileData, 'File uploaded successfully');

  } catch (error) {
    console.error('Local upload error:', error);
    res.error(error.message, 'File upload failed', 500);
  }
});

// Cloudinary upload
router.post('/cloudinary', authMiddleware, cloudinaryUpload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.error('No file provided', 'Please select a file to upload', 400);
    }

    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const folder = `smart-lms/${orgId}`;
    const publicId = `${Date.now()}-${req.file.originalname.split('.')[0]}`;

    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      public_id: publicId,
      resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'auto'
    });

    const fileData = {
      cloudinaryId: result.public_id,
      url: result.secure_url,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      width: result.width,
      height: result.height,
      format: result.format,
      uploadedBy: req.user._id,
      organization_id: orgId
    };

    res.success(fileData, 'File uploaded to Cloudinary successfully');

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.error(error.message, 'Cloudinary upload failed', 500);
  }
});

// Serve local files
router.get('/files/:orgId/:filename', authMiddleware, async (req, res) => {
  try {
    const { orgId, filename } = req.params;
    const userOrgId = req.user.organization_id?._id || req.user.organization_id;

    // Check if user belongs to the organization
    if (userOrgId.toString() !== orgId) {
      return res.error('Access denied', 'You cannot access files from other organizations', 403);
    }

    const filePath = path.join(__dirname, '../../uploads', orgId, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.error('File not found', 'The requested file does not exist', 404);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Set appropriate headers
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('File serve error:', error);
    res.error(error.message, 'Failed to serve file', 500);
  }
});

// Delete local file
router.delete('/local/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const filePath = path.join(__dirname, '../../uploads', orgId.toString(), filename);

    if (!fs.existsSync(filePath)) {
      return res.error('File not found', 'The file does not exist', 404);
    }

    fs.unlinkSync(filePath);
    res.success(null, 'File deleted successfully');

  } catch (error) {
    console.error('File delete error:', error);
    res.error(error.message, 'Failed to delete file', 500);
  }
});

// Video upload to Cloudinary with validation
router.post('/video', authMiddleware, (req, res, next) => {
  // Set longer timeout for video uploads (10 minutes)
  req.setTimeout(600000);
  res.setTimeout(600000);
  
  cloudinaryUpload.single('video')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.error('File too large', `File size exceeds the limit of ${process.env.MAX_FILE_SIZE || 100}MB`, 400);
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.error('Too many files', 'File count exceeds the limit', 400);
        }
        return res.error(err.message, 'File upload error', 400);
      }
      
      if (err.message.includes('File type')) {
        return res.error(err.message, 'Invalid file type', 400);
      }
      
      return res.error(err.message, 'Upload failed', 500);
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.error('No video file provided', 'Please select a video file to upload', 400);
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('video/')) {
      return res.error('Invalid file type', 'Only video files are allowed', 400);
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (req.file.size > maxSize) {
      return res.error('File too large', 'Video file must be smaller than 500MB', 400);
    }

    // Validate video format
    const allowedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
    if (!allowedFormats.includes(req.file.mimetype)) {
      return res.error('Unsupported format', 'Supported formats: MP4, AVI, MOV, WMV, FLV, WebM', 400);
    }

    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const folder = `smart-lms/${orgId}/videos`;
    
    // Sanitize filename - remove special characters and spaces
    const sanitizedFilename = req.file.originalname
      .split('.')[0] // Remove extension
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .substring(0, 50); // Limit length
    
    const publicId = `video_${Date.now()}_${sanitizedFilename}`;

    console.log(`[VIDEO UPLOAD] Starting upload for ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Upload to Cloudinary with video-specific options
    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      public_id: publicId,
      resource_type: 'video',
      chunk_size: 6000000, // 6MB chunks
      timeout: 600000, // 10 minutes
      eager: [
        { width: 1280, height: 720, crop: 'limit', quality: 'auto' },
        { width: 854, height: 480, crop: 'limit', quality: 'auto' },
        { width: 640, height: 360, crop: 'limit', quality: 'auto' }
      ],
      eager_async: true
    });

    console.log(`[VIDEO UPLOAD] Upload successful: ${result.secure_url}`);

    const videoData = {
      cloudinaryId: result.public_id,
      url: result.secure_url,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      duration: result.duration || 0,
      width: result.width,
      height: result.height,
      format: result.format,
      bitRate: result.bit_rate,
      frameRate: result.frame_rate,
      uploadedBy: req.user._id,
      organization_id: req.user.organization_id?._id || req.user.organization_id,
      uploadDate: new Date(),
      transformations: {
        hd: `${result.public_id}.mp4`,
        sd: `${result.public_id}.mp4`,
        mobile: `${result.public_id}.mp4`
      }
    };

    res.success(videoData, 'Video uploaded successfully');

  } catch (error) {
    console.error('[VIDEO UPLOAD] Error:', error);
    if (!res.headersSent) {
      res.error(error.message, 'Video upload failed', 500);
    }
  }
});

// Get video metadata
router.get('/video/:publicId/metadata', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    
    // Ensure the public ID belongs to the user's organization
    if (!publicId.includes(orgId.toString())) {
      return res.error('Access denied', 'You cannot access videos from other organizations', 403);
    }

    // Get video details from Cloudinary
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.api.resource(publicId, { resource_type: 'video' });

    const metadata = {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      duration: result.duration,
      width: result.width,
      height: result.height,
      size: result.bytes,
      bitRate: result.bit_rate,
      frameRate: result.frame_rate,
      createdAt: result.created_at
    };

    res.success(metadata, 'Video metadata retrieved successfully');

  } catch (error) {
    console.error('Get video metadata error:', error);
    res.error(error.message, 'Failed to get video metadata', 500);
  }
});

module.exports = router;
// Delete Cloudinary file
router.delete('/cloudinary/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    
    // Ensure the public ID belongs to the user's organization
    if (!publicId.includes(orgId.toString())) {
      return res.error('Access denied', 'You cannot delete files from other organizations', 403);
    }

    const result = await deleteFromCloudinary(publicId);
    
    if (result.result === 'ok') {
      res.success(null, 'File deleted from Cloudinary successfully');
    } else {
      res.error('Delete failed', 'Failed to delete file from Cloudinary', 400);
    }

  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.error(error.message, 'Failed to delete file from Cloudinary', 500);
  }
});

module.exports = router;