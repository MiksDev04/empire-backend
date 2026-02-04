import express from 'express';
import { uploadAvatar } from '../controllers/uploadController.js';

const router = express.Router();

// Upload avatar
router.post('/avatar', uploadAvatar);

export default router;
