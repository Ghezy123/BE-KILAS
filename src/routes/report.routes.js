const { Router } = require('express');
const controller = require('../controllers/report.controller');
const validate = require('../middlewares/validate');
const { requireAuth, optionalAuth } = require('../middlewares/auth');
const { uploadReportMedia } = require('../middlewares/upload');
const schemas = require('../validators/report.validator');

const router = Router();

// GET /api/reports - Feed laporan dengan filter, sortir, dan paginasi
router.get('/', optionalAuth, validate({ query: schemas.getReportsQuery }), controller.getReports);

// GET /api/reports/bookmarks - Koleksi laporan yang dibookmark oleh user (FR-A7)
// Wajib sebelum /:id agar 'bookmarks' tidak dianggap sebagai parameter id
router.get('/bookmarks', requireAuth, controller.getUserBookmarks);

// GET /api/reports/:id - Detail lengkap satu laporan (FR-A4)
router.get('/:id', optionalAuth, controller.getReportById);

// POST /api/reports - Buat laporan baru dengan media upload (FR-A1)
router.post(
  '/',
  requireAuth,
  uploadReportMedia,
  validate({ body: schemas.createReport }),
  controller.createReport,
);

// PUT /api/reports/:id - Edit laporan sendiri maks. 24 jam (FR-A2)
router.put(
  '/:id',
  requireAuth,
  uploadReportMedia,
  validate({ body: schemas.updateReport }),
  controller.updateReport,
);

// DELETE /api/reports/:id - Hapus laporan sendiri permanen (FR-A3)
router.delete('/:id', requireAuth, controller.deleteReport);

// POST /api/reports/:id/upvote - Toggle upvote laporan (FR-A5 & FR-A8)
router.post('/:id/upvote', requireAuth, controller.toggleUpvote);

// POST /api/reports/:id/bookmark - Toggle bookmark laporan (FR-A6)
router.post('/:id/bookmark', requireAuth, controller.toggleBookmark);

module.exports = router;
