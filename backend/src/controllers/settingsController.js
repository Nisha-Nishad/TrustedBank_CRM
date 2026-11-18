const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

// In-memory persistent branch & compliance settings (or default configuration)
let branchSettings = {
  bankName: 'TrustBank India Ltd.',
  branchName: 'Nariman Point Flagship Branch',
  branchCode: 'TB-MUM-042',
  ifscCode: 'TRST0001042',
  region: 'West Zone - Mumbai Circle',
  currency: 'INR (₹)',
  timezone: 'Asia/Kolkata (IST)',
  makerCheckerThreshold: 2500000, // ₹25 Lakhs
  dailyCutoffTime: '17:00 IST',
};

let securitySettings = {
  twoFactorAuth: true,
  sessionTimeoutMinutes: 15,
  passwordExpiryDays: 90,
  piiMaskingEnabled: true,
  ipWhitelistingEnabled: false,
  allowedIpSubnet: '192.168.1.0/24',
  auditLogRetentionYears: 7,
};

let notificationRules = {
  notifyHighValueDeals: true,
  highValueThreshold: 5000000, // ₹50 Lakhs
  notifyKycStatusChange: true,
  dailyTaskDigest: true,
  digestTime: '08:30 AM',
  overdueTaskEscalation: true,
};

async function getSettings(req, res, next) {
  try {
    return res.json({
      branch: branchSettings,
      security: securitySettings,
      notifications: notificationRules,
    });
  } catch (error) {
    next(error);
  }
}

async function updateBranchSettings(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Administrators can update branch settings' });
    }
    const { branchName, branchCode, ifscCode, region, makerCheckerThreshold, dailyCutoffTime } = req.body;
    branchSettings = {
      ...branchSettings,
      ...(branchName && { branchName }),
      ...(branchCode && { branchCode }),
      ...(ifscCode && { ifscCode }),
      ...(region && { region }),
      ...(makerCheckerThreshold && { makerCheckerThreshold: Number(makerCheckerThreshold) }),
      ...(dailyCutoffTime && { dailyCutoffTime }),
    };

    // Log this activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_SETTINGS',
        entityType: 'USER',
        entityId: req.user.id,
        details: 'Updated bank branch operational settings',
      },
    });

    return res.json({ message: 'Branch settings updated successfully', branch: branchSettings });
  } catch (error) {
    next(error);
  }
}

async function updateSecuritySettings(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Administrators can update security compliance policies' });
    }
    const { twoFactorAuth, sessionTimeoutMinutes, passwordExpiryDays, piiMaskingEnabled, ipWhitelistingEnabled } = req.body;
    securitySettings = {
      ...securitySettings,
      ...(twoFactorAuth !== undefined && { twoFactorAuth: Boolean(twoFactorAuth) }),
      ...(sessionTimeoutMinutes !== undefined && { sessionTimeoutMinutes: Number(sessionTimeoutMinutes) }),
      ...(passwordExpiryDays !== undefined && { passwordExpiryDays: Number(passwordExpiryDays) }),
      ...(piiMaskingEnabled !== undefined && { piiMaskingEnabled: Boolean(piiMaskingEnabled) }),
      ...(ipWhitelistingEnabled !== undefined && { ipWhitelistingEnabled: Boolean(ipWhitelistingEnabled) }),
    };

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_SECURITY_POLICY',
        entityType: 'USER',
        entityId: req.user.id,
        details: 'Updated bank regulatory & security compliance policies',
      },
    });

    return res.json({ message: 'Security settings updated successfully', security: securitySettings });
  } catch (error) {
    next(error);
  }
}

async function updateNotificationSettings(req, res, next) {
  try {
    const { notifyHighValueDeals, notifyKycStatusChange, dailyTaskDigest, overdueTaskEscalation } = req.body;
    notificationRules = {
      ...notificationRules,
      ...(notifyHighValueDeals !== undefined && { notifyHighValueDeals: Boolean(notifyHighValueDeals) }),
      ...(notifyKycStatusChange !== undefined && { notifyKycStatusChange: Boolean(notifyKycStatusChange) }),
      ...(dailyTaskDigest !== undefined && { dailyTaskDigest: Boolean(dailyTaskDigest) }),
      ...(overdueTaskEscalation !== undefined && { overdueTaskEscalation: Boolean(overdueTaskEscalation) }),
    };

    return res.json({ message: 'Notification preferences saved', notifications: notificationRules });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: hashedPassword },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CHANGE_PASSWORD',
        entityType: 'USER',
        entityId: req.user.id,
        details: 'User successfully changed account password',
      },
    });

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateBranchSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  changePassword,
};
