/**
 * Express Server & Application Entry Point
 * Agrawal Biodata Matrimony Platform Backend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const http = require('http');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const apiRoutes = require('./routes');
const realtime = require('./realtime');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGIN.indexOf(origin) !== -1 || env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// HTTP Request Logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadDir = path.resolve(__dirname, env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Rate Limiter for API endpoints
app.use('/api/', generalLimiter);

// API Routes
app.use('/api', apiRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    name: 'Agrawal Biodata Matrimony REST API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/health'
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

let server = null;

// Start Server when run directly.
// Socket.io needs the raw HTTP server, so it is created explicitly rather than
// relying on app.listen(). Tests import `app` and never reach this branch, so
// no socket server is started under Jest.
if (require.main === module) {
  (async () => {
    try {
      await connectDB();

      server = http.createServer(app);
      realtime.init(server);

      server.listen(env.PORT, () => {
        logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
        logger.info(`API Base URL: http://localhost:${env.PORT}/api`);
        logger.info(`Socket.io listening on ws://localhost:${env.PORT}/socket.io`);
      });
    } catch (err) {
      logger.error(`Failed to start server: ${err.message}`);
      process.exit(1);
    }
  })();
}

// Graceful Shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  await realtime.close();
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
