require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket');
const db = require('./src/config/db');
const { redis } = require('./src/config/redis');
const { startCleanupScheduler } = require('./src/utils/cleanup');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Test DB and Redis connection then start server
Promise.all([
  db.getConnection().then(conn => conn.release()),
  redis.ping()
])
  .then(() => {
    console.log('✅  MySQL connected successfully');
    console.log('✅  Redis connected successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
      console.log(`🎮  Truth or Trap backend ready!`);
      
      // Start cleanup scheduler
      startCleanupScheduler();
    });
  })
  .catch((err) => {
    console.error('❌  Connection failed!');
    console.error('-----------------------------------------');
    console.error('Error:', err.message);
    console.error('-----------------------------------------');
    console.error('TIPS FOR FIXING:');
    console.error('1. Make sure MySQL service is RUNNING');
    console.error('2. Make sure Redis service is RUNNING');
    console.error('3. Check database "' + (process.env.DB_NAME || 'truth_or_trap') + '" exists');
    console.error('4. Verify credentials in .env file');
    console.error('-----------------------------------------');
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await db.end();
    await redis.quit();
    console.log('✅ Server closed');
    process.exit(0);
  });
});
