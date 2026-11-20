require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const dealRoutes = require('./routes/dealRoutes');
const taskRoutes = require('./routes/taskRoutes');
const noteRoutes = require('./routes/noteRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Phase 2: KYC & Support Tickets Routes
const kycRoutes = require('./routes/kycRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

// Security Hardening with Helmet & CORS
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());

// Serve static KYC documents & uploads securely
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Custom Bank CRM API', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/leads', leadRoutes);
app.use('/deals', dealRoutes);
app.use('/tasks', taskRoutes);
app.use('/notes', noteRoutes);
app.use('/activity-logs', activityLogRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportRoutes);
app.use('/settings', settingsRoutes);
app.use('/search', searchRoutes);

// Phase 2 Routes
app.use('/kyc', kycRoutes);
app.use('/tickets', ticketRoutes);

// Global 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`TrustBank CRM Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
