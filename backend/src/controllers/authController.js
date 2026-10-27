'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidEmail, isValidPassword } = require('../utils/validation');

/**
 * Generate JWT token.
 * @param {string} id
 * @returns {string}
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required', error: 'VALIDATION_ERROR' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required', error: 'VALIDATION_ERROR' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters', error: 'VALIDATION_ERROR' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered', error: 'DUPLICATE_EMAIL' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'field_worker',
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required', error: 'VALIDATION_ERROR' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required', error: 'VALIDATION_ERROR' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', error: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', error: 'INVALID_CREDENTIALS' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive', error: 'ACCOUNT_INACTIVE' });
    }

    const token = signToken(user._id);

    // Remove password from response
    const userObj = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user: userObj },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: { user: req.user },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
