const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const schemas = require('../validators/auth.validator');

const router = Router();

router.post('/register', validate({ body: schemas.register }), controller.register);
router.post('/login', validate({ body: schemas.login }), controller.login);
router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);

module.exports = router;
