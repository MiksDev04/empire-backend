import cloudinary from '../config/cloudinary.js';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
}).single('avatar');

// @desc    Upload avatar to Cloudinary
// @route   POST /api/upload/avatar
// @access  Public
export const uploadAvatar = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    try {
      // Upload to Cloudinary using upload_stream
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'empire/avatars',
            resource_type: 'image',
            transformation: [
              { width: 500, height: 500, crop: 'fill', gravity: 'face' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });

      const result = await uploadPromise;

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image to Cloudinary',
        error: error.message,
      });
    }
  });
};
