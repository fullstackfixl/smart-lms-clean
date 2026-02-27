const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const Lesson = require('../models/Lesson');
const multer = require('multer');
const streamifier = require('streamifier');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept video files only
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

class VideoUploadController {
  /**
   * Multer middleware for video upload
   */
  getUploadMiddleware() {
    return upload.single('video');
  }

  /**
   * POST /instructor/lectures/:lectureId/upload-video
   * Upload video to Cloudinary and update lecture
   */
  async uploadVideo(req, res) {
    try {
      const { lectureId } = req.params;
      const user = req.user;

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'No video file provided'
        });
      }

      // Fetch lecture with organization isolation
      const lecture = await Lesson.findOne({
        _id: lectureId,
        organization_id: user.organization_id
      });

      if (!lecture) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lecture not found or access denied'
        });
      }

      // Check if user is the instructor of the course
      const Course = require('../models/Course');
      const course = await Course.findOne({
        _id: lecture.course_id,
        organization_id: user.organization_id,
        instructor_id: user._id
      });

      if (!course) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You are not authorized to upload videos for this lecture'
        });
      }

      // Delete old video from Cloudinary if exists
      if (lecture.content.videoPublicId) {
        try {
          await deleteFromCloudinary(lecture.content.videoPublicId, 'video');
        } catch (error) {
          console.error('Error deleting old video:', error);
          // Continue even if deletion fails
        }
      }

      // Upload to Cloudinary
      console.log('Uploading video to Cloudinary...');
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = require('cloudinary').v2.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: `smart-lms/courses/${course._id}/lectures`,
            public_id: `lecture_${lectureId}_${Date.now()}`,
            chunk_size: 6000000, // 6MB chunks
            eager: [
              { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
              { width: 1280, height: 720, crop: 'limit', quality: 'auto' },
              { width: 854, height: 480, crop: 'limit', quality: 'auto' }
            ],
            eager_async: true,
            eager_notification_url: process.env.CLOUDINARY_WEBHOOK_URL
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      console.log('Video uploaded successfully:', uploadResult.secure_url);

      // Update lecture with video details
      lecture.type = 'video';
      lecture.content.videoUrl = uploadResult.secure_url;
      lecture.content.videoDuration = uploadResult.duration || 0; // Duration in seconds
      lecture.content.videoSize = uploadResult.bytes;
      lecture.content.videoPublicId = uploadResult.public_id;

      // Set lecture duration in minutes (for display)
      if (uploadResult.duration) {
        lecture.duration = Math.ceil(uploadResult.duration / 60);
      }

      await lecture.save();

      return res.status(200).json({
        success: true,
        data: {
          lecture_id: lecture._id,
          video_url: uploadResult.secure_url,
          video_duration: uploadResult.duration,
          video_size: uploadResult.bytes,
          thumbnail_url: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url.replace(/\.[^.]+$/, '.jpg')
        },
        message: 'Video uploaded successfully'
      });
    } catch (error) {
      console.error('Upload video error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message || 'Failed to upload video'
      });
    }
  }

  /**
   * DELETE /instructor/lectures/:lectureId/video
   * Delete video from Cloudinary and lecture
   */
  async deleteVideo(req, res) {
    try {
      const { lectureId } = req.params;
      const user = req.user;

      // Fetch lecture
      const lecture = await Lesson.findById(lectureId);

      if (!lecture) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lecture not found'
        });
      }

      // Check if user is the instructor
      const Course = require('../models/Course');
      const course = await Course.findById(lecture.course_id);

      if (course.instructor_id.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You are not authorized to delete this video'
        });
      }

      // Delete from Cloudinary
      if (lecture.content.videoPublicId) {
        await deleteFromCloudinary(lecture.content.videoPublicId, 'video');
      }

      // Clear video data from lecture
      lecture.content.videoUrl = null;
      lecture.content.videoDuration = null;
      lecture.content.videoSize = null;
      lecture.content.videoPublicId = null;

      await lecture.save();

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Video deleted successfully'
      });
    } catch (error) {
      console.error('Delete video error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete video'
      });
    }
  }

  /**
   * GET /instructor/lectures/:lectureId/video-status
   * Check video upload status
   */
  async getVideoStatus(req, res) {
    try {
      const { lectureId } = req.params;

      const lecture = await Lesson.findById(lectureId)
        .select('content.videoUrl content.videoDuration content.videoSize')
        .lean();

      if (!lecture) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lecture not found'
        });
      }

      const hasVideo = !!lecture.content.videoUrl;

      return res.status(200).json({
        success: true,
        data: {
          has_video: hasVideo,
          video_url: lecture.content.videoUrl,
          video_duration: lecture.content.videoDuration,
          video_size: lecture.content.videoSize
        },
        message: 'Video status retrieved successfully'
      });
    } catch (error) {
      console.error('Get video status error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get video status'
      });
    }
  }
}

module.exports = new VideoUploadController();
