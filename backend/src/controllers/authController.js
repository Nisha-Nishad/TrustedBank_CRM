const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/db');
const { generateToken, JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must have at least 6 characters'),
});

async function login(req, res, next) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    // Auto log login activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entityType: 'USER',
          entityId: user.id,
          details: `User ${user.email} logged in successfully`,
        },
      });
    } catch (logErr) {
      console.warn('Could not log login activity:', logErr.message);
    }

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { email } = parseResult.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // To prevent email enumeration, return friendly message even if user doesn't exist
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, password reset instructions have been dispatched to your inbox.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact Admin.' });
    }

    // Generate self-contained signed reset token valid for 1 hour
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'PASSWORD_RESET' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientBaseUrl}?resetToken=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const emailResult = await sendPasswordResetEmail(user.email, user.name, resetUrl, resetToken);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        entityType: 'USER',
        entityId: user.id,
        details: `Password reset link dispatched to ${user.email}`,
      },
    });

    return res.json({
      message: `Password reset link has been dispatched to your email address (${user.email}). Please check your email inbox and click the link to reset your password.`,
      email: user.email,
      ...(process.env.NODE_ENV === 'test' ? { token: emailResult.resetToken } : {}),
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { token, newPassword } = parseResult.data;

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (tokenErr) {
      return res.status(400).json({ error: 'Invalid or expired password reset link' });
    }

    if (decoded.purpose !== 'PASSWORD_RESET' || !decoded.userId) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User account no longer exists' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
        entityType: 'USER',
        entityId: user.id,
        details: `Password successfully updated for ${user.email}`,
      },
    });

    return res.json({
      message: 'Password has been successfully updated. You can now login with your new credentials.',
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  return res.json({ message: 'Logout successful' });
}

async function getMe(req, res) {
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
};
