const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/room.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createRoomLimiter } = require('../middleware/rateLimit.middleware');

router.get('/',       verifyToken, ctrl.getRooms);
router.get('/:id',    verifyToken, ctrl.getRoomById);

router.post('/',
  verifyToken,
  createRoomLimiter, // Rate limit: 10 rooms per hour
  [body('name').trim().isLength({ min: 3 }).withMessage('Room name must be at least 3 characters')],
  validate,
  ctrl.createRoom
);

router.post('/:id/join',  verifyToken, ctrl.joinRoom);
router.post('/:id/leave', verifyToken, ctrl.leaveRoom);
router.put('/:id/status', verifyToken, ctrl.updateRoomStatus);
router.delete('/:id',     verifyAdmin,  ctrl.deleteRoom);

module.exports = router;
