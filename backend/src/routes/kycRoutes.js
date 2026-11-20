const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const kycController = require('../controllers/kycController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `kyc_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// All KYC routes require valid authentication
router.use(authenticateToken);

// Customer KYC Document Endpoints
router.get('/customers/:customerId/documents', kycController.getCustomerDocuments);
router.post('/customers/:customerId/documents', upload.single('file'), kycController.addCustomerDocument);

// Verification Endpoints (Manager & Admin only)
router.patch('/documents/:id/verify', requireRole('ADMIN', 'MANAGER'), kycController.verifyDocument);
router.patch('/documents/:id/reject', requireRole('ADMIN', 'MANAGER'), kycController.rejectDocument);
router.delete('/documents/:id', kycController.deleteDocument);

module.exports = router;
