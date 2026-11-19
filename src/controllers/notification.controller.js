const prisma = require('../lib/prisma');
const { ok } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mapped = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      timestamp: n.createdAt.toISOString(),
      is_read: n.isRead,
      report_id: n.reportId,
    }));

    return ok(res, mapped);
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== req.userId) {
      throw AppError.notFound('Notifikasi tidak ditemukan');
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return ok(res, { id, is_read: true });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });

    return ok(res, { message: 'Semua notifikasi telah ditandai sudah dibaca' });
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== req.userId) {
      throw AppError.notFound('Notifikasi tidak ditemukan');
    }

    await prisma.notification.delete({
      where: { id },
    });

    return ok(res, { message: 'Notifikasi berhasil dihapus' });
  } catch (error) {
    next(error);
  }
}

async function clearAllNotifications(req, res, next) {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.userId },
    });

    return ok(res, { message: 'Semua notifikasi berhasil dibersihkan' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
