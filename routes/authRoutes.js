import express from 'express';
import { signup, signin, getMe, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
