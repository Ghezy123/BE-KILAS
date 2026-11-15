const { Router } = require('express');
const controller = require('../controllers/user.controller');

const router = Router();

// GET /api/users/search?q=
router.get('/search', controller.searchUsers);

// GET /api/users/:username (Profil publik untuk QR Profile & link)
router.get('/:username', controller.getUserByUsername);

module.exports = router;

