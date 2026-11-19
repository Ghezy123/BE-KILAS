const { Router } = require('express');
const controller = require('../controllers/notification.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.use(requireAuth);

router.get('/', controller.getNotifications);
router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);
router.delete('/:id', controller.deleteNotification);
router.delete('/', controller.clearAllNotifications);

module.exports = router;
