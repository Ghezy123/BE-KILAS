const { Prisma } = require('@prisma/client');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/** Dipasang setelah semua route: endpoint yang tidak ada -> 404. */
function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`));
}

/** Pesan 409 berdasarkan kolom unik yang bentrok (Prisma P2002). */
function duplicateMessage(target) {
  const t = String(Array.isArray(target) ? target.join(',') : target ?? '');
  if (t.includes('email')) return 'Email sudah terdaftar';
  if (t.includes('username')) return 'Username sudah dipakai';
  return 'Data sudah terdaftar';
}

/** Ubah error dari library (Prisma, multer, body-parser) menjadi AppError. */
function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return AppError.duplicate(duplicateMessage(err.meta?.target));
    if (err.code === 'P2025') return AppError.notFound();
  }

  // multer (dipasang di Langkah K). Dicek lewat nama agar tidak perlu require multer di sini.
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError(413, 'MEDIA_TOO_LARGE', 'Ukuran file melebihi batas');
    }
    return AppError.mediaInvalid('Media tidak valid');
  }

  // express.json(): body bukan JSON valid / terlalu besar
  if (err.type === 'entity.parse.failed') {
    return AppError.validation(null, 'Format data (JSON) tidak valid');
  }
  if (err.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Data yang dikirim terlalu besar');
  }

  return null;
}

// Express mengenali error handler dari 4 parameter, jadi `next` wajib ada.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const appError = normalize(err);

  if (!appError) {
    // Error tak terduga: detail hanya di log, pesan ke klien generik.
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan pada server, coba lagi nanti',
        details: env.NODE_ENV === 'development' ? String(err?.message ?? err) : null,
      },
    });
  }

  return res.status(appError.status).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details ?? null,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
