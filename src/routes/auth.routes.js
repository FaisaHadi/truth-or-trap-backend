const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate }    = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

router.post('/register',
  authLimiter, // Rate limit: 5 attempts per 15 min
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  ctrl.register
);

router.post('/login',
  authLimiter, // Rate limit: 5 attempts per 15 min
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  ctrl.login
);

router.post('/logout', verifyToken, ctrl.logout);
router.get('/me',     verifyToken, ctrl.me);

module.exports = router;
