const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Employee = require('../models/Employee');
const emailService = require('../utils/emailService');
const { protect, createRateLimit } = require('../middleware/authMiddleware');
const { validate, registerValidation, loginValidation } = require('../middleware/validationMiddleware');
const logger = require('../utils/logger');

// Rate limiting for auth routes
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 attempts
  'Too many login attempts. Please try again after 15 minutes.'
);

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const loginHandler = async (req, res, next, forcedRole = null) => {
  try {
    const { email, password, role } = req.body;
    const requestedRole = forcedRole || role;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();
    await user.save();

    // Check role if specified
    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({
        success: false,
        message: `This account is not a ${requestedRole}. Please use correct login`
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    const refreshTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    await user.addRefreshToken(refreshToken, new Date(refreshTokenExpires));

    // Set cookie
    res.cookie('token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.cookie('refreshToken', refreshToken, {
      expires: new Date(refreshTokenExpires),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Remove password from output
    user.password = undefined;

    // Get employee profile if employee
    let employeeProfile = null;
    if (user.role === 'employee') {
      employeeProfile = await Employee.findOne({ user: user._id }).select('-__v');
    }

    logger.info(`User logged in: ${user.email} (${user.role})`);

    return res.json({
      success: true,
      token,
      refreshToken,
      user,
      employee: employeeProfile
    });
  } catch (error) {
    return next(error);
  }
};

// @route   POST /api/auth/register
// @desc    Register new customer
// @access  Public
router.post('/register', validate(registerValidation), async (req, res, next) => {
  try {
    const { email, password, profile, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      email,
      password,
      role: 'customer',
      profile,
      address,
      emailVerificationToken
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        user.email,
        user.fullName,
        user.emailVerificationToken
      );
      logger.info(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // Continue even if email fails (for testing)
    }

    // Create JWT
    const token = generateToken(user._id);

    // Set cookie (optional)
    res.cookie('token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authRateLimit, validate(loginValidation), async (req, res, next) => {
  return loginHandler(req, res, next);
});

// @route   POST /api/auth/login/admin
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login/admin', authRateLimit, validate(loginValidation), async (req, res, next) => {
  return loginHandler(req, res, next, 'admin');
});

// @route   POST /api/auth/login/customer
// @desc    Authenticate customer & get token
// @access  Public
router.post('/login/customer', authRateLimit, validate(loginValidation), async (req, res, next) => {
  return loginHandler(req, res, next, 'customer');
});

// @route   POST /api/auth/login/employee
// @desc    Authenticate employee & get token
// @access  Public
router.post('/login/employee', authRateLimit, validate(loginValidation), async (req, res, next) => {
  return loginHandler(req, res, next, 'employee');
});

// @route   POST /api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Public
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token is expired
    const storedToken = user.refreshTokens.find(t => t.token === refreshToken);
    if (!storedToken || storedToken.expiresAt < Date.now()) {
      await user.removeRefreshToken(refreshToken);
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    // Generate new access token
    const token = generateToken(user._id);

    // Optionally rotate refresh token
    await user.removeRefreshToken(refreshToken);
    const newRefreshToken = generateRefreshToken();
    const refreshTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await user.addRefreshToken(newRefreshToken, new Date(refreshTokenExpires));

    res.json({
      success: true,
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (clear token from DB and cookie)
// @access  Private
router.post('/logout', protect, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }

    // Clear cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if user exists
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.fullName,
        resetToken
      );
      logger.info(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      logger.error('Failed to send reset email:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0; // Reset login attempts
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    // Get employee profile if employee
    let employeeProfile = null;
    if (req.user.role === 'employee') {
      employeeProfile = await Employee.findOne({ user: req.user._id }).select('-__v');
    }

    // Get admin profile if admin
    let adminProfile = null;
    if (req.user.role === 'admin') {
      // Admins might have an admin model - for now just return user data
    }

    res.json({
      success: true,
      user: req.user,
      employee: employeeProfile
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res, next) => {
  try {
    const updates = {
      profile: {
        firstName: req.body?.profile?.firstName?.trim() || req.user.profile?.firstName || '',
        lastName: req.body?.profile?.lastName?.trim() || req.user.profile?.lastName || '',
        phone: req.body?.profile?.phone || req.user.profile?.phone || ''
      }
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Verify current password
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
