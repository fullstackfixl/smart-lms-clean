const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload to Cloudinary
const uploadToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'auto',
      folder: options.folder || 'smart-lms',
      public_id: options.public_id,
      transformation: options.transformation,
      chunk_size: options.chunk_size || 6000000, // 6MB chunks by default
      timeout: options.timeout || 600000, // 10 minutes default
      ...options
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] Upload error:', error);
          reject(error);
        } else {
          console.log('[CLOUDINARY] Upload successful:', result.public_id);
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Generate signed URL for secure access
const generateSignedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    ...options
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedUrl
};