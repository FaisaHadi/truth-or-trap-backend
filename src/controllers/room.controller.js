const db   = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.*, u.username AS host_name,
             n.title AS news_title,
             COUNT(DISTINCT rm.user_id) AS player_count
      FROM rooms r
      LEFT JOIN users u  ON r.host_id = u.id
      LEFT JOIN news  n  ON r.news_id  = n.id
      LEFT JOIN room_members rm ON r.id = rm.room_id AND rm.left_at IS NULL
      WHERE r.status != 'closed'
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, rooms: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const [rooms] = await db.execute('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (rooms.length === 0) return res.status(404).json({ success: false, message: 'Room not found' });

    const [members] = await db.execute(`
      SELECT u.id, u.username, u.avatar, u.trust_score, u.reputation,
             MAX(COALESCE(rm.is_ready, 0)) AS is_ready, MIN(rm.joined_at) AS joined_at
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ? AND rm.left_at IS NULL
      GROUP BY u.id, u.username, u.avatar, u.trust_score, u.reputation
      ORDER BY joined_at ASC
    `, [req.params.id]);

    const [messages] = await db.execute(`
      SELECT m.*, u.username, u.avatar FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at ASC
      LIMIT 100
    `, [req.params.id]);

    res.json({ success: true, room: rooms[0], members, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/rooms  — create room
const createRoom = async (req, res) => {
  try {
    const { name, news_id, max_players, is_private, password } = req.body;
    const roomCode = uuidv4().substring(0, 8).toUpperCase();

    // Hash password if room is private
    let hashedPassword = null;
    if (is_private && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await db.execute(
      `INSERT INTO rooms (name, code, host_id, news_id, max_players, is_private, password, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
      [name, roomCode, req.user.id, news_id || null, max_players || 10, is_private ? 1 : 0, hashedPassword]
    );

    // Host joins automatically
    await db.execute('INSERT INTO room_members (room_id, user_id, is_ready) VALUES (?, ?, 0)', [result.insertId, req.user.id]);

    res.status(201).json({ success: true, message: 'Room created', roomId: result.insertId, roomCode });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/rooms/:id/join
const joinRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;
    const { password } = req.body; // Password from request body

    const [rooms] = await db.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) return res.status(404).json({ success: false, message: 'Room not found' });
    const room = rooms[0];

    if (room.status === 'closed') return res.status(400).json({ success: false, message: 'Room is closed' });

    // Check password for private rooms
    if (room.is_private && room.password) {
      if (!password) {
        return res.status(401).json({ success: false, message: 'Password required' });
      }
      const passwordMatch = await bcrypt.compare(password, room.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }
    }

    // Check if already in room
    const [existing] = await db.execute(
      'SELECT id FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL', [roomId, userId]
    );
    if (existing.length > 0) return res.json({ success: true, message: 'Already in room' });

    // Check capacity
    const [count] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM room_members WHERE room_id = ? AND left_at IS NULL', [roomId]
    );
    if (count[0].cnt >= room.max_players) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    const [oldMember] = await db.execute(
      'SELECT id FROM room_members WHERE room_id = ? AND user_id = ? ORDER BY id ASC LIMIT 1',
      [roomId, userId]
    );
    if (oldMember.length) {
      await db.execute('UPDATE room_members SET left_at = NULL WHERE id = ?', [oldMember[0].id]);
    } else {
      await db.execute('INSERT INTO room_members (room_id, user_id, is_ready) VALUES (?, ?, 0)', [roomId, userId]);
    }
    res.json({ success: true, message: 'Joined room' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/rooms/:id/leave
const leaveRoom = async (req, res) => {
  try {
    await db.execute(
        'UPDATE room_members SET left_at = NOW(), is_ready = 0 WHERE room_id = ? AND user_id = ? AND left_at IS NULL',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Left room' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/rooms/:id/status  — admin or host
const updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE rooms SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Room status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
  try {
    await db.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getRooms, getRoomById, createRoom, joinRoom, leaveRoom, updateRoomStatus, deleteRoom };
