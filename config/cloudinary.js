import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// Note: Replace 'dkfdycruy' with your actual Cloudinary cloud name from your dashboard
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dkfdycruy',
  api_key: '167431179824388',
  api_secret: 'e8lX2TQUkvg6WxVRcJ-OfEFuI50',
});

export default cloudinary;
