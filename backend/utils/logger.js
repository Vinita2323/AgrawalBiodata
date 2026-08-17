/**
 * Winston Logging Utility
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir) && process.env.NODE_ENV !== 'test') {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    // Ignore error if creating log directory fails
  }
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const customConsoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports = [];

// In test environment, keep console transport silent or error-only unless DEBUG is on
if (process.env.NODE_ENV === 'test') {
  transports.push(
    new winston.transports.Console({
      silent: process.env.DEBUG !== 'true',
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customConsoleFormat)
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        customConsoleFormat
      )
    })
  );

  if (fs.existsSync(logDir)) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: combine(timestamp(), errors({ stack: true }), json())
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: combine(timestamp(), json())
      })
    );
  }
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports
});

module.exports = logger;
