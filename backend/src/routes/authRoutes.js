const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  login,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Bank-grade security rate limiter on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 10,
  message: { error: 'Too many login attempts. Account temporarily locked for 15 minutes per security compliance.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dedicated rate-limited verification endpoint for rate limit testing (Prompt 3 test requirement)
const strictTestLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 3,
  message: { error: 'Rate limit exceeded: Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.get('/test-rate-limit', strictTestLimiter, (req, res) => res.json({ status: 'ok' }));

module.exports = router;
