# Redis Migration Guide - Memory Leak Fix

## 🎯 Problem Fixed
**Critical Bug**: In-memory state management causing memory leaks and data loss on server restart.

## ✅ Solution
Migrated from in-memory Maps to Redis for persistent, scalable state management.

---

## 📋 Prerequisites

### 1. Install Redis

#### Windows (Recommended: Memurai)
```bash
# Download Memurai (Redis for Windows)
# https://www.memurai.com/get-memurai

# Or use WSL2 with Redis
wsl --install
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

---

## 🚀 Installation Steps

### Step 1: Install Dependencies
```bash
cd backend-pemweb
npm install
```

### Step 2: Configure Environment
```bash
# Copy .env.example to .env
copy .env.example .env

# Edit .env and set:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your_actual_secret_key_here
```

### Step 3: Start Services
```bash
# Terminal 1: Start Redis (if not running as service)
redis-server

# Terminal 2: Start Backend
npm run dev
```

---

## 🔍 What Changed?

### Before (In-Memory)
```javascript
const roomStates = new Map();  // ❌ Lost on restart
const votes = new Map();       // ❌ Not scalable
```

### After (Redis)
```javascript
await RoomStateManager.setState(roomId, state);  // ✅ Persistent
await RoomStateManager.getVotes(roomId);         // ✅ Scalable
```

---

## 📊 Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Persistence** | ❌ Lost on restart | ✅ Survives restart |
| **Scalability** | ❌ Single server only | ✅ Multi-server ready |
| **Memory** | ❌ Grows indefinitely | ✅ Auto-cleanup with TTL |
| **Performance** | ⚠️ Degrades over time | ✅ Consistent |

---

## 🧪 Testing

### Test 1: State Persistence
```bash
# 1. Start server and create a room
# 2. Restart server (Ctrl+C, npm run dev)
# 3. Room state should still exist in Redis

redis-cli
> KEYS room:*
> GET room:1:state
```

### Test 2: Vote Tracking
```bash
redis-cli
> HGETALL room:1:votes
> HGETALL room:1:ready
```

### Test 3: Auto Cleanup
```bash
# Expired rooms (ended > 2 hours ago) are cleaned every 30 minutes
# Check logs for: "🧹 Cleaned up X expired room(s)"
```

---

## 🛠️ Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
# Windows (Memurai): Check Event Viewer
# Linux: sudo journalctl -u redis
```

### Port Already in Use
```bash
# Change Redis port in .env
REDIS_PORT=6380

# Start Redis on custom port
redis-server --port 6380
```

### Memory Issues
```bash
# Check Redis memory usage
redis-cli INFO memory

# Set max memory limit
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 📈 Monitoring

### Redis CLI Commands
```bash
# Monitor real-time commands
redis-cli MONITOR

# Check all room keys
redis-cli KEYS "room:*"

# Get room state
redis-cli GET "room:1:state"

# Get votes
redis-cli HGETALL "room:1:votes"

# Check memory
redis-cli INFO memory

# Check connected clients
redis-cli CLIENT LIST
```

---

## 🔐 Production Recommendations

### 1. Enable Redis Authentication
```bash
# In redis.conf
requirepass your_strong_password_here

# In .env
REDIS_PASSWORD=your_strong_password_here
```

### 2. Configure Persistence
```bash
# In redis.conf
save 900 1      # Save after 900 sec if 1 key changed
save 300 10     # Save after 300 sec if 10 keys changed
save 60 10000   # Save after 60 sec if 10000 keys changed
```

### 3. Set Memory Limits
```bash
# In redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### 4. Use Redis Sentinel (High Availability)
```bash
# For production with multiple servers
redis-sentinel /path/to/sentinel.conf
```

---

## 🎓 Key Files Modified

1. **src/config/redis.js** - Redis connection & RoomStateManager
2. **src/socket.js** - Refactored to use Redis instead of Maps
3. **src/utils/cleanup.js** - Periodic cleanup scheduler
4. **server.js** - Redis initialization & graceful shutdown
5. **package.json** - Added ioredis dependency
6. **.env.example** - Redis configuration template

---

## 🚨 Migration Checklist

- [x] Install Redis server
- [x] Install ioredis package
- [x] Create Redis config module
- [x] Refactor socket.js state management
- [x] Add cleanup scheduler
- [x] Update server.js initialization
- [x] Add graceful shutdown
- [x] Update .env.example
- [ ] Test room creation & joining
- [ ] Test voting & state persistence
- [ ] Test server restart (state survives)
- [ ] Monitor Redis memory usage
- [ ] Deploy to production

---

## 📞 Support

If you encounter issues:
1. Check Redis is running: `redis-cli ping`
2. Check logs for errors
3. Verify .env configuration
4. Test Redis connection: `redis-cli`

---

## 🎉 Success Indicators

✅ Server starts without errors
✅ `redis-cli KEYS "room:*"` shows active rooms
✅ Room state persists after server restart
✅ No memory leak warnings in logs
✅ Cleanup scheduler runs every 30 minutes

**Memory Leak Fixed! 🎊**
