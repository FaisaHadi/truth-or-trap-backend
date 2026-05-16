# Truth or Trap - Backend

Backend API untuk game edukasi literasi digital "Truth or Trap".

## 🚨 CRITICAL FIX - Memory Leak Resolved

**Status**: ✅ Fixed dengan Redis migration

Sebelumnya backend menggunakan in-memory Maps yang menyebabkan memory leak. Sekarang menggunakan Redis untuk state management yang persistent dan scalable.

📖 **Baca**: [QUICKSTART.md](QUICKSTART.md) untuk setup cepat (5 menit)

---

## 🛠️ Tech Stack

- **Runtime**: Node.js + Express.js
- **Database**: MySQL
- **Cache/State**: Redis (NEW!)
- **Real-time**: Socket.IO
- **Auth**: JWT + bcrypt

---

## 📋 Prerequisites

- Node.js 16+
- MySQL 8.0+
- **Redis 6.0+** (NEW - Required!)

---

## 🚀 Quick Start

### 1. Install Redis

**Windows**: Download [Memurai](https://www.memurai.com/get-memurai)
**macOS**: `brew install redis && brew services start redis`
**Linux**: `sudo apt install redis-server`

### 2. Setup Backend

```bash
# Install dependencies
npm install

# Setup environment
copy .env.example .env
# Edit .env: Set JWT_SECRET and Redis config

# Initialize database
npm run init-db

# Start server
npm run dev
```

### 3. Verify

```bash
# Check Redis
redis-cli ping  # Should return: PONG

# Server should show:
# ✅ MySQL connected successfully
# ✅ Redis connected successfully
# 🚀 Server running on http://localhost:5000
```

---

## 📁 Project Structure

```
backend-pemweb/
├── src/
│   ├── config/
│   │   ├── db.js           # MySQL connection
│   │   └── redis.js        # Redis + RoomStateManager (NEW!)
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth & validation
│   ├── routes/             # API routes
│   ├── utils/
│   │   └── cleanup.js      # Redis cleanup scheduler (NEW!)
│   ├── app.js              # Express app
│   └── socket.js           # Socket.IO (Refactored for Redis)
├── database/
│   └── schema.sql          # Database schema
├── server.js               # Entry point
├── .env.example            # Environment template
└── package.json
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - List rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create room
- `POST /api/rooms/:id/join` - Join room
- `POST /api/rooms/:id/leave` - Leave room

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/online` - Online users
- `GET /api/users/leaderboard` - Leaderboard

### Scores
- `GET /api/scores/me` - My scores
- `GET /api/scores/leaderboard` - Global leaderboard
- `GET /api/scores/room/:roomId` - Room scores

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - Manage users
- `PUT /api/admin/users/:id/role` - Change role
- `DELETE /api/admin/users/:id` - Delete user

---

## 🎮 Socket.IO Events

### Client → Server
- `room:join` - Join room
- `room:leave` - Leave room
- `ready:toggle` - Toggle ready status
- `chat:message` - Send message
- `game:start` - Start game (host only)
- `vote:submit` - Submit vote
- `player:sync` - Sync state

### Server → Client
- `user_join` - User joined room
- `user_leave` - User left room
- `ready_update` - Ready status changed
- `receive_message` - New message
- `start_game` - Game started
- `update_story_state` - State update
- `vote_decision` - Vote submitted
- `next_story` - Next scenario
- `game_end` - Game ended
- `online_status` - User online/offline

---

## 🗄️ Redis Data Structure

```
room:{roomId}:state        # Room state (JSON)
room:{roomId}:votes        # Hash: userId → choiceId
room:{roomId}:ready        # Hash: userId → 0/1
```

**TTL**: 24 hours (auto-cleanup after 2 hours if game ended)

---

## 🔧 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=truth_or_trap

# JWT (REQUIRED - No fallback!)
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
CLIENT_URL=http://localhost:3000

# Redis (NEW!)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Game Config
GAME_TIMER_SECONDS=60
GAME_INTRO_SECONDS=3
GAME_VOTING_SECONDS=30
MIN_PLAYERS=2
```

---

## 🧪 Testing

### Manual Testing
```bash
# 1. Create room via API
curl -X POST http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room"}'

# 2. Check Redis
redis-cli KEYS "room:*"
redis-cli GET "room:1:state"
```

### Redis Monitoring
```bash
# Real-time commands
redis-cli MONITOR

# Memory usage
redis-cli INFO memory

# Connected clients
redis-cli CLIENT LIST
```

---

## 📊 Performance

| Metric | Before | After |
|--------|--------|-------|
| Memory leak | Yes | No ✅ |
| State persistence | No | Yes ✅ |
| Max uptime | 24h | Unlimited ✅ |
| Scalability | 1 server | N servers ✅ |

---

## 🐛 Troubleshooting

### Redis Connection Failed
```bash
# Check if running
redis-cli ping

# Start Redis
redis-server
```

### JWT Secret Error
```bash
# Make sure .env has:
JWT_SECRET=your_actual_secret_here
```

### Database Connection Failed
```bash
# Check MySQL is running
# Verify credentials in .env
# Run: npm run init-db
```

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- [REDIS_MIGRATION.md](REDIS_MIGRATION.md) - Detailed Redis guide
- [CRITICAL_FIX_SUMMARY.md](CRITICAL_FIX_SUMMARY.md) - Technical details

---

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Set NODE_ENV
export NODE_ENV=production

# Start with PM2
pm2 start server.js --name truth-or-trap

# Or use npm
npm start
```

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation (express-validator)
- ✅ SQL injection protection (prepared statements)
- ✅ CORS configuration
- ⚠️ Add rate limiting for production
- ⚠️ Enable Redis authentication for production

---

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server (nodemon)
npm run init-db    # Initialize database
```

---

## 🤝 Contributing

1. Fix critical bugs first (see CRITICAL_FIX_SUMMARY.md)
2. Follow existing code style
3. Test with Redis before committing
4. Update documentation

---

## 📄 License

ISC

---

## 👥 Team

Educational project - Truth or Trap

---

**Version**: 1.0.0 (Redis Migration)
**Last Updated**: 2024
**Status**: ✅ Production Ready (after Redis setup)
