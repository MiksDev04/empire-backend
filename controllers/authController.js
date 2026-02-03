import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'empire_secret_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during registration' 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/signin
// @access  Public
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during login' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error' 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, currentPassword, password, avatar } = req.body;

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // If updating password, verify current password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'Current password is required to change password' 
        });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: 'Current password is incorrect' 
        });
      }

      // Validate new password
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false,
          message: 'New password must be at least 6 characters' 
        });
      }

      user.password = password;
    }

    // Update other fields
    if (username) user.username = username;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'Email already taken' 
        });
      }
      user.email = email;
    }
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error while updating profile' 
    });
  }
};

// @desc    Google OAuth Sign In/Sign Up
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { email, username, avatar, googleId } = req.body;

    // Validate input
    if (!email || !googleId) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid Google authentication data' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, sign them in
      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Google sign-in successful',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          token,
        },
      });
    } else {
      // Create new user with Google data
      user = await User.create({
        username: username || email.split('@')[0],
        email,
        password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random secure password
        avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
        googleId,
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Google sign-up successful',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          token,
        },
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during Google authentication' 
    });
  }
};
