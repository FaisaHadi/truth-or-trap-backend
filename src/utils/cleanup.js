const { RoomStateManager } = require('../config/redis');

// Run cleanup every 30 minutes
const CLEANUP_INTERVAL = 30 * 60 * 1000;

function startCleanupScheduler() {
  setInterval(async () => {
    try {
      const cleaned = await RoomStateManager.cleanupExpiredRooms();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired room(s) from Redis`);
      }
    } catch (err) {
      console.error('❌ Cleanup error:', err.message);
    }
  }, CLEANUP_INTERVAL);

  console.log('✅ Redis cleanup scheduler started (runs every 30 minutes)');
}

module.exports = { startCleanupScheduler };
