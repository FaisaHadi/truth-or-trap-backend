# 🚀 Quick Start - Redis Migration

## ⚡ 5-Minute Setup

### Step 1: Install Redis (Choose One)

**Windows - Memurai (Recommended)**
```bash
# Download: https://www.memurai.com/get-memurai
# Install and it runs automatically
```

**Windows - WSL2**
```bash
wsl --install
wsl
sudo apt update && sudo apt install redis-server -y
sudo service redis-server start
```

**macOS**
```bash
brew install redis && brew services start redis
```

**Linux**
```bash
sudo apt install redis-server -y
sudo systemctl start redis && sudo systemctl enable redis
```

### Step 2: Setup Backend
```bash
cd backend-pemweb
npm install
copy .env.example .env
# Edit .env: Set JWT_SECRET=your_secret_here
```

### Step 3: Verify
```bash
redis-cli ping  # Should return: PONG
```

### Step 4: Run
```bash
npm run init-db  # First time only
npm run dev
```

---

## ✅ Verification

```bash
# Check Redis is working
redis-cli KEYS "*"

# Create a room in the app, then:
redis-cli KEYS "room:*"

# Should see: room:1:state, room:1:votes, room:1:ready
```

---

## 🐛 Troubleshooting

### Redis not found
```bash
# Check if running
redis-cli ping

# Start manually
redis-server
```

### Port conflict
```bash
# Change in .env
REDIS_PORT=6380

# Start on custom port
redis-server --port 6380
```

### Connection refused
```bash
# Check Redis status
# Windows: Check Task Manager
# Linux: sudo systemctl status redis
```

---

## 📊 What Changed?

**Before**: `const roomStates = new Map()` ❌ Memory leak
**After**: `await RoomStateManager.setState()` ✅ Persistent

**Impact**: 
- ✅ No more memory leaks
- ✅ State survives restart
- ✅ Ready for scaling

---

## 🔍 Monitoring

```bash
# Real-time monitoring
redis-cli MONITOR

# Memory usage
redis-cli INFO memory

# All room keys
redis-cli KEYS "room:*"
```

---

## 📞 Need Help?

1. Read: `REDIS_MIGRATION.md` (detailed guide)
2. Read: `CRITICAL_FIX_SUMMARY.md` (technical details)
3. Check logs for errors
4. Verify .env configuration

---

**That's it! You're ready to go! 🎉**
