import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Short-lived access token
};

// Generate Refresh Token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Get device info from request
const getDeviceInfo = (req) => {
  return {
    userAgent: req.get('User-Agent') || 'Unknown',
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    deviceId: req.get('X-Device-ID') || crypto.randomUUID()
  };
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Set subscription limits based on role
    const subscriptionLimits = {
      free: { proposalsLimit: 1 },
      pro: { proposalsLimit: -1 }, // Unlimited
      premium: { proposalsLimit: -1 },
      lifetime: { proposalsLimit: -1 }
    };

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'freelancer',
      company,
      subscription: {
        plan: 'free',
        status: 'active',
        proposalsUsed: 0,
        proposalsLimit: subscriptionLimits.free.proposalsLimit
      }
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();
    const deviceInfo = getDeviceInfo(req);

    // Save refresh token to database
    await user.addRefreshToken(refreshToken, deviceInfo);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      message: 'Error creating user', 
      error: error.message 
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login and remember me preference
    user.lastLoginAt = new Date();
    user.rememberMe = rememberMe || false;
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();
    const deviceInfo = getDeviceInfo(req);

    // Save refresh token to database
    await user.addRefreshToken(refreshToken, deviceInfo);

    // Set refresh token as httpOnly cookie
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days if remember me, else 1 day
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in', 
      error: error.message 
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      message: 'Error fetching user data', 
      error: error.message 
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.isActive': true
    });

    if (!user || !user.isValidRefreshToken(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id);

    // Optionally generate new refresh token for security
    const newRefreshToken = generateRefreshToken();
    const deviceInfo = getDeviceInfo(req);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken, deviceInfo);

    // Set new refresh token cookie
    const cookieMaxAge = user.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge
    });

    res.json({
      success: true,
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      message: 'Error refreshing token', 
      error: error.message 
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken) {
      const user = await User.findById(req.user.id);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Error logging out', 
      error: error.message 
    });
  }
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      // Deactivate all refresh tokens
      user.refreshTokens.forEach(rt => rt.isActive = false);
      await user.save();
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ 
      message: 'Error logging out from all devices', 
      error: error.message 
    });
  }
});

export default router;