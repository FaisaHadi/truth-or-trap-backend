const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const app = express();

// Trust proxy for Railway/production (IMPORTANT for rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth',    require('./routes/auth.routes'));
app.use('/api/users',   require('./routes/user.routes'));
app.use('/api/news',    require('./routes/news.routes'));
app.use('/api/rooms',   require('./routes/room.routes'));
app.use('/api/scores',  require('./routes/score.routes'));
app.use('/api/admin',   require('./routes/admin.routes'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', game: 'Truth or Trap' }));

// 404 fallback
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;
