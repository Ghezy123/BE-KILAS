const { Router } = require('express');
const controller = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// GET /api/users/me/activities (Riwayat aktivitas user yang sedang login)
router.get('/me/activities', requireAuth, controller.getMyActivities);

// GET /api/users/search?q=
router.get('/search', controller.searchUsers);

// GET /api/users/:username (Profil publik untuk QR Profile & link)
router.get('/:username', controller.getUserByUsername);

module.exports = router;


