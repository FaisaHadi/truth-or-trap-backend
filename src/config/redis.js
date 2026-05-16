const Redis = require('ioredis');
const Redlock = require('redlock').default;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('✅  Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌  Redis connection error:', err.message);
});

// Helper functions untuk room state management
const RoomStateManager = {
  // Get room state
  async getState(roomId) {
    const key = `room:${roomId}:state`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Set room state dengan TTL (24 jam)
  async setState(roomId, state) {
    const key = `room:${roomId}:state`;
    const ttl = 86400; // 24 hours
    await redis.setex(key, ttl, JSON.stringify(state));
  },

  // Update partial state
  async updateState(roomId, updates) {
    const current = await this.getState(roomId);
    if (!current) return null;
    const updated = { ...current, ...updates };
    await this.setState(roomId, updated);
    return updated;
  },

  // Delete room state
  async deleteState(roomId) {
    const key = `room:${roomId}:state`;
    await redis.del(key);
  },

  // Get all active room IDs
  async getActiveRooms() {
    const keys = await redis.keys('room:*:state');
    return keys.map(key => {
      const match = key.match(/room:(\d+):state/);
      return match ? parseInt(match[1]) : null;
    }).filter(Boolean);
  },

  // Set vote dengan TTL
  async setVote(roomId, userId, choiceId) {
    const key = `room:${roomId}:votes`;
    await redis.hset(key, userId, choiceId);
    await redis.expire(key, 3600); // 1 hour
  },

  // Get all votes untuk room
  async getVotes(roomId) {
    const key = `room:${roomId}:votes`;
    const votes = await redis.hgetall(key);
    const result = new Map();
    for (const [userId, choiceId] of Object.entries(votes)) {
      result.set(parseInt(userId), parseInt(choiceId));
    }
    return result;
  },

  // Clear votes
  async clearVotes(roomId) {
    const key = `room:${roomId}:votes`;
    await redis.del(key);
  },

  // Set ready status
  async setReady(roomId, userId, isReady) {
    const key = `room:${roomId}:ready`;
    await redis.hset(key, userId, isReady ? '1' : '0');
    await redis.expire(key, 3600);
  },

  // Get ready status
  async getReady(roomId) {
    const key = `room:${roomId}:ready`;
    const ready = await redis.hgetall(key);
    const result = new Map();
    for (const [userId, status] of Object.entries(ready)) {
      result.set(parseInt(userId), status === '1');
    }
    return result;
  },

  // Cleanup expired rooms (called periodically)
  async cleanupExpiredRooms() {
    const rooms = await this.getActiveRooms();
    let cleaned = 0;
    for (const roomId of rooms) {
      const state = await this.getState(roomId);
      if (state && state.phase === 'ended') {
        const endedAt = new Date(state.endedAt || 0);
        const hoursSinceEnd = (Date.now() - endedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceEnd > 2) {
          await this.deleteState(roomId);
          await this.clearVotes(roomId);
          await redis.del(`room:${roomId}:ready`);
          cleaned++;
        }
      }
    }
    return cleaned;
  }
};

// Redlock for distributed locking
const redlock = new Redlock(
  [redis],
  {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
    automaticExtensionThreshold: 500,
  }
);

redlock.on('error', (err) => {
  console.error('⚠️  Redlock error:', err.message);
});

module.exports = { redis, RoomStateManager, redlock };
