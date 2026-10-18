const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { seedConferences } = require('./seed/seedData');
const { initCronJobs } = require('./services/schedulerService');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const conferenceRoutes = require('./routes/conferenceRoutes');
const agentRoutes = require('./routes/agentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*', // Allow frontend development ports
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Researchly.io API Engine',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/conferences', conferenceRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Bootstrapping Server
const startServer = async () => {
  try {
    const conn = await connectDB();
    if (conn) {
      await seedConferences();
    }
  } catch (dbErr) {
    console.warn('⚠️ Database initialization notice:', dbErr.message);
  }

  try {
    initCronJobs();
  } catch (cronErr) {
    console.warn('⚠️ Cron initialization notice:', cronErr.message);
  }

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Researchly.io Express Backend running on PORT ${PORT}`);
    console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
    console.log(`🛡️ Credibility Engine & Scheduled Jobs initialized`);
    console.log(`======================================================\n`);
  });
};

startServer();
